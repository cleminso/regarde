import { Loaded } from 'jazz-tools';
import { useMemo } from 'react';

import { OnboardingProfile } from '../schema';
import { generateDefaultAvatar } from '../utils';

export function useDefaultAvatar(profile: Loaded<typeof OnboardingProfile>) {
  return useMemo(() => {
    return (
      profile.avatar ||
      (profile.onboarding
        ? generateDefaultAvatar(profile.onboarding.nickname)
        : null)
    );
  }, [profile.avatar, profile.onboarding]);
}
