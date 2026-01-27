import { Loaded } from "jazz-tools";
import { useCallback, useState } from "preact/hooks";

import { RegardeAuth } from "#core/schemas/regardeAuth";
import { getRegardeAuth, isTokenExpired } from "#managers/auth";

/**
 * Authentication state and operations.
 */
export interface UseRegardeAuthResult {
  /** Current authentication token or null if not available */
  token: string | null;
  /** CoValue ID of the RegardeAuth CoMap (starts with co_) */
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
 * @param regardeAuthCoMap - Loaded RegardeAuth CoMap instance (null/undefined = no auth)
 * @returns Object containing token, loading state, and refresh function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { token, isExpired, refresh, error } = useRegardeAuth(regardeAuth);
 *
 *   if (error) return <div>Error: {error}</div>;
 *   return <div>Token: {token}</div>;
 * }
 * ```
 */
export function useRegardeAuth(
  regardeAuthCoMap: Loaded<typeof RegardeAuth> | null | undefined,
): UseRegardeAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!regardeAuthCoMap?.$isLoaded) {
      setError("No registration token CoMap provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newToken = await getRegardeAuth({
        loadedRegardeAuthCoMap: regardeAuthCoMap,
      });
      if (!newToken) {
        setError("Failed to update registration token");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [regardeAuthCoMap]);

  return {
    token: regardeAuthCoMap?.token ?? null,
    tokenId: regardeAuthCoMap?.$jazz.id ?? null,
    expiresAt: regardeAuthCoMap?.expiresAt ?? null,
    isExpired: regardeAuthCoMap ? isTokenExpired(regardeAuthCoMap) : true,
    refresh,
    isLoading,
    error,
  };
}
