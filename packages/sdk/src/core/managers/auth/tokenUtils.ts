/**
 * # Token Utility Module - Authentication Helper Functions
 *
 * ## Purpose
 * - Provides constants and utility functions for token management
 * - Handles token expiration validation
 *
 * ## Flow
 * 1. TOKEN_LIFETIME_SECONDS defines standard token duration
 * 2. isTokenExpired validates if token is still valid
 * 3. Token expiry checked before API requests
 *
 * ## Migration
 * - Standardized token lifetime to 24 hours (86400 seconds)
 */
/** Number of seconds a token remains valid (24 hours) */
export const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;

/**
 * Checks if a RegardeAuth token has expired
 *
 * @param regardeAuth - The RegardeAuth object containing expiresAt timestamp
 * @returns true if token is expired or invalid, false if still valid
 */
export function isTokenExpired(
  regardeAuth: { expiresAt?: number | null } | null | undefined,
): boolean {
  const expiresAt = regardeAuth?.expiresAt ?? null;
  const expiresAtValid =
    typeof expiresAt === "number" && Number.isFinite(expiresAt);
  if (expiresAtValid === false) return true;

  return Date.now() > expiresAt;
}
