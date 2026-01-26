/**
 * # Token Generation Module - Authentication Token Creator
 *
 * ## Purpose
 * - Generates random authentication tokens for temporary API access
 * - Creates unique tokens using WebCrypto (crypto.getRandomValues)
 *
 * ## Flow
 * 1. Function called when new token is needed
 * 2. Random selection from character set
 * 3. 16-character token returned
 *
 * ## Migration
 * - Initial token generation implementation
 * - Uses alphanumeric and special characters for uniqueness
 */
/**
 * Generates a random token for authentication
 *
 * Creates a 16-character token using letters, numbers, and common special characters.
 * This provides sufficient uniqueness for temporary authentication tokens with limited lifetime.
 *
 * @private Internal function used by token management system
 * @returns A randomly generated 16-character token string
 *
 * @example
 * const token = generateRegardeToken();
 * console.log(`Generated token: ${token.substring(0, 8)}...`);
 *
 */
export function generateRegardeToken(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"[]{}';

  const getRandomValues = globalThis.crypto?.getRandomValues?.bind(
    globalThis.crypto,
  );
  const isCryptoAvailable = typeof getRandomValues === "function";

  if (isCryptoAvailable === false) {
    throw new Error("WebCrypto getRandomValues() is not available");
  }

  const tokenLength = 16;
  const charsLength = chars.length;
  const maxUnbiasedByte = Math.floor(256 / charsLength) * charsLength;

  let token = "";
  const randomBytes = new Uint8Array(tokenLength * 2);

  while (token.length < tokenLength) {
    getRandomValues(randomBytes);

    for (const byte of randomBytes) {
      if (byte >= maxUnbiasedByte) continue;
      token += chars[byte % charsLength];
      if (token.length === tokenLength) break;
    }
  }

  return token;
}
