// DEPRECATED
import { co } from "jazz-tools";
import { RegardeSDK } from "../auth/schemas/auth";
import { initRegardeSDK } from "../init/initRegardeSDK";
import { getRegardeAuth } from "../auth/refreshAuthToken";
import { RegardeAccount } from "../auth/schemas/regardeAccount";
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
  // Validate account is loaded
  if (!account || !account.$isLoaded) {
    throw new Error(
      "Account must be loaded before calling ensureRegardeSDKLoaded",
    );
  }

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
    const regardeSDK = root["regarde-sdk"];

    // Step 2: Check if RegardeSDK needs initialization
    if (!regardeSDK || !regardeSDK.$isLoaded) {
      console.info(
        "[INFO] RegardeSDK not found or incomplete. Initializing...",
      );

      // Ensure account root is loaded properly with resolution
      const { root } = await account.$jazz.ensureLoaded({
        resolve: {
          root: {
            "regarde-sdk": true,
          },
        },
      });

      if (!root.$isLoaded) {
        throw new Error("Account root not loaded");
      }

      // Initialize the RegardeSDK schema
      const regardeSDK = await initRegardeSDK(account);
      root.$jazz.set("regarde-sdk", regardeSDK);
      await regardeSDK.$jazz.waitForSync();
      await account.$jazz.waitForSync();

      console.info(
        "[SUCCESS] RegardeSDK initialized, set in account root, and synced",
      );
      return regardeSDK;
    }

    // Step 3: Validate RegardeSDK integrity
    // Explicitly load auth to ensure it's hydrated before checking
    await regardeSDK.$jazz.ensureLoaded({
      resolve: {
        auth: true,
      },
    });

    // Now verify auth is properly loaded
    if (!regardeSDK.auth?.$isLoaded) {
      throw new Error("RegardeSDK auth not properly loaded");
    }

    if (
      !regardeSDK.auth.$jazz.has("token") ||
      !regardeSDK.auth.$jazz.has("expiresAt")
    ) {
      throw new Error("RegardeSDK auth missing required fields");
    }

    // Guard against empty string token
    if (!regardeSDK.auth.token.trim()) {
      throw new Error("RegardeSDK auth token is empty");
    }

    // Step 4: Check and refresh authentication token
    const isExpired = Date.now() > regardeSDK.auth.expiresAt;
    if (isExpired) {
      console.info("[INFO] Authentication token expired, refreshing...");
      const newToken = await getRegardeAuth({
        loadedRegardeAuthCoMap: regardeSDK.auth,
      });
      if (!newToken) {
        throw new Error("Failed to refresh authentication token");
      }
    }

    await regardeSDK.auth.$jazz.waitForSync();

    return regardeSDK;
  } catch (error: any) {
    throw new Error("Failed to ensure RegardeSDK loaded", { cause: error });
  }
}
