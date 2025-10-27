import { RegardeAccount } from '@regarde-dev/jazz-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';

export function useMyJazz() {
  const isAuthenticated = useIsAuthenticated();

  const { me: account, logOut } = useAccount(
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
          'auth.regarde.bio': true,
        },
      },
    } : {}
  );

  const regardeProfile = account?.root?.['regarde.bio'];
  const regardeAuth = account?.root?.['auth.regarde.bio'];

  return {
    account,
    regardeProfile,
    regardeAuth,
    isAuthenticated,
    logOut,
    isAccountReady: !!account && !!regardeProfile,
  };
}
