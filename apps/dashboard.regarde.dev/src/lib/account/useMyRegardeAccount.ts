import { useParams } from "@tanstack/react-router";
import { ID } from "jazz-tools";
import { useAccount, useIsAuthenticated, useLogOut } from "jazz-tools/react";

import {
  RegardeAccount,
  App,
  type TApp,
  type TUserHandleLoaded,
  type TRegardeAuthLoaded,
} from "@regarde-dev/core";

/**
 * Hook for accessing the current user's Regarde account with preloaded data.
 *
 * Loads all necessary CoValues for the dashboard:
 * - Account and profile
 * - RegardeSDK with auth, user handle, and apps
 * - Each app's payment records (as ID maps, not full PaymentEvents)
 *
 * For authentication operations (sign up, log in, log out), use useRegardeAuth.
 *
 * Usage:
 * ```tsx
 * const { isAccountReady, myApps, selectedApp, selectedAppId } = useMyRegardeAccount();
 *
 * if (isAccountReady === false) return <Loading />;
 *
 * // TypeScript now knows myApps is loaded
 * const app = myApps.find(app => app.$jazz.id === someId);
 * return <div>{selectedApp?.name}</div>;
 * ```
 *
 * @returns Object containing account data, derived values, and helper functions
 */
export function useMyRegardeAccount() {
  const isAuthenticated = useIsAuthenticated();
  const params = useParams({ strict: false });
  const selectedAppId = (params?.appId as ID<typeof App>) ?? null;
  const logOut = useLogOut();

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

  // Extract nested CoValues - check $isLoaded to get unwrapped types
  // TypeScript infers the correct loaded types automatically
  const regardeSdk =
    account && account.$isLoaded && account.root["regarde-sdk"]?.$isLoaded
      ? account.root["regarde-sdk"]
      : undefined;

  // myApps is the resolved CoList (loaded with $each)
  const myApps = regardeSdk?.myApps;

  // myUserHandle - check if loaded inside regardeSdk
  const myUserHandle =
    regardeSdk?.myUserHandle?.$isLoaded === true
      ? regardeSdk.myUserHandle
      : undefined;

  // auth - check if loaded inside regardeSdk
  const auth =
    regardeSdk?.auth?.$isLoaded === true ? regardeSdk.auth : undefined;

  // Find selected app from the apps list
  const selectedApp =
    myApps && selectedAppId !== null
      ? myApps.find((app: TApp) => app.$jazz.id === selectedAppId)
      : undefined;

  // Extract nickname if user handle is loaded
  const userNickname = myUserHandle?.nickname;

  // Determine if account is fully ready
  const isAccountReady = !!(account && account.$isLoaded && regardeSdk && myApps);

  return {
    account,
    regardeSdk,
    myApps,
    myUserHandle,
    auth,
    selectedApp,
    selectedAppId,
    userNickname,
    isAccountReady,
    isAuthenticated,
    logOut,
  };
}

// Re-export types for convenience
export type { TApp, TUserHandleLoaded, TRegardeAuthLoaded };
