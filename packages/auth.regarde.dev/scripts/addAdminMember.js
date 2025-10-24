import "dotenv/config";
import { startWorker } from "jazz-tools/worker";
import { Group, Account } from "jazz-tools";
import { RegistryWorkerAccount } from "@regarde-dev/jazz-schemas";

const JAZZ_SYNC_SERVER_URL =
  process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";

// Admin group ID - replace with the ID from create-admin-group.js output
const ADMIN_GROUP_ID =
  process.env.ADMIN_GROUP_ID || "co_zoppoxWWJaHYKPgSgUkuCCXQX21";

// Account to add as admin - replace with actual account ID
const ADMIN_ACCOUNT_ID = process.env.ADMIN_ACCOUNT_ID || "co_cleminso";

async function addAdminMember() {
  console.log("🚀 Adding admin member to Jazz Profile Admin Group...");

  // Validate environment variables
  if (!process.env.JAZZ_WORKER_ACCOUNT || !process.env.JAZZ_WORKER_SECRET) {
    console.error(
      "❌ Error: JAZZ_WORKER_ACCOUNT and JAZZ_WORKER_SECRET environment variables must be set.",
    );
    process.exit(1);
  }

  if (!ADMIN_GROUP_ID) {
    console.error("❌ Error: ADMIN_GROUP_ID must be set.");
    process.exit(1);
  }

  if (!ADMIN_ACCOUNT_ID) {
    console.error("❌ Error: ADMIN_ACCOUNT_ID must be set.");
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
    // Load the admin group
    console.log(`🔍 Loading admin group: ${ADMIN_GROUP_ID}`);
    const adminGroup = await Group.load(ADMIN_GROUP_ID, worker);

    if (!adminGroup) {
      console.error(`❌ Failed to load admin group with ID: ${ADMIN_GROUP_ID}`);
      process.exit(1);
    }

    await adminGroup.ensureLoaded();
    console.log(`✅ Admin group loaded successfully`);

    // Load the account to add as admin
    console.log(`🔍 Loading account: ${ADMIN_ACCOUNT_ID}`);
    const adminAccount = await Account.load(ADMIN_ACCOUNT_ID, worker);

    if (!adminAccount) {
      console.error(`❌ Failed to load account with ID: ${ADMIN_ACCOUNT_ID}`);
      console.log(
        "💡 Make sure the account ID is correct and the account exists",
      );
      process.exit(1);
    }

    console.log(`✅ Account loaded successfully`);

    // Add the account to the admin group with admin role
    console.log(
      `🔧 Adding ${ADMIN_ACCOUNT_ID} to admin group with admin role...`,
    );
    adminGroup.addMember(adminAccount, "admin");

    console.log("✅ Admin member added successfully!");
    console.log("📋 Operation Details:");
    console.log(`   Group ID: ${adminGroup.id}`);
    console.log(`   Added Account: ${ADMIN_ACCOUNT_ID}`);
    console.log(`   Role: admin`);

    // Verify the member was added
    const role = adminGroup.getRoleOf(ADMIN_ACCOUNT_ID);
    if (role) {
      console.log(`✅ Verification: Account has role "${role}" in the group`);
    } else {
      console.warn("⚠️  Warning: Could not verify member role");
    }
  } catch (error) {
    console.error("❌ Failed to add admin member:", error);
    process.exit(1);
  }
}

await addAdminMember();
