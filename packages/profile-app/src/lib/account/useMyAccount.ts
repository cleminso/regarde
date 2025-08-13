//  Get account data without registration logic
import { OnboardingAccount } from '@onboarding.jazz/shared-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';

export function useMyAccount() {
  const isAuthenticated = useIsAuthenticated();
  const { me } = useAccount(OnboardingAccount, {
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
        },
      },
    },
  });

  return {
    isAuthenticated,
    account: me,
    profile: me?.profile,
    jazzAppProfile: me?.root['profile.jazz.dev'],
    accountId: me?.id,
    profileName: me?.profile?.name,

    isAccountReady: Boolean(me?.profile),

    hasStableProfile: Boolean(me?.profile && me.profile.name),
  };
}
