import { wordlist } from "@scure/bip39/wordlists/english.js";
import type { co } from "jazz-tools";
import { usePassphraseAuth, useAccount, useLogOut } from "jazz-tools/react";
import { useMemo } from "react";

import { RegardeAccount } from "#schemas/regardeAccount";
import { RegardeSDK } from "#schemas/regardeSDK";

export type UseRegardeAuthState = "anonymous" | "signedIn";

export interface SignUpResult {
  passphrase: string;
  accountId: string;
}

export interface UseRegardeAuthResult {
  state: UseRegardeAuthState;
  signUp: (userName: string, passphrase?: string) => Promise<SignUpResult>;
  logIn: (passphrase: string) => Promise<void>;
  logOut: () => void;
  generatePassphrase: () => string;
  account: co.loaded<typeof RegardeAccount> | null;
  regardeSDK: co.loaded<typeof RegardeSDK> | null;
  // TODO: add a new login option via secret
}

/**
 * React hook for passphrase-based authentication with Regarde SDK.
 *
 * Wraps Jazz's usePassphraseAuth with BIP39 wordlist. RegardeSDK is automatically
 * initialized via RegardeAccount.withMigration during account creation.
 *
 * @returns Authentication state, methods, and loaded account/SDK instances
 */
export function useRegardeAuth(): UseRegardeAuthResult {
  const jazzAuth = usePassphraseAuth({ wordlist });
  const logOut = useLogOut();

  const account = useAccount(RegardeAccount, {
    resolve: {
      root: {
        "regarde-sdk": {
          auth: true,
          myApps: true,
          myUserHandle: true,
          myPayments: true,
        },
      },
    },
  });

  const state: UseRegardeAuthState = useMemo(() => {
    const isSignedIn = jazzAuth.state === "signedIn";
    return isSignedIn === true ? "signedIn" : "anonymous";
  }, [jazzAuth.state]);

  const signUp = useMemo(() => {
    return async (
      userName: string,
      providedPassphrase?: string,
    ): Promise<SignUpResult> => {
      const passphrase =
        providedPassphrase ?? jazzAuth.generateRandomPassphrase();
      await jazzAuth.registerNewAccount(passphrase, userName);
      const isAccountLoaded = account !== null && account.$isLoaded === true;
      const accountId = isAccountLoaded === true ? account.$jazz.id : "";
      return { passphrase, accountId };
    };
  }, [jazzAuth, account]);

  const regardeSDK = useMemo(() => {
    const isAccountLoaded = account !== null && account.$isLoaded === true;
    if (isAccountLoaded === false) {
      return null;
    }

    const isRootLoaded =
      account.root !== null && account.root.$isLoaded === true;
    if (isRootLoaded === false) {
      return null;
    }

    const sdk = account.root["regarde-sdk"];
    const isSdkLoaded =
      sdk !== null && sdk !== undefined && sdk.$isLoaded === true;

    return isSdkLoaded === true ? sdk : null;
  }, [account]);

  const loadedAccount = useMemo(() => {
    const isLoaded = account !== null && account.$isLoaded === true;
    return isLoaded === true ? account : null;
  }, [account]);

  const generatePassphrase = useMemo(() => {
    return (): string => {
      return jazzAuth.generateRandomPassphrase();
    };
  }, [jazzAuth]);

  return {
    state,
    signUp,
    logIn: jazzAuth.logIn,
    logOut,
    generatePassphrase,
    account: loadedAccount,
    regardeSDK,
  };
}
