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

      // Load the user's account with their RegardeSDK
      const ownerAccount = await co.account().load(ownerAccountId, {
        loadAs: worker,
        resolve: { root: { ["regarde-sdk"]: true } },
      });

      // Check if account loaded successfully
      if (!ownerAccount.$isLoaded) {
        return c.json(
          {
            error: "Failed to load your account. Please try again later.",
          },
          500,
        );
      }

      // Get their RegardeSDK
      const regardeSDK = ownerAccount.root["regarde-sdk"];

      if (!regardeSDK?.$isLoaded) {
        return c.json(
          {
            error:
              "Your account is not properly initialized. Please initialize your account first.",
          },
          400,
        );
      }

      // Get their personal group that owns their RegardeSDK
      const userGroup = regardeSDK.$jazz.owner;

      // Create the App with the proper owner
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
        { owner: userGroup },
      );

      // Access ID via $jazz object as .id direct access defaults to undefined on strict proxied creation
      const appId = newApp.$jazz.id;

      if (!appId) throw new Error("Failed to resolve App ID");

      const registryProfileWorkerGroup = await co
        .group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", {
          loadAs: worker,
        });

      if (!registryProfileWorkerGroup.$isLoaded) {
        return c.json({ error: "Failed to load registry group" }, 500);
      }

      // Direct assignment as appsRecord is a CoMap proxy
      appsRecord.$jazz.set(
        appId,
        RegistryAppMetadata.create(
          {
            app: appId,
            isVerified: true,
            hasAccess: false,
            webhookConfigured: false,
            createdAt: Date.now(),
            version: 1,
          },
          { owner: registryProfileWorkerGroup },
        ),
      );

      if (!appsByUserRecord[ownerAccountId]) {
        const newList = co
          .list(RegistryAppMetadata)
          .create([], { owner: registryProfileWorkerGroup });
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
              app: appId,
              isVerified: true,
              hasAccess: false,
              webhookConfigured: false,
              createdAt: Date.now(),
              version: 1,
            },
            { owner: registryProfileWorkerGroup },
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
