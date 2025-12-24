import { co } from "jazz-tools";
import { RegardeSDK } from "../auth/schemas/auth";
import { initRegardeSchema } from "../init/initRegardeSchema";
import { getRegardeAuth } from "../auth/refreshAuthToken";
import {
  RegardeAccount,
  type RegardeAccountType,
} from "../auth/schemas/regarde-account";
/**
 * Ensures RegardeSDK is loaded with proper initialization and authentication
 *
 * This function provides automatic error repair and schema initialization for CLI applications
 * needing to access user's RegardeSDK data with proper authentication tokens.
 *
 * @param account - The loaded Jazz Account (from worker context)
 * @returns Loaded RegardeSDK with fresh authentication token
 * @throws Error if account is not loaded or SDK initialization fails
 */
export async function ensureRegardeSDKLoaded(
  account: co.loaded<typeof RegardeAccount>,
): Promise<co.loaded<typeof RegardeSDK>> {
  console.log("[DEBUG] Loading RegardeSDK for account:", account.$jazz.id);

  // Validate account is loaded
  if (!account || !account.$isLoaded) {
    throw new Error(
      "Account must be loaded before calling ensureRegardeSDKLoaded",
    );
  }

  console.log("[DEBUG] Account is loaded and valid");

  try {
    // Step 1: Load account with explicit root resolution so TypeScript knows the structure
    const { root } = await account.$jazz.ensureLoaded({
      resolve: {
        root: {
          "regarde-sdk": true,
        },
      },
    });

    // Now TypeScript knows root["regarde-sdk"] exists and has proper typing
    const regardeSDK = root["regarde-sdk"] as
      | co.loaded<typeof RegardeSDK>
      | undefined;

    // Step 2: Check if RegardeSDK needs initialization
    if (!regardeSDK || !regardeSDK.$isLoaded) {
      console.log("[INFO] RegardeSDK not found or incomplete. Initializing...");

      // Ensure account root is loaded properly with resolution
      const { root } = await account.$jazz.ensureLoaded({
        resolve: {
          root: {
            "regarde-sdk": true,
          },
        },
      });

      if (!root.$isLoaded) {
        console.log("Coucou");
      }

      // Initialize the RegardeSDK schema
      const regardeSDK = await initRegardeSchema(account);

      // CRITICAL: Set the RegardeSDK in the account root so it persists
      console.log("[DEBUG] Setting RegardeSDK in account root...");
      root.$jazz.set("regarde-sdk", regardeSDK);

      // Wait for sync to ensure the CoMap is properly saved to the network
      console.log("[DEBUG] Ensuring RegardeSDK syncs to network...");
      await account.$jazz.waitForSync();

      console.log(
        "[SUCCESS] RegardeSDK initialized, set in account root, and synced",
      );
      return regardeSDK;
    }

    // Step 3: Validate RegardeSDK integrity
    if (!regardeSDK.auth?.$isLoaded) {
      throw new Error("RegardeSDK auth not properly loaded");
    }
    // Check required auth fields exist
    if (!regardeSDK.auth.token || !regardeSDK.auth.expiresAt) {
      throw new Error("RegardeSDK auth missing required fields");
    }

    // Step 4: Check and refresh authentication token
    const isExpired = Date.now() > regardeSDK.auth.expiresAt;
    if (isExpired) {
      console.log("[INFO] Authentication token expired, refreshing...");
      const newToken = await getRegardeAuth({
        loadedRegardeAuthCoMap: regardeSDK.auth,
      });
      if (!newToken) {
        throw new Error("Failed to refresh authentication token");
      }
      console.log("[SUCCESS] Authentication token refreshed");
    }

    console.log("[DEBUG] RegardeSDK is loaded with valid authentication");
    return regardeSDK;
  } catch (error: any) {
    console.error("[ERROR] Failed to ensure RegardeSDK loaded:", error.message);
    throw error;
  }
}
