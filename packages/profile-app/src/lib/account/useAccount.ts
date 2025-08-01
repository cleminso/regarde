import { OnboardingAccount } from '@onboarding.jazz/shared-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react-core';

import { useRegistrationKey } from './useRegistrationKey';

// Unified account hook with onboarding data
export function useOnboardingAccount() {
  const isAuthenticated = useIsAuthenticated();
  const { me } = useAccount(OnboardingAccount, {
    resolve: {
      profile: {
        onboarding: true,
        registrationKey: true,
      },
    },
  });

  const { getValidKey, isAccountReady } = useRegistrationKey();

  return {
    // Account data
    isAuthenticated,
    account: me,
    accountId: me?.id,
    profile: me?.profile,

    // Onboarding data
    currentNickname: me?.profile?.onboarding?.nickname || '',
    isNicknameActive: me?.profile?.onboarding?.isActive || false,

    // Registration
    getValidKey,
    isAccountReady: Boolean(me?.profile && isAccountReady),
    hasExistingNickname: Boolean(
      me?.profile?.onboarding?.nickname && me?.profile?.onboarding?.isActive,
    ),
  };
}
