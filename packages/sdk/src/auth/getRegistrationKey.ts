import { Loaded } from "jazz-tools";
import { RegistrationKey } from "./schema";
import { generateRegistrationKey } from "./generateKey";
import { KEY_LIFETIME_SECONDS } from "./utils";

/**
 * Coucou
 */
export async function getRegistrationKey({
  loadedRegistrationKeyCoMap,
}: {
  /**
   * -- TODO: Finish this JSDoc segment
   *
   * This **must** point to the fully loaded (via ensureLoaded) Jazz Schema
   * from the SDK `import {RegistrationKey} from @regarde-dev/sdk/auth;`
   *
   * To load it properly, make sure to do as follows:
   *
   * ```javascript
   * // This assumes the schema "account.root.registrationKey"
   *
   * const root = account.root.load({
   *   resolve: {
   *     registrationKey: true
   *   }
   * });
   *
   * const {registrationKey} = root.ensureLoaded({
   *   resolve: {
   *     registrationKey: true
   *   }
   * });
   * ```
   */
  loadedRegistrationKeyCoMap: Loaded<typeof RegistrationKey>;
}): Promise<string | null> {
  const key = generateRegistrationKey();

  try {
    if (!loadedRegistrationKeyCoMap) {
      console.error("No auth target available after ensureLoaded");
      return null;
    }

    loadedRegistrationKeyCoMap.$jazz.set("key", key);
    loadedRegistrationKeyCoMap.$jazz.set(
      "expiresAt",
      Date.now() + KEY_LIFETIME_SECONDS * 1000,
    );

    await loadedRegistrationKeyCoMap.$jazz.waitForSync();
    return key;
  } catch (error) {
    console.error("Failed to store registration key:", error);
    return null;
  }
}
