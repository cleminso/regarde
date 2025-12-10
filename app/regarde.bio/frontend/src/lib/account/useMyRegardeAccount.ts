import { RegardeAccount } from '@regarde-dev/jazz-schemas';
import { useAccount, useIsAuthenticated, useLogOut } from 'jazz-tools/react';

export function useMyRegardeAccount() {
  const isAuthenticated = useIsAuthenticated();

  const account = useAccount(
    RegardeAccount,
    isAuthenticated ? {
      resolve: {
        root: {
          'regarde.bio': {
            socialLinks: true,
            projects: { $each: true },
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
          "regarde-sdk": {
            UserHandle: true
          }
        },
      },
    } : {}
  );

  // TODO: extract to caches this at the sdk level that sdk suer don't have to fetch it
  //const myRegardeSdkData = await getRegardeSdkData(account);

  const logOut = useLogOut();

  const regardeProfile = account && account.$isLoaded && account.root['regarde.bio']?.$isLoaded
    ? account.root['regarde.bio']
    : undefined;
  const regardeAuth = account && account.$isLoaded && account.root['regarde-sdk']?.$isLoaded
    ? account.root['regarde-sdk']
    : undefined;

  // Extract nickname from regardeAuth, handling the MaybeLoaded type
  const userNickname = regardeAuth && regardeAuth.userHandle?.$isLoaded
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
