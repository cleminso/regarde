import "dotenv/config";

import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as Honologger } from "hono/logger";
import { Loaded } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";

import { registerAppHandler } from "#/domains/app/handlers/register";
import { verifyHandler } from "#/domains/auth";
import { registerHandler, checkAvailabilityHandler, lookupHandler } from "#/domains/nickname";
import { unifiedWebhookHandler } from "#payments/handlers/unifiedWebhook";
import { RegistryWorkerAccount, TNicknameRegistry, useLogging } from "@regarde-dev/core";

import { rateLimit } from "./middleware/rateLimit.js";
import { checkAvailabilityRoute } from "./routes/checkAvailability.js";
import { lookupRoute } from "./routes/lookup.js";
import { registerRoute } from "./routes/register.js";
import { registerAppRoute } from "./routes/registerApp.js";
import { unifiedWebhookRoute } from "./routes/unifiedWebhook.js";
import { verifyRoute } from "./routes/verifyToken.js";

const logger = useLogging({
  module: import.meta.filename,
});

const PORT = process.env.PORT || 3000;
const JAZZ_SYNC_SERVER_URL = process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";

const APP_PUBLIC_HOSTNAME = process.env.APP_PUBLIC_HOSTNAME || `localhost:${PORT}`;
const IS_PRODUCTION_LIKE =
  APP_PUBLIC_HOSTNAME !== `localhost:${PORT}` && !APP_PUBLIC_HOSTNAME.startsWith("localhost");
const PUBLIC_PROTOCOL = IS_PRODUCTION_LIKE ? "https" : "http";
const PUBLIC_BASE_URL = `${PUBLIC_PROTOCOL}://${APP_PUBLIC_HOSTNAME}`;

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  console.error("Stack:", error.stack);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

