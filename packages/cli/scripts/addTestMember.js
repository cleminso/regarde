#!/usr/bin/env node
import "dotenv/config";
import { startWorker } from "jazz-tools/worker";
import { RegistryWorkerAccount } from "@regarde-dev/core";

const JAZZ_SYNC_SERVER_URL =
  process.env.JAZZ_SYNC_SERVER_URL || "ws://localhost:4200";

// Registry worker ID from setupLocalWorker.js output
const REGISTRY_WORKER_GROUP_ID = process.env.REGARDE_REGISTRY_GROUP;

// Test account ID to add as member - replace with your test account
const TEST_ACCOUNT_ID = process.env.TEST_JAZZ_ACCOUNT_ID;

async function addTestMember() {
  console.log("Adding test member to local registry worker group...\n");

  // Validate required environment variables
  if (
    !process.env.LOCAL_WORKER_ACCOUNT_ID ||
    !process.env.LOCAL_WORKER_ACCOUNT_SECRET
  ) {
    console.error(
      "\nMissing required environment variables:\n" +
        "  LOCAL_WORKER_ACCOUNT_ID\n" +
        "  LOCAL_WORKER_ACCOUNT_SECRET\n\n" +
        "These should be set in your .env.test file.\n" +
        "   Run 'pnpm setup:local' to setup your local worker first.\n",
    );
    process.exit(1);
  }

  if (!REGISTRY_WORKER_GROUP_ID) {
    console.error(
      "\nMissing required environment variable:\n" +
        "  REGARDE_REGISTRY_GROUP\n\n" +
        "This should be set in your .env.test file.\n" +
        "   Run 'pnpm setup:local' to get this value.\n",
    );
    process.exit(1);
  }

  if (!TEST_ACCOUNT_ID) {
    console.error(
      "\nMissing required environment variable:\n" +
        "  TEST_JAZZ_ACCOUNT_ID\n\n" +
        "This should be set in your .env.test file.\n" +
        "   Set this to the test account you want to add as a member.\n",
    );
    process.exit(1);
  }

  console.log(`📡 Connecting to local sync server: ${JAZZ_SYNC_SERVER_URL}`);

  let worker;
  try {
    const workerResult = await startWorker({
      AccountSchema: RegistryWorkerAccount,
      syncServer: JAZZ_SYNC_SERVER_URL,
      accountID: process.env.LOCAL_WORKER_ACCOUNT_ID,
      accountSecret: process.env.LOCAL_WORKER_ACCOUNT_SECRET,
    });
    worker = workerResult.worker;
    console.log(`✅ Worker connected successfully`);
    console.log(`   Account ID: ${worker.id}\n`);
  } catch (error) {
    console.error("❌ Failed to start Jazz worker:", error);
    console.error("\n💡 Make sure your local sync server is running:");
    console.error("   npx jazz-run sync");
    process.exit(1);
  }

  try {
    // Load the registry worker group
    console.log(`Loading registry worker group: ${REGISTRY_WORKER_GROUP_ID}`);
    const registryGroup = await c
      .group()
      .load(REGISTRY_WORKER_GROUP_ID, worker);

    if (!registryGroup) {
      console.error(
        `Failed to load registry group with ID: ${REGISTRY_WORKER_GROUP_ID}`,
      );
      process.exit(1);
    }

    await registryGroup.ensureLoaded();
    console.log(`Registry group loaded successfully\n`);

    // Verify we can admin this group
    const workerRole = registryGroup.getRoleOf(worker.id);
    if (workerRole !== "admin" && workerRole !== "writer") {
      console.error(
        `Worker doesn't have sufficient permissions on registry group`,
      );
      console.error(
        `   Current role: ${workerRole}, required: admin or writer`,
      );
      process.exit(1);
    }

    // Load the test account to add as member
    console.log(`Loading test account: ${TEST_ACCOUNT_ID}`);
    const testAccount = await worker.account().load(TEST_ACCOUNT_ID, {
      loadAs: worker,
    });

    if (!testAccount) {
      console.error(`Failed to load test account with ID: ${TEST_ACCOUNT_ID}`);
      console.error(
        `Make sure the test account exists on the local sync server`,
      );
      process.exit(1);
    }

    console.log(`Test account loaded successfully\n`);

    // Check if account is already a member
    const existingRole = registryGroup.getRoleOf(TEST_ACCOUNT_ID);
    if (existingRole) {
      console.log(
        `Test account is already a member with role: ${existingRole}`,
      );

      // Upgrade to writer if needed
      if (existingRole !== "writer" && existingRole !== "admin") {
        console.log(`Upgrading role to writer...`);
        registryGroup.setMemberRole(testAccount, "writer");
        await registryGroup.$jazz.waitForSync();
        console.log(`Role upgraded to writer\n`);
      } else {
        console.log(`Test account already has sufficient permissions\n`);
      }
    } else {
      // Add test account as writer
      console.log(`Adding test account as writer...`);
      registryGroup.addMember(testAccount, "writer");
      await registryGroup.$jazz.waitForSync();
      console.log(`Test account added as writer\n`);
    }

    // Verify the member was added/updated
    const verifyRole = registryGroup.getRoleOf(TEST_ACCOUNT_ID);
    if (verifyRole) {
      console.log(
        `Verification: Test account has role "${verifyRole}" in registry group`,
      );
    } else {
      console.warn(`Warning: Could not verify member role after operation`);
    }

    console.log("\nTest member setup completed successfully!");
    console.log("\nOperation Summary:");
    console.log(`   Registry Group: ${REGISTRY_WORKER_GROUP_ID}`);
    console.log(`   Test Account: ${TEST_ACCOUNT_ID}`);
    console.log(`   Role: ${verifyRole || "unknown"}`);

    console.log("\nNext steps:");
    console.log("1. Your test account is now a member of the registry group");
    console.log("2. You can test CLI commands with this account:");
    console.log(`   pnpm start:test login`);
    console.log("3. Use your test passphrase when prompted");
  } catch (error) {
    console.error("\nFailed to add test member:", error);
    console.error("\nTroubleshooting:");
    console.error(
      "   - Ensure local sync server is running: npx jazz-run sync",
    );
    console.error("   - Check your .env.test file has correct credentials");
    console.error(
      "   - Verify registry worker group was set up: pnpm setup:local",
    );
    console.error("   - Ensure test account exists on local server");
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
addTestMember().catch((error) => {
  console.error("\nUnhandled error:", error);
  process.exit(1);
});
