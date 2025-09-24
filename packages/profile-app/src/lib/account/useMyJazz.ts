import { OnboardingAccount } from '@onboarding.jazz/shared-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';

export function useMyJazz() {
  const isAuthenticated = useIsAuthenticated();

  const { me: account, logOut } = useAccount(
    OnboardingAccount,
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

  const jazzAppProfile = account?.root?.['regarde.bio'];
  const registrationKey = account?.root?.['auth.regarde.bio'];

  return {
    account,
    jazzAppProfile,
    registrationKey,
    isAuthenticated,
    logOut,
    isAccountReady: !!account && !!jazzAppProfile,
  };
}
