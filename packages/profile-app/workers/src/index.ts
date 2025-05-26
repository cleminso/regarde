import { startWorker } from 'jazz-nodejs';
import { RegistryWorkerAccount, NicknameRegistry } from './schema';
import http from 'http';
import { ID } from 'jazz-tools';

// Configuration - these would ideally come from environment variables in a real deployment
const PORT = process.env.PORT || 3000; // Port for the worker's HTTP server
const JAZZ_SYNC_SERVER_URL = process.env.JAZZ_SYNC_SERVER_URL || 'wss://cloud.jazz.tools'; // Default to Jazz Cloud
// JAZZ_WORKER_ACCOUNT and JAZZ_WORKER_SECRET should be set as environment variables

async function main() {
  if (!process.env.JAZZ_WORKER_ACCOUNT || !process.env.JAZZ_WORKER_SECRET) {
    console.error(
      'Error: JAZZ_WORKER_ACCOUNT and JAZZ_WORKER_SECRET environment variables must be set.'
    );
    process.exit(1);
  }

  console.log(`Starting Nickname Registry Worker...`);
  console.log(`Connecting to Jazz server: ${JAZZ_SYNC_SERVER_URL}`);
  if (process.env.JAZZ_API_KEY) {
    console.log(`Using API Key: ${process.env.JAZZ_API_KEY}`);
  }


  const { worker, log } = await startWorker({
    AccountSchema: RegistryWorkerAccount,
    syncServer: JAZZ_SYNC_SERVER_URL + (process.env.JAZZ_API_KEY ? `?key=${process.env.JAZZ_API_KEY}` : ''),
    // accountID and accountSecret are picked up from JAZZ_WORKER_ACCOUNT and JAZZ_WORKER_SECRET env vars by default
  });

  console.log(`Worker started with Account ID: ${worker.id}`);

  // Ensure the root and registry are loaded. The migration should handle creation.
  const loadedWorkerAccount = await worker.ensureLoaded({
    resolve: { root: { registry: true } },
  });

  if (!loadedWorkerAccount.root.registry) {
    console.error(
      "Critical: NicknameRegistry CoMap not found in worker's account root. Migration might have failed."
    );
    // Depending on desired behavior, you might want to retry or exit
    process.exit(1); 
  }
  
  const nicknameRegistry = loadedWorkerAccount.root.registry;
  console.log(`NicknameRegistry CoMap loaded. ID: ${nicknameRegistry.id}`);

  // Create HTTP server
  const server = http.createServer(async (req, res) => {
    if (req.url === '/register' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { nickname, jazzAccountID } = JSON.parse(body);

          if (!nickname || typeof nickname !== 'string' || !jazzAccountID || typeof jazzAccountID !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request body. Nickname and jazzAccountID are required and must be strings.' }));
            return;
          }
          
          // Log the received nickname and AccountID for debugging
          log(`Received registration request for nickname: ${nickname}, AccountID: ${jazzAccountID}`);


          // Check if nickname exists
          // Need to ensure the registry is loaded before accessing its properties directly.
          // While `nicknameRegistry` is loaded initially, for safety in async operations or if it could be modified elsewhere:
          const currentRegistryState = await nicknameRegistry.ensureLoaded({});


          if (currentRegistryState[nickname]) {
            log(`Nickname "${nickname}" is already taken for AccountID: ${currentRegistryState[nickname]}.`);
            res.writeHead(409, { 'Content-Type': 'application/json' }); // 409 Conflict
            res.end(JSON.stringify({ error: 'Nickname already taken' }));
          } else {
            // Register the nickname
            // Type assertion for ID might be needed if jazzAccountID isn't already ID<Account>
            currentRegistryState[nickname] = jazzAccountID as ID<RegistryWorkerAccount>; 
            log(`Nickname "${nickname}" registered for AccountID: ${jazzAccountID}.`);
            
            res.writeHead(204); // 204 No Content
            res.end();
          }
        } catch (error) {
          log(`Error processing /register request: ${error}`, "error");
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });

  server.listen(PORT, () => {
    console.log(`Nickname Registry Worker HTTP server listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Unhandled error in main function:', err);
  process.exit(1);
});
