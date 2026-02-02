import "dotenv/config";

import { Group } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";

import { ProfileWorkerAccount } from "@regarde-dev/jazz-schemas/regarde.bio";

const JAZZ_SYNC_SERVER_URL = process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";

async function createAdminGroup() {
  console.log("[INFO] Creating Jazz Profile Admin Group...");

  // Validate environment variables
  if (!process.env.PROFILE_WORKER_ACCOUNT || !process.env.PROFILE_WORKER_SECRET) {
    console.error(
      "[ERROR] PROFILE_WORKER_ACCOUNT and PROFILE_WORKER_SECRET environment variables must be set.",
    );
    process.exit(1);
  }

  console.log(`[INFO] Connecting to Jazz server: ${JAZZ_SYNC_SERVER_URL}`);
  if (process.env.JAZZ_API_KEY) {
    console.log(`[INFO] Using API Key: ${process.env.JAZZ_API_KEY}`);
  }

  let worker;
  try {
    const workerResult = await startWorker({
      AccountSchema: ProfileWorkerAccount,
      accountID: process.env.PROFILE_WORKER_ACCOUNT,
      accountSecret: process.env.PROFILE_WORKER_SECRET,
      syncServer:
        JAZZ_SYNC_SERVER_URL + (process.env.JAZZ_API_KEY ? `?key=${process.env.JAZZ_API_KEY}` : ""),
    });
    worker = workerResult.worker;
    console.log(`[SUCCESS] Worker connected with Account ID: ${worker.$jazz.id}`);
  } catch (error) {
    console.error("[ERROR] Failed to start Jazz worker:", error);
    process.exit(1);
  }

  try {
    // Create the admin group with worker as owner
    console.log("[INFO] Creating admin group...");
    const adminGroup = Group.create({ owner: worker });

    // Add admin permissions for specific accounts
    // TODO: Replace with actual admin account IDs
    // adminGroup.addMember("co_admin_account_1", "admin");
    // adminGroup.addMember("co_admin_account_2", "admin");

    console.log("[SUCCESS] Admin group created successfully!");
    console.log("[INFO] Group Details:");
    console.log(`   Group ID: ${adminGroup.$jazz.id}`);
    console.log(`   Owner: ${worker.$jazz.id}`);

    console.log("\n[INFO] COPY THIS GROUP ID:");
    console.log(`${adminGroup.$jazz.id}`);

    console.log("\n[INFO] Next steps:");
    console.log("1. Copy the Group ID above");
    console.log("2. This is your PROFILE_ADMIN_GROUP ID");
    console.log("3. Store it in your .env or use it in your code");
    console.log("4. Add admin members to the group as needed");
  } catch (error) {
    console.error("[ERROR] Failed to create admin group:", error);
    process.exit(1);
  }
}

// Handle process termination
process.on("SIGTERM", () => {
  console.log("[INFO] SIGTERM received. Shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[INFO] SIGINT received. Shutting down...");
  process.exit(0);
});

// Run the script
createAdminGroup().catch((error) => {
  console.error("[ERROR] Unhandled error:", error);
  process.exit(1);
});
