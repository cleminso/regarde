export const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;

export function isTokenExpired(regardeAuth: any): boolean {
  if (!regardeAuth?.expiresAt) return true;
  return Date.now() > regardeAuth.expiresAt;
}
