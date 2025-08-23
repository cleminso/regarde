import { Loaded } from 'jazz-tools';
import { useMemo } from 'react';

import { type JazzAppProfile } from '../schema';
import { generateDefaultAvatar } from '../utils/utils';

export function useDefaultAvatar(
  profile: Loaded<typeof JazzAppProfile>,
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
