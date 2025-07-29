import { OnboardingAccount } from '@onboarding.jazz/shared-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';

export function useMyAccount() {
  const isAuthenticated = useIsAuthenticated();
  const { me } = useAccount(OnboardingAccount, {
    resolve: {
      profile: true,
    },
  });

  const hasStableProfile = Boolean(me?.profile && me.profile.name);

  return {
    isAuthenticated,
    account: me,
    profile: me?.profile,
    accountId: me?.id,
    profileName: me?.profile?.name,

    currentNickname: hasStableProfile
      ? me?.profile?.onboarding?.nickname || ''
      : '',
    isNicknameActive: hasStableProfile
      ? me?.profile?.onboarding?.isActive || false
      : false,

    registrationKey: hasStableProfile
      ? me?.profile?.registrationKey
      : undefined,

    isAccountReady: Boolean(me?.profile), // Profile exist = account ready
    hasStableProfile, // Added for components that need onboarding data

    isOnboardingReady: hasStableProfile && Boolean(me?.profile?.onboarding),
  };
}
