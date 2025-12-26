import { wordlist } from "@scure/bip39/wordlists/english.js";
import { validateMnemonic, generateMnemonic } from "@scure/bip39";
export interface PassphraseCredentials {
  accountID: string;
  accountSecret: string;
}

/**
 * Validates passphrase format using BIP39 standards
 */
export function validatePassphrase(passphrase: string): boolean {
  try {
    return validateMnemonic(passphrase, wordlist);
  } catch {
    return false;
  }
}

/**
 * Checks if passphrase has minimum word count requirement
 */
export function hasMinimumWords(
  passphrase: string,
  minWords: number = 12,
): boolean {
  const wordCount = passphrase.trim().split(/\s+/).length;
  return wordCount >= minWords;
}

/**
 * Generates a random valid passphrase for testing purposes
 */
export async function generateRandomPassphrase(
  wordCount: number = 12,
): Promise<string> {
  if (wordCount !== 12 && wordCount !== 24)
    throw new Error("Word cound shoul dbe either 12 or 24");
  return generateMnemonic(wordlist, wordCount);
}
