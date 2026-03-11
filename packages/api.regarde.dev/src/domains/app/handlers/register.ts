import { Loaded, co } from "jazz-tools";

import { verifyRegardeAuth } from "#/domains/auth/handlers/verify";
import {
  RegistryWorkerAccount,
  type TAllRegistryAppsSchema,
  type TRegardeAppsByUserRecord,
  RegardeRegistryAppMetadata,
  RegardeApp,
  useLogging,
} from "@regarde-dev/core";

const logger = useLogging({
  module: import.meta.filename,
});

export const registerAppHandler = (
  appsRecord: TAllRegistryAppsSchema,
  appsByUserRecord: TRegardeAppsByUserRecord,
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
        throw new Error("Missing `REGARDE_REGISTRY_GROUP` required environment variable");
      }

      const isRegardeAuthHeaderExists = regardeAuth !== null && regardeAuth !== undefined;
      if (isRegardeAuthHeaderExists === false) {
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

      const isAuthenticationValid = verificationResult.isValid === true;
      if (isAuthenticationValid === false) {
        logger.error({
          message: "Authentication failed",
          data: {
            jazzAccountId,
            authFailureReason: verificationResult.error,
          },
        });
        return c.json({ error: `Authentication failed: ${verificationResult.error}` }, 403);
      }

      // Load the App to verify user has admin write permissions
      const app = await RegardeApp.load(appId, {
        loadAs: worker,
        resolve: {
          webhooks: { $each: true },
        },
      });

      const isAppLoaded = app !== null && app.$isLoaded === true;
      if (isAppLoaded === false) {
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

      const isUserAccountLoaded = userAccount !== null && userAccount.$isLoaded === true;
      if (isUserAccountLoaded === false) {
        logger.error({
          message: "User account not found or failed to load",
          data: {
            jazzAccountId,
          },
        });
        return c.json({ error: "User account not found" }, 404);
      }

      // Verify user has admin write permissions on the App
      const isUserCanAdminApp = userAccount.canAdmin(app);
      if (isUserCanAdminApp === false) {
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
            error: "Permission denied: User does not have admin access to the App",
          },
          403,
        );
      }

      // Load the registry owner group (worker is added as "writer" in initRegardeSDK)
      const registryProfileWorkerGroup = await co.group().load(workerId, {
        loadAs: worker,
      });

      const isRegistryGroupLoaded = registryProfileWorkerGroup.$isLoaded === true;
      if (isRegistryGroupLoaded === false) {
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

      // Check if app has any enabled webhooks
      const isWebhooksLoaded = app.webhooks !== null && app.webhooks.$isLoaded === true;
      const hasEnabledWebhooks =
        isWebhooksLoaded === true &&
        app.webhooks.some((w) => w !== null && w.$isLoaded === true && w.isEnabled === true);

      const metadata = RegardeRegistryAppMetadata.create(
        {
          app: app,
          isVerified: true,
          hasAccess: false,
          webhookConfigured: hasEnabledWebhooks,
          createdAt: Date.now(),
          version: 1,
        },
        registryProfileWorkerGroup,
      );

      appsRecord.$jazz.set(appId, metadata);
      await appsRecord.$jazz.waitForSync();

      const isUserAppsListExists =
        appsByUserRecord[jazzAccountId] !== null && appsByUserRecord[jazzAccountId] !== undefined;
      if (isUserAppsListExists === false) {
        appsByUserRecord.$jazz.set(
          jazzAccountId,
          co.list(RegardeRegistryAppMetadata).create([], registryProfileWorkerGroup),
        );
        await appsByUserRecord.$jazz.waitForSync();
      }

      const userAppsList = appsByUserRecord[jazzAccountId];

      const isUserAppsListValid = userAppsList !== undefined && userAppsList.$isLoaded === true;

      if (isUserAppsListValid === true) {
        userAppsList.$jazz.push(metadata);
        await appsByUserRecord.$jazz.waitForSync();
      }

      const response = c.json({ appId }, 200);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Internal Server Error";

      logger.error({
        message: "Register app handler failed",
        data: {
          errorMessage,
          errorType: error instanceof Error ? error.constructor.name : "Unknown",
        },
      });
      return c.json({ error: errorMessage }, 500);
    }
  };
};
