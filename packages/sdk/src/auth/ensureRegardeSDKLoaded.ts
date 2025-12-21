import { co, Account } from "jazz-tools";
import { RegardeSDK } from "../auth/schemas/auth";
import { initRegardeSchema } from "../init/initRegardeSchema";
import { getRegardeAuth } from "../auth/refreshAuthToken";

/**
 * Ensures RegardeSDK is loaded with proper initialization and authentication
 *
 * This function provides automatic error repair and schema initialization for CLI applications
 * needing to access user's RegardeSDK data with proper authentication tokens.
 *
 * @param accountID - The Jazz account ID to load
 * @returns Loaded RegardeSDK with fresh authentication token
 * @throws Error if account loading fails and cannot be repaired
 */
export async function ensureRegardeSDKLoaded(
  accountID: string,
): Promise<co.loaded<typeof RegardeSDK>> {
  console.log("[DEBUG] Loading RegardeSDK for account:", accountID);

  try {
    // Step 1: Load account with RegardeSDK resolution
    const userAccount = await co.account().load(accountID, {
      resolve: { root: { ["regarde-sdk"]: true } },
    });

    if (!userAccount.$isLoaded) {
      throw new Error(`Failed to load account ${accountID}`);
    }

    console.log("[DEBUG] Account loaded successfully");

    // Step 2: Check if RegardeSDK needs initialization
    let regardeSDK = userAccount.root["regarde-sdk"];
    // TODO: Make sure that this does what it thinks it does,
    // the consequences will be dire if we are wrong.
    if (!regardeSDK?.$isLoaded) {
      console.warn("[INFO] Re-initialize RegardeSDK schema");
      // WARNING: THIS WILL ERASE ALL OF USER DATA IF THE PRE-CONDITION IS WRONG
      regardeSDK = await initRegardeSchema(userAccount);
      console.log("[SUCCESS] RegardeSDK initialized successfully");
    }

    // Step 3: Validate and refresh authentication token
    if (!regardeSDK.auth?.$isLoaded) {
      throw new Error("RegardeSDK auth not properly initialized");
    }

    // Check if token is expired and refresh if needed
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

    // Attempt automatic repair for common issues
    if (
      error.message.includes("not loaded") ||
      error.message.includes("not initialized")
    ) {
      console.log("[INFO] Attempting automatic repair...");

      try {
        // Try re-loading and re-initializing
        const userAccount = await co.account().load(accountID);
        const repairedSDK = await initRegardeSchema(userAccount);
        console.log("[SUCCESS] Automatic repair completed");

        // Refresh auth token after repair
        const newToken = await getRegardeAuth({
          loadedRegardeAuthCoMap: repairedSDK.auth,
        });

        if (!newToken) {
          throw new Error("Authentication could not be restored after repair");
        }

        console.log("[SUCCESS] Authentication restored after repair");
        return repairedSDK;
      } catch (repairError: any) {
        console.error("[ERROR] Automatic repair failed:", repairError.message);
        throw new Error(
          `Failed to load RegardeSDK and repair attempt failed: ${repairError.message}`,
        );
      }
    }

    throw error;
  }
}
