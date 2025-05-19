import { useAccount } from 'jazz-react';

import { OnboardingProfile, SocialLinks } from '../schema';
import { useSyncState } from './useSyncState';

export function useEditProfile() {
  const { me } = useAccount({
    resolve: { profile: { socialLinks: true } },
  }) as { me?: { profile: OnboardingProfile & { socialLinks?: SocialLinks } } };

  const { syncState, triggerSyncIndicator } = useSyncState();

  const profile = me?.profile;
  const isLoading = !me || !profile;

  return {
    profile,
    isLoading,
    syncState,
    triggerSyncIndicator,
  };
}
