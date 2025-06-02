import "dotenv/config";

import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { startWorker } from "jazz-nodejs";

import { RegistryWorkerAccount } from "./schema";
import { rateLimit } from "./middleware/rateLimit";
import { checkAvailabilityRoute, checkAvailabilityHandler } from "./routes/checkAvailability";
import { registerRoute, registerHandler } from "./routes/register";

const PORT = process.env.PORT || 3000;
const JAZZ_SYNC_SERVER_URL =
  process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";

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

  const { worker } = await startWorker({
    AccountSchema: RegistryWorkerAccount,
    syncServer:
      JAZZ_SYNC_SERVER_URL +
      (process.env.JAZZ_API_KEY ? `?key=${process.env.JAZZ_API_KEY}` : ""),
  });

  console.log(`Worker started with Account ID: ${worker.id}`);

  const loadedWorker = await worker.ensureLoaded({
    resolve: { root: { registry: true, reverseRegistry: true } },
  });

  const nicknameRegistry = loadedWorker.root.registry;
  const reverseNicknameRegistry = loadedWorker.root.reverseRegistry;

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
  app.use("*", rateLimit(10, 60000));

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Nickname Registry API",
      description: "API for managing nickname registration in Jazz.tools. This service provides endpoints for checking nickname availability and managing nickname registration, updates, and deletions.",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local development server",
      },
    ],
  });

  app.get("/ui", swaggerUI({ url: "/doc" }));

  app.openapi(checkAvailabilityRoute, checkAvailabilityHandler(nicknameRegistry));
  app.openapi(registerRoute, registerHandler(nicknameRegistry, reverseNicknameRegistry));

  app.notFound((c) => {
    return c.json({ error: "Not Found" }, 404);
  });

  console.log(`Nickname Registry Worker HTTP server listening on port ${PORT}`);
  console.log(`Swagger UI available at: http://localhost:${PORT}/ui`);
  console.log(`OpenAPI spec available at: http://localhost:${PORT}/doc`);

  serve({
    fetch: app.fetch,
    port: Number(PORT),
  });
}

main().catch((err) => {
  console.error("Unhandled error in main function:", err);
  process.exit(1);
});