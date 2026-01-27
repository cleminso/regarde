import { useCallback, useState } from "react";
import type { Loaded } from "jazz-tools";
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
 * React hook for managing Regarde authentication tokens.
 *
 * Provides token state, expiration checking, and refresh functionality.
 * Does not automatically retry failed refreshes.
 *
 * @param regardeAuthCoMap - Loaded RegardeAuth CoMap instance
 * @returns Token state and refresh function
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
  RegardeAuthCoMap: Loaded<typeof RegardeAuth> | null | undefined,
): UseRegardeAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!RegardeAuthCoMap?.$isLoaded) {
      setError("No registration token CoMap provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newToken = await getRegardeAuth({
        loadedRegardeAuthCoMap: RegardeAuthCoMap,
      });
      if (!newToken) {
        setError("Failed to update registration token");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed: Unable to update token. Developer must manually call refresh() or implement retry logic. Automatic retries are disabled to prevent infinite loops.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [RegardeAuthCoMap]);

  return {
    token: RegardeAuthCoMap?.token ?? null,
    tokenId: RegardeAuthCoMap?.$jazz.id ?? null,
    expiresAt: RegardeAuthCoMap?.expiresAt ?? null,
    isExpired: RegardeAuthCoMap ? isTokenExpired(RegardeAuthCoMap) : true,
    refresh,
    isLoading,
    error,
  };
}
