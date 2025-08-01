// packages/profile-app/src/lib/account/useOnboardingData.ts
import { useCoState } from 'jazz-tools/react';

import { OnboardingNickname } from '../schema';
import { useMyAccount } from './useMyAccount';

export function useOnboardingData() {
  const { profile, hasStableProfile } = useMyAccount();

  const onboardingId =
    hasStableProfile && profile?.onboarding?.id
      ? profile.onboarding.id
      : undefined;

  const onboarding = useCoState(OnboardingNickname, onboardingId);

  return {
    onboarding,
    currentNickname: onboarding?.nickname || '',
    isNicknameActive: onboarding?.isActive || false,

    isLoading: onboarding === undefined,
    isAccessible: onboarding !== null,
    isAvailable: Boolean(onboarding),
  };
}
