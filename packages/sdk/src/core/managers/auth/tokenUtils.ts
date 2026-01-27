/** Token lifetime in seconds (24 hours) */
export const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;

/**
 * Checks if a token has expired.
 *
 * @param regardeAuth - RegardeAuth object with expiresAt timestamp
 * @returns True if token is expired or invalid, false if still valid
 */
export function isTokenExpired(
  regardeAuth: { expiresAt?: number | null } | null | undefined,
): boolean {
  const expiresAt = regardeAuth?.expiresAt ?? null;
  const isExpiresAtValid =
    typeof expiresAt === "number" && Number.isFinite(expiresAt);
  if (isExpiresAtValid === false) return true;

  return Date.now() > expiresAt;
}
