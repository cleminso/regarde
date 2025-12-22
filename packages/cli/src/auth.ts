import { PassphraseAuth } from "jazz-tools";
import { BIP39_WORDLIST } from "./utils/wordlist.js";
import {
  saveCredentials,
  loadCredentials,
  clearCredentials,
} from "./utils/storage.js";
import crypto from "node:crypto";

interface JazzStorageInterface {
  set: (key: string, value: string) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  clear: (key: string) => Promise<void>;
}
// Type-safe adapter for Jazz storage requirements
const jazzStorage: JazzStorageInterface = {
  set: async (key: string, value: string) => {
    await saveCredentials(value);
  },
  get: async (key: string) => {
    return await loadCredentials();
  },
  clear: async (key: string) => {
    await clearCredentials();
  },
};
export const createPassphraseAuth = (passphrase: string) => {
  return new PassphraseAuth(
    crypto,
    fetch,
    jazzStorage,
    BIP39_WORDLIST,
    passphrase,
  );
};
export const getStoredCredentials = async () => {
  return await loadCredentials();
};
