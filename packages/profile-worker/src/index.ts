import "dotenv/config";

import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { startWorker } from "jazz-tools/worker";

import { RegistryWorkerAccount } from "./schema";
import { rateLimit } from "./middleware/rateLimit";
import {
  checkAvailabilityRoute,
  checkAvailabilityHandler,
} from "./routes/checkAvailability";
import { registerRoute, registerHandler } from "./routes/register";
import { userDetailsRoute, userDetailsHandler } from "./routes/userDetails";

const PORT = process.env.PORT || 3000;
const JAZZ_SYNC_SERVER_URL =
  process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";

const APP_PUBLIC_HOSTNAME =
  process.env.APP_PUBLIC_HOSTNAME || `localhost:${PORT}`;
const IS_PRODUCTION_LIKE =
  APP_PUBLIC_HOSTNAME !== `localhost:${PORT}` &&
  !APP_PUBLIC_HOSTNAME.startsWith("localhost");
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
  if (!process.env.JAZZ_WORKER_ACCOUNT || !process.env.JAZZ_WORKER_SECRET) {
    console.error(
      "Error: JAZZ_WORKER_ACCOUNT and JAZZ_WORKER_SECRET environment variables must be set.",
    );
    process.exit(1);
  }

  if (
    IS_PRODUCTION_LIKE &&
    (!process.env.APP_PUBLIC_HOSTNAME ||
      process.env.APP_PUBLIC_HOSTNAME.includes("localhost"))
  ) {
    console.warn(
      "Warning: APP_PUBLIC_HOSTNAME is not set or is localhost. For production behind Nginx/HTTPS, set it to your public domain (e.g., api.jazz.dev) for correct documentation links.",
    );
  }

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
        JAZZ_SYNC_SERVER_URL +
        (process.env.JAZZ_API_KEY ? `?key=${process.env.JAZZ_API_KEY}` : ""),
    });
    worker = workerResult.worker;
  } catch (workerError) {
    console.error("Failed to start Jazz worker:", workerError);
    console.error("This is a critical error. Exiting...");
    process.exit(1);
  }

  console.log(`Worker started with Account ID: ${worker.id}`);

  let loadedWorker;
  try {
    loadedWorker = await worker.ensureLoaded({
      resolve: { root: { registry: true, reverseRegistry: true } },
    });
  } catch (loadError) {
    console.error("Failed to load worker data:", loadError);
    console.error("This is a critical error. Exiting...");
    process.exit(1);
  }

  const nicknameRegistry = loadedWorker?.root?.registry;
  const reverseNicknameRegistry = loadedWorker?.root?.reverseRegistry;

  if (!nicknameRegistry || !reverseNicknameRegistry) {
    console.error(
      "Critical: NicknameRegistry or ReverseNicknameRegistry CoRecord not found in worker's account root. Migration might have failed.",
    );
    process.exit(1);
  }

  console.log(`NicknameRegistry CoRecord loaded. ID: ${nicknameRegistry.id}`);
  console.log(
    `ReverseNicknameRegistry CoRecord loaded. ID: ${reverseNicknameRegistry.id}`,
  );

  const app = new OpenAPIHono();

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
    servers: [
      {
        url: PUBLIC_BASE_URL,
        description: IS_PRODUCTION_LIKE
          ? "Production Server (via Nginx/HTTPS)"
          : "Local Development Server",
      },
    ],
  });

  app.get("/ui", swaggerUI({ url: `${PUBLIC_BASE_URL}/doc` }));

  const safeCheckAvailabilityHandler = async (c: any) => {
    try {
      return await checkAvailabilityHandler(nicknameRegistry)(c);
    } catch (error) {
      console.error("Error in checkAvailabilityHandler:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  };

  const safeRegisterHandler = async (c: any) => {
    try {
      return await registerHandler(
        nicknameRegistry,
        reverseNicknameRegistry,
        worker,
      )(c);
    } catch (error) {
      console.error("Error in registerHandler:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  };

  const safeUserDetailsHandler = async (c: any) => {
    try {
      return await userDetailsHandler(
        reverseNicknameRegistry,
        nicknameRegistry,
      )(c);
    } catch (error) {
      console.error("Error in userDetailsHandler:", error);
      return c.json(
        {
          error: "Internal server error",
          jazzAccountId: c.req.query("jazzAccountId") || "unknown",
          exists: false,
        },
        500,
      );
    }
  };

  app.openapi(checkAvailabilityRoute, safeCheckAvailabilityHandler);
  app.openapi(registerRoute, safeRegisterHandler);
  app.openapi(userDetailsRoute, safeUserDetailsHandler);

  app.get("/health", (c) => {
    try {
      const requestProtocol =
        c.req.header("x-forwarded-proto") || c.req.url.startsWith("https://")
          ? "https"
          : "http";
      return c.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        workerId: worker?.id || "unknown",
        requestProtocol: requestProtocol,
      });
    } catch (error) {
      console.error("Health check error:", error);
      return c.json({ status: "unhealthy" }, 500);
    }
  });

  app.notFound((c) => {
    try {
      console.log(`404 - Path not found: ${c.req.path}`);
      return c.json({ error: "Not Found" }, 404);
    } catch (error) {
      console.error("Error in notFound handler:", error);
      return c.json({ error: "Not Found" }, 404);
    }
  });

  app.onError((error, c) => {
    console.error("Global error handler caught:", error);
    console.error("Stack:", error.stack);
    try {
      return c.json(
        { error: "Internal server error", timestamp: new Date().toISOString() },
        500,
      );
    } catch (responseError) {
      console.error("Error creating error response:", responseError);
      return new Response("Internal server error", { status: 500 });
    }
  });

  const serverOptions = {
    fetch: app.fetch,
    port: Number(PORT),
  };

  console.log(
    `Nickname Registry Worker HTTP server starting on internal port ${PORT}`,
  );
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
