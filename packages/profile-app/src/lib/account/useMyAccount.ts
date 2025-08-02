//  Get account data without registration logic
import { OnboardingAccount } from '@onboarding.jazz/shared-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';

export function useMyAccount() {
  const isAuthenticated = useIsAuthenticated();
  const { me } = useAccount(OnboardingAccount, {
    resolve: { profile: true },
  });

  return {
    isAuthenticated,
    account: me,
    profile: me?.profile,
    accountId: me?.id,
    profileName: me?.profile?.name,

    isAccountReady: Boolean(me?.profile),

    hasStableProfile: Boolean(me?.profile && me.profile.name),
  };
}
