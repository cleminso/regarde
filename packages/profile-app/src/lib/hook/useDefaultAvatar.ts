import { Loaded } from 'jazz-tools';
import { useMemo } from 'react';

import { OnboardingProfile } from '../schema';
import { generateDefaultAvatar } from '../utils';

export function useDefaultAvatar(
  profile: Loaded<typeof OnboardingProfile>,
  size: number = 92,
) {
  return useMemo(() => {
    if (profile.avatar) {
      return profile.avatar;
    }

    if (profile.onboarding) {
      const borderRadius = size === 92 ? 16 : 48;
      return generateDefaultAvatar(profile.onboarding.nickname, borderRadius);
    }

    return null;
  }, [profile.avatar, profile.onboarding, size]);
}
