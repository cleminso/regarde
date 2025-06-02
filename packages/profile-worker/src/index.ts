import "dotenv/config";

import http from "http";
import { startWorker } from "jazz-nodejs";

import { RegistryWorkerAccount } from "./schema";

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
  console.log(`ReverseNicknameRegistry CoRecord loaded. ID: ${reverseNicknameRegistry.id}`);

  const server = http.createServer(async (req, res) => {
    if (req.url === "/register" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const {
            nickname, // New nickname to register (can be empty for deletion)
            jazzAccountID,
            oldNickname = "", // Old nickname to remove (used for swaps or deletion)
          } = JSON.parse(body);

          // Basic validation
          if (
            !jazzAccountID || typeof jazzAccountID !== "string" ||
            typeof nickname !== "string" ||
            typeof oldNickname !== "string" ||
            (!nickname && !oldNickname) // Must provide either a new nickname or an old one to delete/swap
          ) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: `Invalid request body. Missing jazzAccountID or incorrect types. Provided: ${JSON.stringify({ nickname, oldNickname, jazzAccountID })}`,
              }),
            );
            return;
          }

          console.log(
            `Received registration request: nickname="${nickname}", AccountID="${jazzAccountID}", oldNickname="${oldNickname}"`,
          );

          const currentNicknameForAccount = reverseNicknameRegistry[jazzAccountID];
          const existingAccountForNickname = nicknameRegistry[nickname];
          const existingAccountForOldNickname = nicknameRegistry[oldNickname];

          // --- Handle Delete ---
          if (!nickname && oldNickname) {
            if (currentNicknameForAccount !== oldNickname) {
              console.log(
                `Account "${jazzAccountID}" does not own nickname "${oldNickname}". Current: "${currentNicknameForAccount}"`
              );
              res.writeHead(403, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Account does not own the nickname to delete" }));
              return;
            }

            delete nicknameRegistry[oldNickname];
            delete reverseNicknameRegistry[jazzAccountID];
            console.log(
              `Nickname "${oldNickname}" and reverse entry for AccountID "${jazzAccountID}" deleted.`,
            );
            res.writeHead(204);
            res.end();
            return;
          }

          // --- Handle Swap or Register ---
          // Check if the new nickname is already taken by someone else
          if (existingAccountForNickname && existingAccountForNickname !== jazzAccountID) {
            console.log(
              `Nickname "${nickname}" is already taken by AccountID: ${existingAccountForNickname}.`,
            );
            res.writeHead(409, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Nickname already taken" }));
            return;
          }

          // If oldNickname is provided, it's a swap attempt
          if (oldNickname) {
            // Validate that the account owns the oldNickname they are trying to swap from
            if (existingAccountForOldNickname !== jazzAccountID) {
               console.log(
                `Account "${jazzAccountID}" does not own oldNickname "${oldNickname}" for swap. Current: "${currentNicknameForAccount}"`
               );
               res.writeHead(403, { "Content-Type": "application/json" });
               res.end(JSON.stringify({ error: "Account does not own the nickname specified as oldNickname" }));
               return;
            }

            // If the old nickname is the same as the new nickname, it's a no-op swap
            if (oldNickname === nickname) {
              console.log(
                `Swap request where oldNickname "${oldNickname}" is same as new nickname "${nickname}" for AccountID "${jazzAccountID}". No-op.`,
              );
              res.writeHead(204);
              res.end();
              return;
            }

            // Perform the swap: remove old, add new
            delete nicknameRegistry[oldNickname];
            // reverseRegistry entry for jazzAccountID will be updated with the new nickname below
            console.log(`Removed old nickname "${oldNickname}" from registry.`);
          } else {
            // If oldNickname is NOT provided, it's a new registration attempt
            // Check if the account already has *any* nickname
            if (currentNicknameForAccount) {
              console.log(
                `AccountID "${jazzAccountID}" already has a nickname "${currentNicknameForAccount}". Cannot register a new one without specifying oldNickname for swap.`,
              );
              res.writeHead(409, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: `Account already has a nickname: "${currentNicknameForAccount}"` }));
              return;
            }
          }

          // If we reached here, the new nickname is available and validation passed (or it's a valid swap)
          // Register the new nickname and update reverse registry
          nicknameRegistry[nickname] = jazzAccountID;
          reverseNicknameRegistry[jazzAccountID] = nickname;
          console.log(
            `Nickname "${nickname}" registered/swapped for AccountID: ${jazzAccountID}.`,
          );
          res.writeHead(204);
          res.end();

        } catch (error) {
          console.error(`Error processing /register request: ${error}`);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      });
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  });

  server.listen(PORT, () => {
    console.log(
      `Nickname Registry Worker HTTP server listening on port ${PORT}`,
    );
  });
}

main().catch((err) => {
  console.error("Unhandled error in main function:", err);
  process.exit(1);
});
