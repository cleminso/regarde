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
    resolve: { root: { registry: true } },
  });

  const nicknameRegistry = loadedWorker.root.registry;

  if (!nicknameRegistry) {
    console.error(
      "Critical: NicknameRegistry CoRecord not found in worker's account root. Migration might have failed or registry is not defined on root.",
    );
    process.exit(1);
  }

  console.log(`NicknameRegistry CoRecord loaded. ID: ${nicknameRegistry.id}`);

  const server = http.createServer(async (req, res) => {
    if (req.url === "/register" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const {
            // If empty, then consider it a deletion request
            nickname,
            jazzAccountID,
            // Used if the user wants to swap so it atomically swaps when registering
            oldNickname = "",
          } = JSON.parse(body);

          if (
            (!nickname && !oldNickname) ||
            typeof nickname !== "string" ||
            typeof oldNickname !== "string" ||
            !jazzAccountID ||
            typeof jazzAccountID !== "string"
          ) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: `Some variable is either missing or incomplete: ${JSON.stringify({ nickname, oldNickname, jazzAccountID })}`,
              }),
            );
            return;
          }

          console.log(
            `Received registration request for nickname: ${nickname}, AccountID: ${jazzAccountID}`,
          );

          const currentRegistryState = nicknameRegistry;

          if (
            currentRegistryState[nickname] &&
            currentRegistryState[nickname] !== jazzAccountID
          ) {
            console.log(
              `Nickname "${nickname}" is already taken for AccountID: ${currentRegistryState[nickname]}.`,
            );
            res.writeHead(409, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Nickname already taken" }));
          } else if (
            currentRegistryState[nickname] &&
            currentRegistryState[nickname] === jazzAccountID
          ) {
            console.log(
              `Nickname "${nickname}" is already registered to this account, OK: ${currentRegistryState[nickname]}.`,
            );
            res.writeHead(204);
            res.end();
          } else {
            currentRegistryState[nickname] = jazzAccountID;
            console.log(
              `Nickname "${nickname}" registered for AccountID: ${jazzAccountID}.`,
            );
            res.writeHead(204);
            res.end();
          }
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
