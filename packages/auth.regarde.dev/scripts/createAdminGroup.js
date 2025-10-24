import "dotenv/config";
import { startWorker } from "jazz-tools/worker";
import { Group } from "jazz-tools";
import { RegistryWorkerAccount } from "@regarde-dev/jazz-schemas";

const JAZZ_SYNC_SERVER_URL =
  process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";

async function createAdminGroup() {
  console.log("🚀 Creating Jazz Profile Admin Group...");

  // Validate environment variables
  if (!process.env.JAZZ_WORKER_ACCOUNT || !process.env.JAZZ_WORKER_SECRET) {
    console.error(
      "❌ Error: JAZZ_WORKER_ACCOUNT and JAZZ_WORKER_SECRET environment variables must be set."
    );
    process.exit(1);
  }

  console.log(`📡 Connecting to Jazz server: ${JAZZ_SYNC_SERVER_URL}`);
  if (process.env.JAZZ_API_KEY) {
    console.log(`🔑 Using API Key: ${process.env.JAZZ_API_KEY}`);
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
    console.log(`✅ Worker connected with Account ID: ${worker.id}`);
  } catch (error) {
    console.error("❌ Failed to start Jazz worker:", error);
    process.exit(1);
  }

  try {
    // Create the admin group with worker as owner
    console.log("🔧 Creating admin group...");
    const adminGroup = Group.create({ owner: worker });
    
    // Add admin permissions for specific accounts
    // TODO: Replace with actual admin account IDs
    // adminGroup.addMember("co_admin_account_1", "admin");
    // adminGroup.addMember("co_admin_account_2", "admin");
    
    console.log("✅ Admin group created successfully!");
    console.log("📋 Group Details:");
    console.log(`   Group ID: ${adminGroup.id}`);
    console.log(`   Owner: ${worker.id}`);
    
    console.log("\n🎯 COPY THIS GROUP ID:");
    console.log(`${adminGroup.id}`);
    
    console.log("\n📝 Next steps:");
    console.log("1. Copy the Group ID above");
    console.log("2. Update packages/jazz-schemas/src/profile.ts");
    console.log("3. Replace the empty string in jazzProfileAdminGroupID with this ID");
    console.log("4. Add admin members to the group as needed");
    
  } catch (error) {
    console.error("❌ Failed to create admin group:", error);
    process.exit(1);
  }
}

// Handle process termination
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down...");
  process.exit(0);
});

// Run the script
createAdminGroup().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});