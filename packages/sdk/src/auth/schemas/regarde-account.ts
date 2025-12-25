import { co, Group, z } from "jazz-tools";
import { RegardeSDK } from "./auth";
import { initRegardeSchema } from "../../init";
/**
 * # RegardeAccount - Jazz Account with RegardeSDK support
 *
 * ## Purpose
 * - Extends generic Account with specific root schema containing "regarde-sdk"
 * - Enables Jazz to properly resolve and load RegardeSDK from account root
 * - Provides migration to initialize RegardeSDK for existing accounts
 *
 * ## Usage in CLI
 * - Use RegardeAccount instead of generic Account in worker and ensureRegardeSDKLoaded
 * - Jazz will now know the structure of account.root["regarde-sdk"]
 */
export const RegardeRoot = co.map({
  "regarde-sdk": RegardeSDK,
});

export const RegardeAccount = co
  .account({
    profile: co.profile(),
    root: RegardeRoot,
  })
  .withMigration(async (account) => {
    // Initialize profile if it doesn't exist
    if (!account.$jazz.has("profile")) {
      console.info("[INFO] Initializing RegardeAccount profile");
      const publicGroup = Group.create({
        owner: account,
      });
      publicGroup.makePublic();
      account.$jazz.set(
        "profile",
        co.profile().create({ name: "Regarde CLI User" }, publicGroup),
      );
    }
    // Initialize root if it doesn't exist
    if (!account.$jazz.has("root")) {
      console.info("[INFO] Initializing RegardeAccount root");
      // Initialize RegardeSDK with proper ownership
      const regardeSdk = await initRegardeSchema(account);
      // Set root with regarde-sdk
      account.$jazz.set("root", {
        "regarde-sdk": regardeSdk,
      });
      console.info("[SUCCESS] RegardeAccount root initialized with RegardeSDK");
    }
    // Ensure everything syncs
    await account.$jazz.waitForAllCoValuesSync();
    const { root } = await account.$jazz.ensureLoaded({
      resolve: {
        root: true,
      },
    });
    if (!root.$isLoaded) {
      throw new Error("Failed to load RegardeAccount root");
    }
    // Handle migration for accounts that have root but incomplete regarde-sdk
    // Use the proper Jazz pattern: check with .has() then access
    if (!root.$jazz.has("regarde-sdk")) {
      console.info("[INFO] Creating missing RegardeSDK");
      const regardeSdk = await initRegardeSchema(account);
      root.$jazz.set("regarde-sdk", regardeSdk);
      await account.$jazz.waitForSync();
    } else {
      // RegardeSDK exists, check if it needs update
      const regardeSDK = root["regarde-sdk"];
      if (regardeSDK && regardeSDK.$isLoaded && regardeSDK.version < 2) {
        console.info("[INFO] Migrating incomplete RegardeSDK");
        const regardeSdk = await initRegardeSchema(account);
        root.$jazz.set("regarde-sdk", regardeSdk);
        await account.$jazz.waitForSync();
      }
    }
    console.info("[SUCCESS] RegardeSDK migration completed");
    console.info("[SUCCESS] RegardeAccount migration completed");
  });
export type TRegardeAccount = co.loaded<typeof RegardeAccount>;
