import { Loaded } from "jazz-tools";

import { useLogging } from "#core/logger";
import { generateRegardeToken } from "#managers/auth/generateToken";
import { TOKEN_LIFETIME_SECONDS } from "#managers/auth/tokenUtils";
import { RegardeTokenAuth } from "#schemas/regardeTokenAuth";

const logger = useLogging({
  module: import.meta.filename,
});

/**
 * Generates and stores a new authentication token.
 *
 * Replaces existing token with new value and expiration timestamp.
 *
 * @param params - Token generation parameters
 * @param params.loadedRegardeAuthCoMap - Loaded RegardeTokenAuth CoMap to store token in
 * @returns Generated token string, or null if CoMap is invalid/store fails
 */
export async function getRegardeTokenAuth({
  loadedRegardeAuthCoMap,
}: {
  loadedRegardeAuthCoMap: Loaded<typeof RegardeTokenAuth> | null | undefined;
}): Promise<string | null> {
  if (loadedRegardeAuthCoMap === null || loadedRegardeAuthCoMap === undefined) {
    return null;
  }

  const isAuthLoaded = loadedRegardeAuthCoMap.$isLoaded === true;
  if (isAuthLoaded === false) {
    return null;
  }

  const token = generateRegardeToken();

  try {
    loadedRegardeAuthCoMap.$jazz.set("token", token);
    loadedRegardeAuthCoMap.$jazz.set("expiresAt", Date.now() + TOKEN_LIFETIME_SECONDS * 1000);

    await loadedRegardeAuthCoMap.$jazz.waitForSync();
    return token;
  } catch (error) {
    logger.error({
      message: "Failed to store authentication token in RegardeTokenAuth",
      data: {
        metadata: {
          operation: "refresh-auth-token",
        },
        error,
        loadedRegardeAuthCoMapId: loadedRegardeAuthCoMap.$jazz.id,
      },
    });
    return null;
  }
}
