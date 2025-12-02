import { Loaded } from "jazz-tools";
import { generateRegardeToken } from "./generateToken";
import { TOKEN_LIFETIME_SECONDS } from "./tokenUtils";
import { RegardeAuth } from "./schemas/auth";

/**
 # Regarde Token - How to get a token?
 *
 * ## Purpose
 - Generates and refreshes authentication tokens for API access
 - Ensures tokens are properly stored with expiration in the RegardeAuth schema
 - Handles error scenarios during token operations
 *
 * ## Token Lifecycle
 1. When useRegardeAuth requests a token, this function generates a random token on demand
 2. Token is stored by getRegardeAuth() in the user's RegardeAuth schema at account.root["api.regarde.dev"]
 3. Token is synchronized to Jazz cloud via waitForSync to ensure availability before returning to the calling component
 4. Token expires after 24 hours, requiring manual refresh when a component calls again
 *
 ## Error Handling
 This function does not automatically refresh token after a failed attempt.
 If token generation fails, null is returned and developer must explicitly
 call the function again or implement their own retry logic. This prevents
 potential infinite loops of failed refresh attempts.
 *
 * ## Implementation Details
 * Tokens use JavaScript's Math.random() for generation with time-based expiration for security while keeping client-side refresh to maintain stateless authentication.
 *
 * ## Migration
 * - Initial version with 16-character random token generation
 * - Token expiration set to 24 hours from generation time
 */

/**
 * Generates a new authentication token and stores it in RegardeAuth
 *
 * @param params - Token generation parameters
 * @param params.loadedRegardeAuthCoMap - Fully loaded RegardeAuth CoMap from account.root["api.regarde.dev"]
 *   This must be properly loaded via ensureLoaded() with RegardeAuth resolved:
 *   ```javascript
 *   const root = account.root.load({
 *     resolve: { RegardeAuth: true }
 *   });
 *
 *   const {RegardeAuth} = await root.ensureLoaded({
 *     resolve: { RegardeAuth: true }
 *   });
 *   ```
 * @returns The generated token string or null if generation failed
 *
 * @example
 * ```javascript
 * const token = await getRegardeAuth({
 *   loadedRegardeAuthCoMap: myRegardeAuth
 * });
 * ```
 */
export async function getRegardeAuth({
  loadedRegardeAuthCoMap,
}: {
  loadedRegardeAuthCoMap: Loaded<typeof RegardeAuth>;
}): Promise<string | null> {
  const token = generateRegardeToken();

  try {
    if (!loadedRegardeAuthCoMap) {
      console.error(
        "[ERROR] No auth target available after ensureLoaded. Ensure RegardeAuth is properly loaded with RegardeAuth: true in resolve option.",
      );
      return null;
    }

    loadedRegardeAuthCoMap.$jazz.set("token", token);
    loadedRegardeAuthCoMap.$jazz.set(
      "expiresAt",
      Date.now() + TOKEN_LIFETIME_SECONDS * 1000,
    );

    await loadedRegardeAuthCoMap.$jazz.waitForSync();
    return token;
  } catch (error) {
    console.error(
      "[ERROR] Failed to store authentication token:",
      error,
      ". Verify Jazz network connection and account permissions.",
    );
    return null;
  }
}
