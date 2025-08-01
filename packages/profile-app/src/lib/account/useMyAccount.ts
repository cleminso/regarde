// packages/profile-app/src/lib/account/useMyAccount.ts
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

    // Simple account readiness - just profile existence
    isAccountReady: Boolean(me?.profile),

    // Helper for components that need basic profile validation
    hasStableProfile: Boolean(me?.profile && me.profile.name),
  };
}
