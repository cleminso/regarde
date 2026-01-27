/**
 * Generates a registration token for 2FA authentication.
 *
 * @returns Randomly generated 16-character token string
 * @throws {Error} When WebCrypto getRandomValues is not available
 */
export function generateRegardeToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"[]{}';

  const getRandomValues = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto);
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
