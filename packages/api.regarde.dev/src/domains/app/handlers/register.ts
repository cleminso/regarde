import {
  App,
  RegistryWorkerAccount,
  type TAllRegistryAppsSchema,
  AppsByUserRecord,
  RegistryAppMetadata,
} from "@regarde-dev/sdk/registry";
import { Loaded, co } from "jazz-tools";
import { randomBytes } from "crypto";

export const registerAppHandler = (
  appsRecord: TAllRegistryAppsSchema,
  appsByUserRecord: AppsByUserRecord,
  worker: Loaded<typeof RegistryWorkerAccount>,
) => {
  return async (c: any) => {
    try {
      const { name, paymentProvider, ownerAccountId } = await c.req.json();

      // Generate Webhook Secret
      const webhookSecret = randomBytes(20).toString("hex");

      const newApp = App.create(
        {
          name,
          description: "",
          ownerAccountId,
          paymentProvider,
          isEnabled: false,
          createdAt: Date.now(),
          metadata: {},
          webhookSecret,
          payments: [],
          paymentsByUser: {},
        },
        worker,
      );

      // Access ID via $jazz object as .id direct access defaults to undefined on strict proxied creation
      const appId = newApp.$jazz.id;

      if (!appId) throw new Error("Failed to resolve App ID");

      // Use direct assignment as appsRecord is a CoMap proxy
      appsRecord.$jazz.set(
        appId,
        RegistryAppMetadata.create(
          {
            app: newApp,
            isVerified: true,
            hasAccess: false,
            webhookConfigured: false,
            createdAt: Date.now(),
            version: 1,
          },
          worker,
        ),
      );

      if (!appsByUserRecord[ownerAccountId]) {
        const newList = co
          .list(RegistryAppMetadata)
          .create([], { owner: worker });
        appsByUserRecord.$jazz.set(ownerAccountId, newList);
      }


      // Push to the list
      await appsByUserRecord.$jazz.ensureLoaded({
        resolve: {
          [ownerAccountId]: {},
        },
      });
      const userAppsList = appsByUserRecord[ownerAccountId];

      if (userAppsList && userAppsList.$isLoaded) {
        userAppsList.$jazz.push(
          RegistryAppMetadata.create(
            {
              app: newApp,
              isVerified: true,
              hasAccess: false,
              webhookConfigured: false,
              createdAt: Date.now(),
              version: 1,
            },
            worker,
          ),
        );
      }

      const webhookUrl = `https://api.regarde.dev/webhooks/${paymentProvider}/${appId}`;

      return c.json(
        {
          appId,
          webhookUrl,
          webhookSecret,
        },
        200,
      );
    } catch (error: any) {
      console.error("Register App Error:", error);
      return c.json({ error: error.message || "Internal Server Error" }, 500);
    }
  };
};
