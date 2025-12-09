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
          "regarde-sdk": true
        },
      },
      select: (account) => account.$isLoaded ? account : account.$jazz.loadingState === "loading" ? undefined : null
    } : {}
  );
  const logOut = useLogOut();

  const regardeProfile = account && account.$isLoaded ? account.root['regarde.bio'] : undefined;
  const regardeAuth = account && account.$isLoaded ? account.root['regarde-sdk'] : undefined;

  return {
    account,
    regardeProfile,
    regardeAuth,
    isAuthenticated,
    logOut,
    isAccountReady: !!(account && account.$isLoaded) && !!regardeProfile,
  };
}
