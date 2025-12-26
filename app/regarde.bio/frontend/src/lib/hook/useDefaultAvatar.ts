import { Loaded } from 'jazz-tools';
import { useMemo } from 'react';

import { type RegardeProfile } from '../schema';
import { generateDefaultAvatar } from '../utils/utils';

export function useDefaultAvatar(
  profile: Loaded<typeof RegardeProfile>,
  nickname?: string,
  size: number = 92,
) {
  return useMemo(() => {
    if (typeof profile.avatarImage === 'string') {
      return profile.avatarImage;
    }

    if (
      profile.avatarImage &&
      profile.avatarImage.$isLoaded &&
      profile.avatarImage.original &&
      profile.avatarImage.original.$isLoaded
    ) {
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
    if (nickname) {
      const borderRadius =
        size === 92
          ? 16
          : size === 72
            ? 12
            : size === 96
              ? 16
              : Math.max(4, Math.round(size * 0.17));

      return generateDefaultAvatar(nickname, borderRadius);
    }

    return null;
  }, [profile.avatarImage, nickname, size]);
}
