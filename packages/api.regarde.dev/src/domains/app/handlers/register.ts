import {
  RegistryWorkerAccount,
  type TAllRegistryAppsSchema,
  type TAppsByUserRecord,
  RegistryAppMetadata,
  App,
  useLogging,
} from "@regarde-dev/core";

import { Loaded, co } from "jazz-tools";
import { randomBytes } from "node:crypto";
import { verifyRegardeAuth } from "#/domains/auth/handlers/verify";

const logger = useLogging({
  module: __filename,
});

export const registerAppHandler = (
  appsRecord: TAllRegistryAppsSchema,
  appsByUserRecord: TAppsByUserRecord,
  worker: Loaded<typeof RegistryWorkerAccount>,
) => {
  return async (c: any) => {
    try {
      const regardeAuth = c.req.header("X-Regarde-Token");
      const regardeAuthId = c.req.header("X-Regarde-Token-Id");

      const workerId = process.env.REGARDE_REGISTRY_GROUP;
      if (!workerId) {
        logger.debug({
          message: "Starting register app handler, checking registry group",
          data: { metadata: { workerId } },
        });
        throw new Error(
          "Missing `REGARDE_REGISTRY_GROUP` required environment variable",
        );
      }

      const regardeAuthHeaderExists =
        regardeAuth !== null && regardeAuth !== undefined;
      if (regardeAuthHeaderExists === false) {
        logger.error({
          message: "Missing registration token header",
          data: {
            authNull: regardeAuth === null,
            authUndefined: regardeAuth === undefined,
          },
        });
        return c.json({ error: "Missing registration token header" }, 401);
      } // reject bad requests as early as possible

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
        logger.error({
          message: "Authentication failed",
          data: {
            jazzAccountId,
            authFailureReason: verificationResult.error,
          },
        });
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
        logger.error({
          message: "App not found or failed to load",
          data: {
            appId,
          },
        });
        return c.json({ error: "App not found" }, 404);
      }

      // Load userAccount directly using jazzAccountId from request
      const userAccount = await co.account().load(jazzAccountId, {
        loadAs: worker,
      });

      const userAccountLoaded =
        userAccount !== null && userAccount.$isLoaded === true;
      if (userAccountLoaded === false) {
        logger.error({
          message: "User account not found or failed to load",
          data: {
            jazzAccountId,
          },
        });
        return c.json({ error: "User account not found" }, 404);
      }

      // Verify user has admin write permissions on the App
      const userCanAdminApp = userAccount.canAdmin(app);
      if (userCanAdminApp === false) {
        logger.warn({
          message: "Permission denied - user cannot admin App",
          data: {
            metadata: {
              operation: "verify admin permissions",
            },
            jazzAccountId,
            appId,
            userAccountLoaded: userAccount.$isLoaded,
            appLoaded: app.$isLoaded,
          },
        });
        return c.json(
          {
            error:
              "Permission denied: User does not have admin access to the App",
          },
          403,
        );
      }

      // Load the registry owner group (worker is added as "writer" in initRegardeSDK)
      const registryProfileWorkerGroup = await co.group().load(workerId, {
        loadAs: worker,
      });

      const registryGroupLoaded = registryProfileWorkerGroup.$isLoaded === true;
      if (registryGroupLoaded === false) {
        logger.error({
          message: "Failed to load registryProfileWorkerGroup",
          data: {
            metadata: {
              operation: "load registry worker group",
            },
            appId,
            workerId,
            workerAccountId: worker.$jazz.id,
          },
        });
        return c.json({ error: "Failed to load registry owner group" }, 500);
      }

      let webhookSecret: string;

      const webhookSecretExists =
        app.webhookSecret !== null &&
        app.webhookSecret !== undefined &&
        app.webhookSecret !== "";
      if (webhookSecretExists === false) {
        webhookSecret = randomBytes(20).toString("hex");
        app.$jazz.set("webhookSecret", webhookSecret);
        await app.$jazz.waitForSync();
      } else {
        webhookSecret = app.webhookSecret;
      }

      const webhookUrl = `https://api.regarde.dev/webhooks/${app.paymentProvider}/${appId}`;

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

      const responseData = {
        appId,
        webhookUrl,
        webhookSecret,
      };

      const response = c.json(responseData, 200);
      return response;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Internal Server Error";

      logger.error({
        message: "Register app handler failed",
        data: {
          errorMessage,
          errorType:
            error instanceof Error ? error.constructor.name : "Unknown",
        },
      });
      return c.json({ error: errorMessage }, 500);
    }
  };
};
