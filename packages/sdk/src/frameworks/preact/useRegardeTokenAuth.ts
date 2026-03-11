import { Loaded } from "jazz-tools";
import { useCallback, useState } from "preact/hooks";

import { RegardeTokenAuth } from "#core/schemas/regardeTokenAuth";
import { getRegardeTokenAuth, isTokenExpired } from "#managers/auth";

/**
 * Authentication state and operations.
 */
export interface UseRegardeTokenAuthResult {
  /** Current authentication token or null if not available */
  token: string | null;
  /** CoValue ID of the RegardeTokenAuth CoMap (starts with co_) */
  tokenId: string | null;
  /** Unix timestamp when the token expires or null if not available */
  expiresAt: number | null;
  /** Whether the current token has expired */
  isExpired: boolean;
  /** Function to refresh the authentication token */
  refresh: () => Promise<void>;
  /** Whether a token refresh operation is in progress */
  isLoading: boolean;
  /** Error message from the last token operation or null if no error */
  error: string | null;
}

/**
 * Preact hook for managing Regarde authentication tokens.
 *
 * Provides token state, expiration checking, and refresh functionality.
 * Does not automatically retry failed refreshes.
 *
 * @param regardeTokenAuthCoMap - Loaded RegardeTokenAuth CoMap instance (null/undefined = no auth)
 * @returns Object containing token, loading state, and refresh function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { token, isExpired, refresh, error } = useRegardeTokenAuth(regardeAuth);
 *
 *   if (error) return <div>Error: {error}</div>;
 *   return <div>Token: {token}</div>;
 * }
 * ```
 */
export function useRegardeTokenAuth(
  regardeTokenAuthCoMap: Loaded<typeof RegardeTokenAuth> | null | undefined,
): UseRegardeTokenAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const isCoMapLoaded =
      regardeTokenAuthCoMap !== null &&
      regardeTokenAuthCoMap !== undefined &&
      regardeTokenAuthCoMap.$isLoaded === true;
    if (isCoMapLoaded === false) {
      setError("No registration token CoMap provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newToken = await getRegardeTokenAuth({
        loadedRegardeAuthCoMap: regardeTokenAuthCoMap,
      });
      const hasNewToken = newToken !== null && newToken !== "";
      if (hasNewToken === false) {
        setError("Failed to update registration token");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [regardeTokenAuthCoMap]);

  const isCoMapPresent = regardeTokenAuthCoMap !== null && regardeTokenAuthCoMap !== undefined;

  return {
    token: regardeTokenAuthCoMap?.token ?? null,
    tokenId: regardeTokenAuthCoMap?.$jazz.id ?? null,
    expiresAt: regardeTokenAuthCoMap?.expiresAt ?? null,
    isExpired: isCoMapPresent ? isTokenExpired(regardeTokenAuthCoMap) : true,
    refresh,
    isLoading,
    error,
  };
}
