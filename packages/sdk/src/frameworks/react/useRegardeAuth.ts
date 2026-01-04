/**
 * # React Authentication Hook - Authentication State Management
 *
 * ## Purpose
 * - Provides React hook for managing Regarde authentication tokens
 * - Handles token refresh, expiration checking, and error management
 *
 * ## Flow
 * 1. Hook initializes with RegardeAuth CoMap instance
 * 2. Provides current token state and expiration status
 * 3. Allows manual token refresh when needed
 * 4. Handles loading states and error reporting
 *
 * ## Migration
 * - Added React wrapper for token management
 * - Simplified token lifecycle for React applications
 */
import { useCallback, useState } from "react";
import type { Loaded } from "jazz-tools";
import { RegardeAuth } from "#core/schemas/auth";
import { getRegardeAuth, isTokenExpired } from "#managers/auth";

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
 * React hook for managing Regarde authentication tokens
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
