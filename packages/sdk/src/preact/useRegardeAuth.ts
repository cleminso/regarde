/**
 * # Preact Authentication Hook - Authentication State Management
 *
 * ## Purpose
 * - Provides Preact hook for managing Regarde authentication tokens
 * - Handles token refresh, expiration checking, and error management
 *
 * ## Flow
 * 1. Hook initializes with RegardeAuth CoMap instance
 * 2. Provides current token state and expiration status
 * 3. Allows manual token refresh when needed
 * 4. Handles loading states and error reporting
 *
 * ## Migration
 * - Added Preact wrapper for token management
 * - Simplified token lifecycle for Preact applications
 */
import { useCallback, useState } from "preact/hooks";
import { Loaded } from "jazz-tools";
import { RegardeAuth, getRegardeAuth, isTokenExpired } from "../auth";

/**
 * Result object returned by useRegardeAuth hook containing token state and operations
 */
export interface UseRegardeAuthResult {
  /** Current authentication token or null if not available */
  token: string | null;
  /** Unique ID of the RegardeAuth CoMap containing the token */
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
 * Preact hook for managing Regarde authentication tokens
 *
 * @param regardeAuthCoMap - Loaded RegardeAuth schema instance
 * @returns Object containing current token state and refresh functionality
 *
 * ## Error Handling Note
 * This hook does not automatically retry failed token refresh.
 * If a refresh operation fails, the error state is set and
 * the developer must explicitly call refresh() again or
 * implement their own retry logic. This prevents potential
 * infinite loops of failed refresh attempts.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { token, isExpired, refresh, isLoading, error } = useRegardeAuth(regardeAuth);
 *
 *   if (error) {
 *     return <div>Error: {error}</div>;
 *   }
 *
 *   return <div>Current token: {token?.substring(0, 10)}...</div>;
 * }
 * ```
 */
export function useRegardeAuth(
  regardeAuthCoMap: Loaded<typeof RegardeAuth> | null | undefined,
): UseRegardeAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!regardeAuthCoMap) {
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
