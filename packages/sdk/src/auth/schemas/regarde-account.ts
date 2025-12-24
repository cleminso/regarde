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

// Simple root schema with just regarde-sdk (unlike profile.ts which has regarde.bio too)
export const RegardeRoot = co.map({
  "regarde-sdk": RegardeSDK,
});

// Account schema that knows about regarde-sdk in root
export const RegardeAccount = co
  .account({
    profile: co.profile(),
    root: RegardeRoot,
  })
  .withMigration(async (account) => {
    console.log("[DEBUG] RegardeAccount migration started");

    // Initialize profile if it doesn't exist
    if (!account.$jazz.has("profile")) {
      console.log("[INFO] Initializing RegardeAccount profile");
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
      console.log("[INFO] Initializing RegardeAccount root");

      // Initialize RegardeSDK with proper ownership
      const regardeSdk = await initRegardeSchema(account);

      // Set root with regarde-sdk
      account.$jazz.set("root", {
        "regarde-sdk": regardeSdk,
      });

      console.log("[SUCCESS] RegardeAccount root initialized with RegardeSDK");
    }

    // Ensure everything syncs
    await account.$jazz.waitForAllCoValuesSync();

    // Load and verify
    const { root } = await account.$jazz.ensureLoaded({
      resolve: {
        root: {
          "regarde-sdk": true,
        },
      },
    });

    if (!root.$isLoaded) {
      throw new Error("Failed to load RegardeAccount root");
    }

    // Handle migration for accounts that have root but incomplete regarde-sdk
    if (
      !root["regarde-sdk"] ||
      !root["regarde-sdk"].$isLoaded ||
      root["regarde-sdk"].version < 2
    ) {
      console.log("[INFO] Migrating incomplete RegardeSDK");

      const regardeSdk = await initRegardeSchema(account);
      root.$jazz.set("regarde-sdk", regardeSdk);

      await account.$jazz.waitForSync();
      console.log("[SUCCESS] RegardeSDK migration completed");
    }

    console.log("[SUCCESS] RegardeAccount migration completed");
  });

export type RegardeAccountType = co.loaded<typeof RegardeAccount>;
