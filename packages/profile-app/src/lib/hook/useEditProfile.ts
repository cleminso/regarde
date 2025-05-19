import { useAccount } from 'jazz-react';
import { useEffect, useRef, useState } from 'react';

import { OnboardingProfile, SocialLinks } from '../schema';

export function useEditProfile() {
  const { me } = useAccount({
    resolve: { profile: { socialLinks: true } },
  }) as { me?: { profile: OnboardingProfile & { socialLinks?: SocialLinks } } };

  const [syncState, setSyncState] = useState<'saved' | 'syncing'>('saved');
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSyncIndicator = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    setSyncState('syncing');
    timeoutIdRef.current = setTimeout(() => {
      setSyncState('saved');
      timeoutIdRef.current = null;
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const profile = me?.profile;
  const isLoading = !me || !profile;

  return {
    profile,
    isLoading,
    syncState,
    triggerSyncIndicator,
  };
}
