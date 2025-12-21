import { PassphraseAuth } from "jazz-tools";
import { BIP39_WORDLIST } from "./utils/wordlist.js";
import { authStorage } from "./utils/storage.js";
import crypto from "node:crypto";

export const createPassphraseAuth = (passphrase: string) => {
  return new PassphraseAuth(
    crypto,
    fetch,
    authStorage as any, // casting to any because of version mismatch or loose typing
    BIP39_WORDLIST,
    passphrase,
  );
};

export const getStoredCredentials = async () => {
  return await authStorage.get();
};
