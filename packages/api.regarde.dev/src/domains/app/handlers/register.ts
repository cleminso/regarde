import {
  RegistryWorkerAccount,
  type TAllRegistryAppsSchema,
  type TAppsByUserRecord,
  RegistryAppMetadata,
  App,
} from "@regarde-dev/core";

import { Loaded, co } from "jazz-tools";
import { randomBytes } from "node:crypto";
import { verifyRegardeAuth } from "#/domains/auth/handlers/verify";

export const registerAppHandler = (
  appsRecord: TAllRegistryAppsSchema,
  appsByUserRecord: TAppsByUserRecord,
  worker: Loaded<typeof RegistryWorkerAccount>,
) => {
  return async (c: any) => {
    try {
      const regardeAuth = c.req.header("X-Regarde-Token");
      const regardeAuthId = c.req.header("X-Regarde-Token-Id");

      const regardeAuthHeaderExists =
        regardeAuth !== null && regardeAuth !== undefined;
      if (regardeAuthHeaderExists === false) {
        return c.json({ error: "Missing registration token header" }, 401);
      }

      const { appId, jazzAccountId } = await c.req.json();

      // Verify authentication using the provided jazzAccountId
      const verificationResult = await verifyRegardeAuth(
        jazzAccountId,
        regardeAuth,
        regardeAuthId,
        worker,
      );

      const authenticationValid = verificationResult.isValid === true;
      if (authenticationValid === false) {
        return c.json(
          { error: `Authentication failed: ${verificationResult.error}` },
          403,
        );
      }

      // Load the App to verify user has admin write permissions
      const app = await App.load(appId, {
        loadAs: worker,
        resolve: true,
      });

      const appLoaded = app !== null && app.$isLoaded === true;
      if (appLoaded === false) {
        return c.json({ error: "App not found or not accessible" }, 404);
      }

      // Load userAccount directly using jazzAccountId from request
      const userAccount = await co.account().load(jazzAccountId, {
        loadAs: worker,
      });

      const userAccountLoaded =
        userAccount !== null && userAccount.$isLoaded === true;
      if (userAccountLoaded === false) {
        return c.json({ error: "User account not found" }, 404);
      }

      // Verify user has admin write permissions on the App
      const userCanAdminApp = userAccount.canAdmin(app);
      if (userCanAdminApp === false) {
        return c.json(
          {
            error:
              "Permission denied: User does not have admin access to the App",
          },
          403,
        );
      }

      // Load the registry owner group (worker is added as "writer" in initRegardeSDK)
      const registryProfileWorkerGroup = await co
        .group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", { loadAs: worker });

      const registryGroupLoaded = registryProfileWorkerGroup.$isLoaded === true;
      if (registryGroupLoaded === false) {
        return c.json({ error: "Failed to load registry owner group" }, 500);
      }

      let webhookSecret: string;

      const webhookSecretExists =
        app.webhookSecret !== null && app.webhookSecret !== undefined;
      if (webhookSecretExists === false) {
        webhookSecret = randomBytes(20).toString("hex");
        app.$jazz.set("webhookSecret", webhookSecret);
        await app.$jazz.waitForSync();
      } else {
        webhookSecret = app.webhookSecret;
      }

      const webhookUrl = `https://api.regarde.dev/webhooks/${app.paymentProvider}/${appId}`;

      console.log("Registration completed successfully, adding to registry");

      const metadata = RegistryAppMetadata.create(
        {
          app: app,
          isVerified: true,
          hasAccess: false,
          webhookConfigured: false,
          createdAt: Date.now(),
          version: 1,
        },
        registryProfileWorkerGroup,
      );

      appsRecord.$jazz.set(appId, metadata);
      await appsRecord.$jazz.waitForSync();

      const userAppsListExists =
        appsByUserRecord[jazzAccountId] !== null &&
        appsByUserRecord[jazzAccountId] !== undefined;
      if (userAppsListExists === false) {
        appsByUserRecord.$jazz.set(
          jazzAccountId,
          co.list(RegistryAppMetadata).create([], registryProfileWorkerGroup),
        );
        await appsByUserRecord.$jazz.waitForSync();
      }

      const userAppsList = appsByUserRecord[jazzAccountId];

      const userAppsListValid =
        userAppsList !== undefined && userAppsList.$isLoaded === true;

      if (userAppsListValid === true) {
        userAppsList.$jazz.push(metadata);
        await appsByUserRecord.$jazz.waitForSync();
      }

      console.log("Creating JSON response with data:", {
        appId,
        webhookUrl,
        webhookSecret,
      });

      const responseData = {
        appId,
        webhookUrl,
        webhookSecret,
      };

      console.log("About to call c.json()");

      const response = c.json(responseData, 200);
      console.log("Response created:", response);
      return response;
    } catch (error: unknown) {
      console.error("Register App Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Internal Server Error";
      return c.json({ error: errorMessage }, 500);
    }
  };
};
