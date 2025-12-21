import {
  RegistryWorkerAccount,
  type TAllRegistryAppsSchema,
  AppsByUserRecord,
  RegistryAppMetadata,
} from "@regarde-dev/sdk/registry";
import { App } from "@regarde-dev/sdk/payments";
import { Loaded, co } from "jazz-tools";
import { randomBytes } from "crypto";
import { verifyRegardeAuth } from "#/domains/auth/handlers/verify";

export const registerAppHandler = (
  appsRecord: TAllRegistryAppsSchema,
  appsByUserRecord: AppsByUserRecord,
  worker: Loaded<typeof RegistryWorkerAccount>,
) => {
  return async (c: any) => {
    try {
      // Extract authentication headers
      const regardeAuth = c.req.header("X-Regarde-Token");
      const regardeAuthId = c.req.header("X-Regarde-Token-Id");

      if (!regardeAuth || !regardeAuthId) {
        console.log(
          "[ERROR] Missing authentication headers for register-app endpoint",
        );
        return c.json({ error: "Missing authentication headers" }, 401);
      }

      // Parse the request body
      const { appId } = await c.req.json();
      if (!appId) {
        return c.json({ error: "appId is required" }, 400);
      }

      // Check if the app exists in the registry record
      if (!appsRecord[appId]) {
        return c.json({ error: "App not found in registry" }, 404);
      }

      // Get the app metadata
      const appMetadata = appsRecord[appId];
      if (!appMetadata || !appMetadata.$isLoaded) {
        return c.json({ error: "App metadata not loaded" }, 500);
      }

      // Load the app using the Jazz resolve pattern
      const resolved = await appMetadata.$jazz.ensureLoaded({
        resolve: {
          app: true,
        },
      });
      const app = resolved.app;
      if (!app || !app.$isLoaded) {
        return c.json({ error: "Failed to load app details" }, 500);
      }

      const ownerAccountId = app.ownerAccountId;
      const paymentProvider = app.paymentProvider;

      // Verify the authentication token before processing
      console.log(`[AUTH] Verifying token for account: ${ownerAccountId}`);
      const verificationResult = await verifyRegardeAuth(
        ownerAccountId,
        regardeAuth,
        regardeAuthId,
      );

      if (!verificationResult.isValid) {
        console.log(
          `[ERROR] Authentication failed for AccountID "${ownerAccountId}": ${verificationResult.error}`,
        );
        return c.json(
          { error: `Authentication failed: ${verificationResult.error}` },
          403,
        );
      }

      console.log(
        `[AUTH] Authentication successful for AccountID "${ownerAccountId}"`,
      );

      // Load the user's account to verify the app is in their myApps list
      const userAccount = await co.account().load(ownerAccountId, {
        loadAs: worker,
        resolve: { root: { ["regarde-sdk"]: true } },
      });

      if (!userAccount.$isLoaded) {
        return c.json({ error: "Failed to load user account" }, 500);
      }

      const regardeSDK = userAccount.root["regarde-sdk"];
      if (!regardeSDK?.$isLoaded) {
        return c.json(
          {
            error:
              "Your account is not properly initialized. Please initialize your account first.",
          },
          400,
        );
      }

      // Verify the app is in the user's myApps list
      await regardeSDK.$jazz.ensureLoaded({ myApps: true });
      const myApps = regardeSDK.myApps;
      if (!myApps?.$isLoaded) {
        return c.json({ error: "Apps list not loaded" }, 400);
      }

      // Verify the app is in the user's myApps list
      // Convert and filter the user apps
      const userApps = Array.from(myApps) as App[];
      const loadedApps = userApps.filter(
        (userApp) => userApp && userApp.$isLoaded,
      );
      const appIsInList = loadedApps.some(
        (userApp) => userApp.$jazz.id === appId,
      );
      if (!appIsInList) {
        return c.json({ error: "App not in user's apps list" }, 403);
      }

      // Generate webhook secret
      const webhookSecret = randomBytes(20).toString("hex");

      // Update the app with the webhook secret (worker has access via group membership)
      app.$jazz.set("webhookSecret", webhookSecret);
      await app.$jazz.waitForSync();

      // Load the registry worker group
      const registryProfileWorkerGroup = await co
        .group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", {
          loadAs: worker,
        });

      if (!registryProfileWorkerGroup.$isLoaded) {
        return c.json({ error: "Failed to load registry group" }, 500);
      }

      // Create registry metadata for the app
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

      // Add app to user's apps list in the registry
      if (!appsByUserRecord[ownerAccountId]) {
        const newList = co
          .list(RegistryAppMetadata)
          .create([], { owner: registryProfileWorkerGroup });
        appsByUserRecord.$jazz.set(ownerAccountId, newList);
      }

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
