import { Loaded } from "jazz-tools";
import { RegardeAuth } from "./schema";
import { generateRegardeToken } from "./generateToken";
import { TOKEN_LIFETIME_SECONDS } from "./utils";

/**
 * Coucou
 */
export async function getRegardeAuth({
  loadedRegardeAuthCoMap,
}: {
  /**
   * -- TODO: Finish this JSDoc segment
   *
   * This **must** point to the fully loaded (via ensureLoaded) Jazz Schema
   * from the SDK `import {RegardeAuth} from @regarde-dev/sdk/auth;`
   *
   * To load it properly, make sure to do as follows:
   *
   * ```javascript
   * // This assumes the schema "account.root.RegardeAuth"
   *
   * const root = account.root.load({
   *   resolve: {
   *     RegardeAuth: true
   *   }
   * });
   *
   * const {RegardeAuth} = root.ensureLoaded({
   *   resolve: {
   *     RegardeAuth: true
   *   }
   * });
   * ```
   */
  loadedRegardeAuthCoMap: Loaded<typeof RegardeAuth>;
}): Promise<string | null> {
  const token = generateRegardeToken();

  try {
    if (!loadedRegardeAuthCoMap) {
      console.error("No auth target available after ensureLoaded");
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
    console.error("Failed to store registration key:", error);
    return null;
  }
}
