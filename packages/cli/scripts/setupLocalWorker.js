#!/usr/bin/env node
import "dotenv/config";
import { startWorker } from "jazz-tools/worker";
import { Group } from "jazz-tools";
import { RegistryWorkerAccount } from "@regarde-dev/core";

// Load environment variables
const JAZZ_SYNC_SERVER_URL =
  process.env.JAZZ_SYNC_SERVER_URL || "ws://localhost:4200";
const LOCAL_WORKER_ACCOUNT_ID = process.env.LOCAL_WORKER_ACCOUNT_ID;
const LOCAL_WORKER_ACCOUNT_SECRET = process.env.LOCAL_WORKER_ACCOUNT_SECRET;

// Validate required environment variables
if (!LOCAL_WORKER_ACCOUNT_ID || !LOCAL_WORKER_ACCOUNT_SECRET) {
  console.error(
    "\nMissing required environment variables:\n" +
      "  LOCAL_WORKER_ACCOUNT_ID\n" +
      "  LOCAL_WORKER_ACCOUNT_SECRET\n\n" +
      "These should be set in your .env.test file.\n" +
      "   Run 'npx jazz-run account create --name \"LocalDevWorker\" --peer ws://localhost:4200'\n" +
      "   to create a local worker account and get these values.\n",
  );
  process.exit(1);
}

async function setupLocalWorker() {
  console.log("Setting up Local Jazz Worker for Development...\n");

  console.log(`Connecting to local sync server: ${JAZZ_SYNC_SERVER_URL}`);

  let worker;
  try {
    const workerResult = await startWorker({
      AccountSchema: RegistryWorkerAccount,
      syncServer: JAZZ_SYNC_SERVER_URL,
      accountID: LOCAL_WORKER_ACCOUNT_ID,
      accountSecret: LOCAL_WORKER_ACCOUNT_SECRET,
    });
    worker = workerResult.worker;
    console.log(`Worker connected successfully`);
    console.log(`   Account ID: ${worker.$jazz.id}\n`);
  } catch (error) {
    console.error("Failed to start Jazz worker:", error);
    console.error("\nMake sure your local sync server is running:");
    console.error("   npx jazz-run sync");
    process.exit(1);
  }

  try {
    // Create a dedicated local registry group
    console.log("Creating local registry group...");
    const localRegistryGroup = Group.create({ owner: worker });

    // The worker is the owner, so it has admin permissions automatically
    // No need to add the worker as a member - it's already the owner

    console.log("   Local registry group created");
    console.log(`   Group ID: ${localRegistryGroup.$jazz.id}\n`);

    // Verify setup
    console.log("Local worker setup completed successfully!");
    console.log("\nConfiguration Summary:");
    console.log(`   Worker Account ID: ${worker.$jazz.id}`);
    console.log(`   Local Registry Group ID: ${localRegistryGroup.$jazz.id}`);
    console.log(`   Sync Server: ${JAZZ_SYNC_SERVER_URL}`);

    console.log("\nNext steps:");
    console.log("1. Copy the Local Registry Group ID above");
    console.log("2. Update your .env.test file:");
    console.log(`   REGARDE_REGISTRY_GROUP=${localRegistryGroup.$jazz.id}`);
    console.log(`   LOCAL_WORKER_ACCOUNT_ID=${worker.$jazz.id}`);
    console.log("\n3. The worker is now ready for local development!");
    console.log("   Run: pnpm start:test login");
  } catch (error) {
    console.error("\nFailed to setup local worker:", error);
    console.error("\nTroubleshooting:");
    console.error(
      "   - Ensure local sync server is running: npx jazz-run sync",
    );
    console.error("   - Check your .env.test file has correct credentials");
    console.error("   - Verify worker account was created on local server");
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("\nSIGTERM received. Shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received. Shutting down...");
  process.exit(0);
});

// Run the script
setupLocalWorker().catch((error) => {
  console.error("\nUnhandled error:", error);
  process.exit(1);
});
