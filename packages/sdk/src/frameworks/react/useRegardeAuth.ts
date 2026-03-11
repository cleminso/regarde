import { wordlist } from "@scure/bip39/wordlists/english.js";
import type { MaybeLoaded } from "jazz-tools";
import { usePassphraseAuth, useAccount, useLogOut } from "jazz-tools/react";
import { useMemo } from "react";

import { RegardeAccount } from "#schemas/regardeAccount";
import type { TRegardeAccount } from "#schemas/regardeAccount";
import { RegardeSDK } from "#schemas/regardeSDK";
import type { TRegardeSDK } from "#schemas/regardeSDK";

export type TUseRegardeAuthState = "anonymous" | "signedIn";

export interface TSignUpResult {
  passphrase: string;
  accountId: string;
}

export interface TUseRegardeAuthResult {
  state: TUseRegardeAuthState;
  signUp: (userName: string, passphrase?: string) => Promise<TSignUpResult>;
  logIn: (passphrase: string) => Promise<void>;
  logOut: () => void;
  generatePassphrase: () => string;
  account: MaybeLoaded<TRegardeAccount>;
  regardeSDK: MaybeLoaded<TRegardeSDK> | null;
}

/**
 * React hook for passphrase-based authentication with Regarde SDK.
 *
 * Wraps Jazz's usePassphraseAuth with BIP39 wordlist. RegardeSDK is automatically
 * initialized via RegardeAccount.withMigration during account creation.
 *
 * @returns Authentication state, methods, and loaded account/SDK instances
 *
 * @example
 * ```tsx
 * function AuthComponent() {
 *   const { state, signUp, logIn, logOut, account, regardeSDK } = useRegardeAuth();
 *
 *   if (state === "anonymous") {
 *     return <LoginForm onLogin={logIn} onSignUp={signUp} />;
 *   }
 *
 *   if (!account.$isLoaded) {
 *     switch (account.$jazz.loadingState) {
 *       case "loading":
 *         return <div>Loading account...</div>;
 *       case "unavailable":
 *         return <div>Account not found</div>;
 *       case "unauthorized":
 *         return <div>Access denied</div>;
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome, {account.name}!</p>
 *       <button onClick={logOut}>Log out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRegardeAuth(): TUseRegardeAuthResult {
  const jazzAuth = usePassphraseAuth({ wordlist });
  const logOut = useLogOut();

  const account = useAccount(RegardeAccount, {
    resolve: {
      root: {
        "regarde-sdk": {
          auth: true,
          myUserHandle: true,
        },
      },
    },
  });

  const state: TUseRegardeAuthState = useMemo(() => {
    const isSignedIn = jazzAuth.state === "signedIn";
    return isSignedIn === true ? "signedIn" : "anonymous";
  }, [jazzAuth.state]);

  const signUp = useMemo(() => {
    return async (userName: string, providedPassphrase?: string): Promise<TSignUpResult> => {
      const passphrase = providedPassphrase ?? jazzAuth.generateRandomPassphrase();
      await jazzAuth.registerNewAccount(passphrase, userName);
      const isAccountLoaded = account !== null && account.$isLoaded === true;
      const accountId = isAccountLoaded === true ? account.$jazz.id : "";
      return { passphrase, accountId };
    };
  }, [jazzAuth, account]);

  const regardeSDK = useMemo((): MaybeLoaded<TRegardeSDK> | null => {
    const isAccountLoaded = account !== null && account.$isLoaded === true;
    if (isAccountLoaded === false) {
      return null;
    }

    const isRootLoaded = account.root !== null && account.root.$isLoaded === true;
    if (isRootLoaded === false) {
      return null;
    }

    const sdk = account.root["regarde-sdk"];
    if (sdk === null || sdk === undefined) {
      return null;
    }

    return sdk as MaybeLoaded<TRegardeSDK>;
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
    account,
    regardeSDK,
  };
}
