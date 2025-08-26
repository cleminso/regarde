import { Loaded } from 'jazz-tools';
import { useMemo } from 'react';

import { type JazzAppProfile } from '../schema';
import { generateDefaultAvatar } from '../utils/utils';

export function useDefaultAvatar(
  profile: Loaded<typeof JazzAppProfile>,
  size: number = 92,
) {
  return useMemo(() => {
    if (typeof profile.avatarImage === 'string') {
      return profile.avatarImage;
    }

    if (profile.avatarImage?.original) {
      try {
        const blob = profile.avatarImage.original.toBlob();
        if (blob) {
          return URL.createObjectURL(blob);
        }
      } catch (error) {
        console.warn('Error creating URL from avatar image:', error);
      }
    }

    // Fall back to generated avatar
    if (profile.userHandle) {
      const borderRadius = size === 92 ? 16 : 48;
      return generateDefaultAvatar(profile.userHandle.nickname, borderRadius);
    }

    return null;
  }, [profile.avatarImage, profile.userHandle, size]);
}
