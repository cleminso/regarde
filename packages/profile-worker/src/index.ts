import "dotenv/config";

import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { startWorker } from "jazz-nodejs";

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

// Global error handlers to prevent server crashes
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  console.error("Stack:", error.stack);
  // Don't exit the process - log and continue
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process - log and continue
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

  console.log(`Starting Nickname Registry Worker...`);
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
        url: `http://localhost:${PORT}`,
        description: "Local development server",
      },
    ],
  });

  app.get("/ui", swaggerUI({ url: "/doc" }));

  // Wrap handlers with additional error protection
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
      )(c);
    } catch (error) {
      console.error("Error in registerHandler:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  };

  const safeUserDetailsHandler = async (c: any) => {
    try {
      return await userDetailsHandler(reverseNicknameRegistry, nicknameRegistry)(c);
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

  // Add health check endpoint
  app.get("/health", (c) => {
    try {
      return c.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        workerId: worker?.id || "unknown",
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

  // Global error handler
  app.onError((error, c) => {
    console.error("Global error handler caught:", error);
    console.error("Stack:", error.stack);

    try {
      return c.json(
        {
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        },
        500,
      );
    } catch (responseError) {
      console.error("Error creating error response:", responseError);
      return new Response("Internal server error", { status: 500 });
    }
  });

  console.log(`Nickname Registry Worker HTTP server listening on port ${PORT}`);
  console.log(`Swagger UI available at: http://localhost:${PORT}/ui`);
  console.log(`OpenAPI spec available at: http://localhost:${PORT}/doc`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);

  try {
    serve({
      fetch: app.fetch,
      port: Number(PORT),
    });
    console.log("Server started successfully");
  } catch (serverError) {
    console.error("Failed to start HTTP server:", serverError);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error in main function:", err);
  process.exit(1);
});
