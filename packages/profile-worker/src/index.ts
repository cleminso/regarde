import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { startWorker } from "jazz-nodejs";

import { RegistryWorkerAccount } from "./schema";

const PORT = process.env.PORT || 3000;
const JAZZ_SYNC_SERVER_URL =
  process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (c: any, next: any) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();
    
    const record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      await next();
      return;
    }
    
    if (record.count >= maxRequests) {
      return c.json({ error: "Too many requests" }, 429);
    }
    
    record.count++;
    await next();
  };
};

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
  console.log(`ReverseNicknameRegistry CoRecord loaded. ID: ${reverseNicknameRegistry.id}`);

  const app = new Hono();

  app.use('*', cors());
  app.use('*', rateLimit(10, 60000));

  app.post('/checkAvailability', async (c) => {
    try {
      const { nickname } = await c.req.json();

      if (!nickname || typeof nickname !== "string") {
        return c.json({ error: "Invalid request body. Missing or invalid nickname." }, 400);
      }

      console.log(`Checking availability for nickname: "${nickname}"`);

      const existingAccountForNickname = nicknameRegistry[nickname];
      const isAvailable = !existingAccountForNickname;

      return c.json({ 
        nickname,
        available: isAvailable,
        ...(existingAccountForNickname && { takenBy: existingAccountForNickname })
      });

    } catch (error) {
      console.error(`Error processing /checkAvailability request: ${error}`);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

  app.post('/register', async (c) => {
    try {
      const {
        nickname,
        jazzAccountID,
        oldNickname = "",
      } = await c.req.json();

      if (
        !jazzAccountID || typeof jazzAccountID !== "string" ||
        typeof nickname !== "string" ||
        typeof oldNickname !== "string" ||
        (!nickname && !oldNickname)
      ) {
        return c.json({
          error: `Invalid request body. Missing jazzAccountID or incorrect types. Provided: ${JSON.stringify({ nickname, oldNickname, jazzAccountID })}`,
        }, 400);
      }

      console.log(
        `Received registration request: nickname="${nickname}", AccountID="${jazzAccountID}", oldNickname="${oldNickname}"`,
      );

      const currentNicknameForAccount = reverseNicknameRegistry[jazzAccountID];
      const existingAccountForNickname = nicknameRegistry[nickname];
      const existingAccountForOldNickname = nicknameRegistry[oldNickname];

      if (!nickname && oldNickname) {
        if (currentNicknameForAccount !== oldNickname) {
          console.log(
            `Account "${jazzAccountID}" does not own nickname "${oldNickname}". Current: "${currentNicknameForAccount}"`
          );
          return c.json({ error: "Account does not own the nickname to delete" }, 403);
        }

        delete nicknameRegistry[oldNickname];
        delete reverseNicknameRegistry[jazzAccountID];
        console.log(
          `Nickname "${oldNickname}" and reverse entry for AccountID "${jazzAccountID}" deleted.`,
        );
        return c.body(null, 204);
      }

      if (existingAccountForNickname && existingAccountForNickname !== jazzAccountID) {
        console.log(
          `Nickname "${nickname}" is already taken by AccountID: ${existingAccountForNickname}.`,
        );
        return c.json({ error: "Nickname already taken" }, 409);
      }

      if (oldNickname) {
        if (existingAccountForOldNickname !== jazzAccountID) {
           console.log(
            `Account "${jazzAccountID}" does not own oldNickname "${oldNickname}" for swap. Current: "${currentNicknameForAccount}"`
           );
           return c.json({ error: "Account does not own the nickname specified as oldNickname" }, 403);
        }

        if (oldNickname === nickname) {
          console.log(
            `Swap request where oldNickname "${oldNickname}" is same as new nickname "${nickname}" for AccountID "${jazzAccountID}". No-op.`,
          );
          return c.body(null, 204);
        }

        delete nicknameRegistry[oldNickname];
        console.log(`Removed old nickname "${oldNickname}" from registry.`);
      } else {
        if (currentNicknameForAccount) {
          console.log(
            `AccountID "${jazzAccountID}" already has a nickname "${currentNicknameForAccount}". Cannot register a new one without specifying oldNickname for swap.`,
          );
          return c.json({ error: `Account already has a nickname: "${currentNicknameForAccount}"` }, 409);
        }
      }

      nicknameRegistry[nickname] = jazzAccountID;
      reverseNicknameRegistry[jazzAccountID] = nickname;
      console.log(
        `Nickname "${nickname}" registered/swapped for AccountID: ${jazzAccountID}.`,
      );
      return c.body(null, 204);

    } catch (error) {
      console.error(`Error processing /register request: ${error}`);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

  app.notFound((c) => {
    return c.json({ error: "Not Found" }, 404);
  });

  console.log(`Nickname Registry Worker HTTP server listening on port ${PORT}`);
  
  serve({
    fetch: app.fetch,
    port: Number(PORT),
  });
}

main().catch((err) => {
  console.error("Unhandled error in main function:", err);
  process.exit(1);
});