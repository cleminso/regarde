import { co } from "jazz-tools";
import { RegardeAccount, RegardeSDK } from "@regarde-dev/sdk/auth";
import { getStoredCredentials } from "./auth.js";
import { startWorker } from "jazz-tools/worker";

/**
 * CLI authentication utilities for loading and managing RegardeSDK
 *
 * Provides common authentication patterns for CLI commands to:
 * - Load user credentials with automatic repair
 * - Ensure RegardeSDK is properly initialized
 * - Handle authentication token validation and refresh
 * - Provide consistent error handling across CLI tools
 */

/**
 * Loads authenticated RegardeSDK for CLI operations
 *
 * This function uses stored credentials from previous login to avoid
 * prompting for credentials every time.
 *
 * @returns Freshly loaded RegardeSDK with valid authentication
 * @throws Error if cannot authenticate or repair automatically
 */
export async function loadAuthenticatedRegardeSDK() {
  // Step 1: Load stored credentials
  const credsStr = await getStoredCredentials();
  if (!credsStr) {
    throw new Error("Not logged in. Please run 'regarde login' first.");
  }

  // Step 2: Parse credentials
  let creds: { accountID: string; accountSecret: string };
  try {
    const parsed = JSON.parse(credsStr);
    creds = {
      accountID: String(parsed.accountID || ""),
      accountSecret: String(parsed.accountSecret || ""),
    };
  } catch (e) {
    throw new Error("Invalid credentials format. Please re-login.", {
      cause: e,
    });
  }

  const { accountID, accountSecret } = creds;
  if (!accountID || !accountSecret) {
    throw new Error("Incomplete credentials. Please re-login.");
  }

  // Step 3: Start worker with stored credentials
  const workerOptions = {
    AccountSchema: RegardeAccount,
    syncServer: "wss://cloud.jazz.tools",
    accountID: creds.accountID,
    accountSecret: creds.accountSecret,
  };

  const { worker } = await startWorker(workerOptions);

  // Step 4: Load RegardeSDK with automatic initialization and repair
  try {
    // Load RegardeAccount with proper resolve for auth field
    await RegardeAccount.load(creds.accountID, {
      loadAs: worker,
      resolve: {
        root: {
          "regarde-sdk": {
            auth: true,
          },
        },
      },
    });
  } catch (error: any) {
    // Provide user-friendly error messages for common issues
    if (error.message.includes("not logged in")) {
      throw new Error("Please run 'regarde login' first to authenticate.", {
        cause: error,
      });
    }

    if (
      error.message.includes("network") ||
      error.message.includes("connection")
    ) {
      throw new Error(
        "Network connectivity issue. Please check your internet connection and try again.",
        { cause: error },
      );
    }

    if (
      error.message.includes("permission") ||
      error.message.includes("access")
    ) {
      throw new Error(
        "Account access issue. Please re-login to refresh your session.",
        { cause: error },
      );
    }

    // Re-throw original error for other cases
    throw error;
  }
}

/**
 * Validates that authentication is still valid
 *
 * Checks if current authentication token is still valid for API requests.
 * This should be called before making authenticated API calls.
 *
 * @param regardeSDK - Loaded RegardeSDK to validate
 * @returns true if authentication is valid, false otherwise
 */
export function isAuthenticationValid(
  regardeSDK: co.loaded<typeof RegardeSDK>,
): boolean {
  if (!regardeSDK || !regardeSDK.$isLoaded) {
    return false;
  }

  if (!regardeSDK.auth?.$isLoaded) {
    return false;
  }

  // Check token expiry
  return Date.now() <= regardeSDK.auth.expiresAt;
}

/**
 * Gets current authentication headers for API requests
 *
 * Extracts the current authentication token and ID for use in API request headers.
 * Call this function to get the headers needed for authenticated API calls.
 *
 * @param regardeSDK - Loaded RegardeSDK with valid authentication
 * @returns Headers object with X-Regarde-Token and X-Regarde-Token-Id
 * @throws Error if authentication is not valid
 */
export function getAuthenticationHeaders(
  regardeSDK: co.loaded<typeof RegardeSDK>,
) {
  if (!isAuthenticationValid(regardeSDK)) {
    throw new Error("Authentication not valid. Please re-login.");
  }

  if (!regardeSDK.auth.$isLoaded) {
    throw new Error("Authentication not properly loaded");
  }

  return {
    "X-Regarde-Token": regardeSDK.auth.token,
    "X-Regarde-Token-Id": regardeSDK.auth.$jazz.id,
  };
}