async function main() {
  const workerAccountId = process.env.WORKER_ACCOUNT_ID;
  const workerAccountSecret = process.env.WORKER_ACCOUNT_SECRET;

  if (!workerAccountId || !workerAccountSecret) {
    logger.error({
      message: "worker environment variables must be set",
      data: {
        metadata: { workerAccountId, workerAccountSecret },
      },
    });
    process.exit(1);
  }

  if (
    IS_PRODUCTION_LIKE &&
    (!process.env.APP_PUBLIC_HOSTNAME || process.env.APP_PUBLIC_HOSTNAME.includes("localhost"))
  ) {
    logger.warn({
      message: "APP_PUBLIC_HOSTNAME is not set or is localhost",
      data: {
        metadata: { APP_PUBLIC_HOSTNAME: process.env.APP_PUBLIC_HOSTNAME },
      },
    });
  }

  // I like as it is
  console.log(`Starting Nickname Registry Worker...`);
  console.log(`Internal HTTP server will listen on port ${PORT}`);
  console.log(`Publicly accessible via Nginx at: ${PUBLIC_BASE_URL}`);
  console.log(`Connecting to Jazz server: ${JAZZ_SYNC_SERVER_URL}`);

  if (process.env.JAZZ_API_KEY) {
    console.log(`Using API Key: ${process.env.JAZZ_API_KEY}`);
  }

  let worker;
  try {
    const workerResult = await startWorker({
      AccountSchema: RegistryWorkerAccount,
      syncServer:
        JAZZ_SYNC_SERVER_URL + (process.env.JAZZ_API_KEY ? `?key=${process.env.JAZZ_API_KEY}` : ""),
      accountID: process.env.WORKER_ACCOUNT_ID,
      accountSecret: process.env.WORKER_ACCOUNT_SECRET,
    });
    worker = workerResult.worker;

    const isWorkerLoaded = worker !== null && worker !== undefined && worker.$isLoaded === true;
    logger.debug({
      message: "Worker started",
      data: {
        workerLoaded: isWorkerLoaded,
        workerId: isWorkerLoaded ? worker.$jazz.id : "not loaded",
      },
    });
  } catch (workerError) {
    const errorMessage = workerError instanceof Error ? workerError.message : "Unknown error";
    logger.error({
      message: "Failed to start worker",
      data: {
        errorMessage,
        syncServerUrl: JAZZ_SYNC_SERVER_URL,
        workerAccountId: process.env.WORKER_ACCOUNT_ID,
      },
    });
    process.exit(1);
  }

  let loadedWorker: Loaded<typeof RegistryWorkerAccount>;
  try {
    loadedWorker = await worker.$jazz.ensureLoaded({
      resolve: {
        root: {
          registry: true,
          reverseRegistry: true,
          reservedNicknames: true,
          processedProviderEvents: true,
          webhookDeliveries: true,
          webhookAttemptCounts: true,
          // TODO: apps will be loaded separately via appRegistry
        },
      },
    });

    // Check if loadedWorker and its root are loaded before accessing
    if (
      loadedWorker !== null &&
      loadedWorker !== undefined &&
      loadedWorker.$isLoaded === true &&
      loadedWorker.root !== null &&
      loadedWorker.root !== undefined &&
      loadedWorker.root.$isLoaded === true
    ) {
      // Deep load the apps and appsByUser records
      if (
        loadedWorker.root.apps !== null &&
        loadedWorker.root.apps !== undefined &&
        loadedWorker.root.apps.$isLoaded === true
      ) {
        const appRegistry = loadedWorker.root.apps;
        await appRegistry.$jazz.ensureLoaded({
          resolve: {
            apps: true,
            appsByUser: true,
          },
        });
      }

      if (
        loadedWorker.root.reservedNicknames !== null &&
        loadedWorker.root.reservedNicknames !== undefined &&
        loadedWorker.root.reservedNicknames.$isLoaded === true
      ) {
        logger.info({
          message: "Successfully loaded worker data",
          data: {
            workerId: loadedWorker.$jazz.id,
          },
        });
      }
    }
  } catch (loadError) {
    const errorMessage = loadError instanceof Error ? loadError.message : "Unknown error";
    logger.error({
      message: "Failed to load worker data",
      data: {
        errorMessage,
      },
    });
    process.exit(1);
  }

  // Safely extract references with loading checks
  const nicknameRegistry: TNicknameRegistry | undefined =
    loadedWorker &&
    loadedWorker.$isLoaded &&
    loadedWorker.root &&
    loadedWorker.root.$isLoaded &&
    loadedWorker.root.registry &&
    loadedWorker.root.registry.$isLoaded
      ? loadedWorker.root.registry
      : undefined;

  const reverseNicknameRegistry =
    loadedWorker &&
    loadedWorker.$isLoaded &&
    loadedWorker.root &&
    loadedWorker.root.$isLoaded &&
    loadedWorker.root.reverseRegistry &&
    loadedWorker.root.reverseRegistry.$isLoaded
      ? loadedWorker.root.reverseRegistry
      : undefined;

  const reservedNicknames =
    loadedWorker &&
    loadedWorker.$isLoaded &&
    loadedWorker.root &&
    loadedWorker.root.$isLoaded &&
    loadedWorker.root.reservedNicknames &&
    loadedWorker.root.reservedNicknames.$isLoaded
      ? loadedWorker.root.reservedNicknames
      : undefined;

  const appRegistry =
    loadedWorker &&
    loadedWorker.$isLoaded &&
    loadedWorker.root &&
    loadedWorker.root.$isLoaded &&
    loadedWorker.root.apps &&
    loadedWorker.root.apps.$isLoaded
      ? loadedWorker.root.apps
      : undefined;

  if (nicknameRegistry === null || nicknameRegistry === undefined) {
    logger.error({
      message: "NicknameRegistry not found in worker account root",
      data: {
        workerId: loadedWorker.$jazz.id,
      },
    });
    process.exit(1);
  }

  if (reverseNicknameRegistry === null || reverseNicknameRegistry === undefined) {
    logger.error({
      message: "ReverseNicknameRegistry not found in worker account root",
      data: {
        workerId: loadedWorker.$jazz.id,
      },
    });
    process.exit(1);
  }

  if (reservedNicknames === null || reservedNicknames === undefined) {
    logger.error({
      message: "ReservedNicknames not found in worker account root",
      data: {
        workerId: loadedWorker.$jazz.id,
      },
    });
    process.exit(1);
  }

  if (appRegistry === null || appRegistry === undefined) {
    logger.error({
      message: "AppRegistry not found in worker account root",
      data: {
        workerId: loadedWorker.$jazz.id,
      },
    });
    process.exit(1);
  }

  logger.info({
    message: "Registries loaded successfully",
    data: {
      nicknameRegistryId: nicknameRegistry.$jazz.id,
      reverseNicknameRegistryId: reverseNicknameRegistry.$jazz.id,
      reservedNicknamesId: reservedNicknames.$jazz.id,
      appRegistryId: appRegistry.$jazz.id,
      workerId: worker.$jazz.id,
    },
  });

  const app = new OpenAPIHono();

  app.use("*", Honologger());
  app.use("*", cors());
  app.use("*", rateLimit(100, 60000));

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Nickname Registry API",
      description:
        "API for managing nickname registration in Jazz.tools. This service provides endpoints for checking nickname availability and managing nickname registration, updates, and deletions.",
    },
    servers: IS_PRODUCTION_LIKE
      ? [
          {
            url: "https://api.regarde.dev",
            description: "Production Server - Authentication (api.regarde.dev)",
          },
        ]
      : [
          {
            url: PUBLIC_BASE_URL,
            description: "Local Development Server",
          },
        ],
  });

  app.get("/ui", swaggerUI({ url: `${PUBLIC_BASE_URL}/doc` }));

  const safeVerifyHandler = async (c: any) => {
    try {
      return await verifyHandler(worker)(c);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({
        message: "Error in verifyHandler",
        data: { errorMessage },
      });
      return c.json({ error: "Internal server error" }, 500);
    }
  };

  const safeCheckAvailabilityHandler = async (c: any) => {
    try {
      return await checkAvailabilityHandler(nicknameRegistry, reservedNicknames)(c);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({
        message: "Error in checkAvailabilityHandler",
        data: { errorMessage },
      });
      return c.json({ error: "Internal server error" }, 500);
    }
  };

  const safeRegisterHandler = async (c: any) => {
    try {
      return await registerHandler(
        nicknameRegistry,
        reverseNicknameRegistry,
        worker,
        reservedNicknames,
      )(c);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({
        message: "Error in registerHandler",
        data: { errorMessage },
      });
      return c.json({ error: "Internal server error" }, 500);
    }
  };

  const safeLookupHandler = async (c: any) => {
    try {
      return await lookupHandler(nicknameRegistry)(c);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({
        message: "Error in lookupHandler",
        data: { errorMessage },
      });
      return c.json({ error: "Internal server error" }, 500);
    }
  };

  const safeRegisterAppHandler = async (c: any) => {
    try {
      const isAppsLoaded =
        appRegistry !== null &&
        appRegistry !== undefined &&
        appRegistry.apps !== null &&
        appRegistry.apps !== undefined &&
        appRegistry.apps.$isLoaded === true;
      const isAppsByUserLoaded =
        appRegistry !== null &&
        appRegistry !== undefined &&
        appRegistry.appsByUser !== null &&
        appRegistry.appsByUser !== undefined &&
        appRegistry.appsByUser.$isLoaded === true;
      if (isAppsLoaded === false || isAppsByUserLoaded === false) {
        throw new Error("App registry not fully loaded");
      }
      return await registerAppHandler(appRegistry.apps, appRegistry.appsByUser, worker)(c);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({
        message: "Error in registerAppHandler",
        data: { errorMessage },
      });
      return c.json({ error: "Internal server error" }, 500);
    }
  };

  const safeUnifiedWebhookHandler = async (c: any) => {
    try {
      const isAppsLoaded =
        appRegistry !== null &&
        appRegistry !== undefined &&
        appRegistry.apps !== null &&
        appRegistry.apps !== undefined &&
        appRegistry.apps.$isLoaded === true;
      if (isAppsLoaded === false) {
        throw new Error("App registry not fully loaded");
      }
      return await unifiedWebhookHandler(loadedWorker)(c);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({
        message: "Error in unifiedWebhookHandler",
        data: { errorMessage },
      });
      return c.json({ error: "Internal server error" }, 500);
    }
  };

  app.openapi(verifyRoute, safeVerifyHandler);
  app.openapi(checkAvailabilityRoute, safeCheckAvailabilityHandler);
  app.openapi(registerRoute, safeRegisterHandler);
  app.openapi(lookupRoute, safeLookupHandler);
  app.openapi(registerAppRoute, safeRegisterAppHandler);
  app.openapi(unifiedWebhookRoute, safeUnifiedWebhookHandler);

  // Register non-OpenAPI specific routes BEFORE catch-all
  app.get("/health", (c) => {
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      workerId: worker.$jazz.id,
    });
  });

  app.get("/ui", swaggerUI({ url: `${PUBLIC_BASE_URL}/doc` }));

  app.notFound((c) => {
    try {
      logger.debug({
        message: "404 - Path not found",
        data: {
          path: c.req.path,
          method: c.req.method,
        },
      });
      return c.json({ error: "Not Found" }, 404);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({
        message: "Error in notFound handler",
        data: { errorMessage },
      });
      return c.json({ error: "Not Found" }, 404);
    }
  });

  app.onError((error, c) => {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      message: "Global error handler caught",
      data: {
        errorMessage,
        path: c.req.path,
        method: c.req.method,
      },
    });
    try {
      return c.json({ error: "Internal server error", timestamp: new Date().toISOString() }, 500);
    } catch (responseError) {
      const responseErrorMessage =
        responseError instanceof Error ? responseError.message : "Unknown error";
      logger.error({
        message: "Error creating error response",
        data: {
          errorMessage: responseErrorMessage,
          path: c.req.path,
          method: c.req.method,
        },
      });
      return new Response("Internal server error", { status: 500 });
    }
  });

  const serverOptions = {
    fetch: app.fetch,
    port: Number(PORT),
  };

  console.log(`api.regarde.dev HTTP server starting on internal port ${PORT}`);
  console.log(`Public Swagger UI available at: ${PUBLIC_BASE_URL}/ui`);
  console.log(`Public OpenAPI spec available at: ${PUBLIC_BASE_URL}/doc`);
  console.log(`Public Health check available at: ${PUBLIC_BASE_URL}/health`);

  try {
    serve(serverOptions);
    console.log(
      `Server started successfully. Nginx should be proxying public requests from ${PUBLIC_BASE_URL} to http://localhost:${PORT}`,
    );
  } catch (serverError) {
    console.error("Failed to start HTTP server:", serverError);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error in main function:", err);
  process.exit(1);
});
