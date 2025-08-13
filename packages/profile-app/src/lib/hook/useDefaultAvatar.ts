import { useMemo } from 'react';

import { type CleanLoadedJazzAppProfile } from '../schema';
import { generateDefaultAvatar } from '../utils';

export function useDefaultAvatar(
  profile: CleanLoadedJazzAppProfile,
  size: number = 92,
) {
  return useMemo(() => {
    if (profile.avatar) {
      return profile.avatar;
    }

    if (profile.userHandle) {
      const borderRadius = size === 92 ? 16 : 48;
      return generateDefaultAvatar(profile.userHandle.nickname, borderRadius);
    }

    return null;
  }, [profile.avatar, profile.userHandle, size]);
}
