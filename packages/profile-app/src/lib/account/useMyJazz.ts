import { OnboardingAccount } from '@onboarding.jazz/shared-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';

export function useMyJazz() {
  const isAuthenticated = useIsAuthenticated();
  
  const { me: account, logOut } = useAccount(
    OnboardingAccount, 
    isAuthenticated ? {
      resolve: {
        root: {
          'profile.jazz.dev': {
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
          'auth.jazz.dev': true,
        },
      },
    } : {}
  );

  return {
    isAuthenticated,
    account,
    profile: account?.profile,
    logOut,
    jazzAppProfile: account?.root?.['profile.jazz.dev'],
    accountId: account?.id,
    profileName: account?.profile?.name,
    isAccountReady: Boolean(account?.profile),
    hasStableProfile: Boolean(account?.profile?.name),
  };
}
