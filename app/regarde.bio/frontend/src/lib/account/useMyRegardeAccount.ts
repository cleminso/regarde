import { RegardeAccount } from '@regarde-dev/jazz-schemas';
import { useAccount, useIsAuthenticated, useLogOut } from 'jazz-tools/react';

// I create a custom hook to wrap account-related state.
// 1. check if the user is authenticated using `useIsAuthenticate` hook
// 2. it enable to conditionally load account data only for authenticated user
export function useMyRegardeAccount() {
  const isAuthenticated = useIsAuthenticated();

  // I define a variable `account` and use `useAccoun` from Jazz React to load the authenticated
  // user's Regarde Account. If the user is authenticated, I pass a resolve config that tells Jazz
  // to preload specific nested CoValues within the account's  root namespace.
  // Preload avoid additional network requests and make the data immediately available
  // 1. the complete profile data under `regarde.bio`
  // 2. the user handle data under `regarde-sdk`
  const account = useAccount(
    //
    RegardeAccount,
    isAuthenticated
      ? {
          resolve: {
            root: {
              'regarde.bio': {
                socialLinks: true,
                projects: { $each: true }, // `$each: true` tell Jazz to load each item in the array, not juste the array reference
                workExp: { $each: true },
                writing: { $each: true },
                education: { $each: true },
                certification: { $each: true },
                speaking: { $each: true },
                award: { $each: true },
                volunteering: { $each: true },
                sideProject: { $each: true },
                nowPage: true,
                avatarImage: { original: true },
              },
              'regarde-sdk': {
                userHandle: true,
              },
            },
          },
        }
      : {}, // when not authenticated I pass an empty resolution object `{}` meaning no data is laoded beyond account reference
  );

  // TODO: extract to caches this at the sdk level that sdk suer don't have to fetch it
  //const myRegardeSdkData = await getRegardeSdkData(account);

  const logOut = useLogOut();

  // I need to verify if account exists and is loaded, then i check if both namespaces are loaded.
  // So I extract the profile and auth from the account root. This enable safe access to CoValues without risking undefined errors when data hasn't sync yet.
  const regardeProfile =
    account && account.$isLoaded && account.root['regarde.bio']?.$isLoaded
      ? account.root['regarde.bio']
      : undefined;
  const regardeAuth =
    account && account.$isLoaded && account.root['regarde-sdk']?.$isLoaded
      ? account.root['regarde-sdk']
      : undefined;

  // Extract nickname from regardeAuth, handling the MaybeLoaded type
  const userNickname =
    regardeAuth && regardeAuth.userHandle?.$isLoaded
      ? regardeAuth.userHandle.nickname
      : undefined;

  return {
    account,
    regardeProfile,
    regardeAuth,
    userNickname,
    isAuthenticated,
    logOut,
    isAccountReady: !!(account && account.$isLoaded && regardeProfile),
  };
}
