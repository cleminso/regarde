import { useParams } from "@tanstack/react-router";
import { co, ID, MaybeLoaded } from "jazz-tools";
import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import { useMemo } from "react";

import {
  RegardeAccount,
  RegardeSDK,
  App,
  type TApp,
  type TUserHandleLoaded,
  type TRegardeAuthLoaded,
} from "@regarde-dev/core";

/**
 * Unwraps MaybeLoaded<T> to get the fully loaded type T.
 * Used when we have runtime guarantees that data is loaded.
 */
type TUnwrapMaybeLoaded<T> = T extends MaybeLoaded<infer U> ? U : T;

/**
 * Return type for useMyRegardeAccount hook
 * Provides complete type safety for all loaded CoValues
 */
export type TUseMyRegardeAccount = {
  /** RegardeAccount instance for operations requiring full account access */
  account: co.loaded<typeof RegardeAccount> | undefined;

  /** List of user's apps (1-5 apps, fully loaded with payments)
   * Guaranteed to be defined when isAccountReady is true */
  myApps: TUnwrapMaybeLoaded<co.loaded<typeof RegardeSDK>["myApps"]>;

  /** User handle with nickname info */
  myUserHandle: TUserHandleLoaded | undefined;

  /** Auth token for API calls */
  auth: TRegardeAuthLoaded | undefined;

  /** Current loading state of the account */
  loadingState: "loading" | "loaded" | "unavailable" | "unauthorized";

  /** True when account and all critical data is loaded
   * When true, myApps is guaranteed to be loaded and accessible */
  isAccountReady: boolean;

  /** Currently selected app ID from URL params */
  selectedAppId: ID<typeof App> | null;

  /** Currently selected app object */
  selectedApp: TApp | undefined;
};

/**
 * Centralized hook for loading Regarde account data
 *
 * Loads all necessary CoValues for the dashboard:
 * - Account and profile
 * - RegardeSDK with auth, user handle, and apps
 * - Each app's payment records (as ID maps, not full PaymentEvents)
 *
 * For authentication operations (sign up, log in, log out),
 * use useRegardeAuth from the {@link https://www.npmjs.com/package/@regarde-dev/core @regarde-dev/core} react package
 *
 * @returns TUseMyRegardeAccount with loaded account data
 */
export function useMyRegardeAccount(): TUseMyRegardeAccount {
  const isAuthenticated = useIsAuthenticated();
  const params = useParams({ strict: false });
  const selectedAppId = (params?.appId as ID<typeof App>) ?? null;

  const account = useAccount(
    RegardeAccount,
    isAuthenticated
      ? {
          resolve: {
            root: {
              "regarde-sdk": {
                auth: true,
                myUserHandle: true,
                myApps: {
                  $each: {
                    payments: true,
                  },
                },
              },
            },
          },
        }
      : {},
  );

  const accountData = useMemo(() => {
    const isAccountLoaded = account?.$isLoaded === true;
    if (isAccountLoaded === false) {
      return null;
    }

    const regardeSdk = account.root?.["regarde-sdk"];
    const isSdkLoaded = regardeSdk?.$isLoaded === true;
    if (isSdkLoaded === false) {
      return null;
    }

    const myApps = regardeSdk.myApps;
    const isAppsLoaded = myApps?.$isLoaded === true;
    if (isAppsLoaded === false) {
      return null;
    }

    const myUserHandle = regardeSdk.myUserHandle;
    const isHandleLoaded = myUserHandle?.$isLoaded === true;

    const auth = regardeSdk.auth;
    const isAuthLoaded = auth?.$isLoaded === true;

    return {
      myApps,
      myUserHandle: isHandleLoaded ? myUserHandle : undefined,
      auth: isAuthLoaded ? auth : undefined,
    };
  }, [account]);

  const selectedApp = useMemo(() => {
    const hasApps = accountData?.myApps !== undefined;
    const hasSelectedId = selectedAppId !== null;

    if (hasApps === false || hasSelectedId === false) {
      return undefined;
    }

    const app = accountData.myApps.find((app: TApp) => app.$jazz.id === selectedAppId);
    const isAppLoaded = app?.$isLoaded === true;

    return isAppLoaded ? app : undefined;
  }, [accountData, selectedAppId]);

  const loadingState = useMemo(() => {
    if (account === undefined) {
      return "loading" as const;
    }
    return account.$jazz.loadingState;
  }, [account]);

  const isAccountReady = accountData !== null;

  if (isAccountReady === false) {
    return {
      account: undefined,
      myApps: [] as never,
      myUserHandle: undefined,
      auth: undefined,
      loadingState,
      isAccountReady: false,
      selectedAppId,
      selectedApp: undefined,
    };
  }

  return {
    account,
    myApps: accountData.myApps,
    myUserHandle: accountData.myUserHandle,
    auth: accountData.auth,
    loadingState,
    isAccountReady: true,
    selectedAppId,
    selectedApp,
  };
}

// Re-export types for convenience
export type { TApp, TUserHandleLoaded, TRegardeAuthLoaded };
