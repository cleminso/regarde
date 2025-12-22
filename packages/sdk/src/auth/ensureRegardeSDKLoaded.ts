import { co } from "jazz-tools";
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
    // Step 2: Access regarde-sdk with proper typing
    const regardeSDK = userAccount.root["regarde-sdk"] as
      | co.loaded<typeof RegardeSDK>
      | undefined;
    // Step 3: Check if RegardeSDK needs initialization
    if (!regardeSDK || !regardeSDK.$isLoaded) {
      console.log("[INFO] RegardeSDK not found or incomplete. Initializing...");

      // Simple: initialize and return
      const initializedSDK = await initRegardeSchema(userAccount);
      console.log("[SUCCESS] RegardeSDK initialized successfully");
      return initializedSDK;
    }
    // Step 4: Validate RegardeSDK integrity
    if (!regardeSDK.auth?.$isLoaded) {
      throw new Error("RegardeSDK auth not properly loaded");
    }
    // Check required auth fields exist
    if (!regardeSDK.auth.token || !regardeSDK.auth.expiresAt) {
      throw new Error("RegardeSDK auth missing required fields");
    }
    // Step 5: Check and refresh authentication token
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
