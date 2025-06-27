import { useAccount } from 'jazz-tools/react';

import { OnboardingAccount } from '../schema';
import { useSyncState } from './useSyncState';

export function useEditProfile() {
  const { me } = useAccount(OnboardingAccount, {
    resolve: { profile: { socialLinks: true } },
  });

  const { syncState, triggerSyncIndicator } = useSyncState();

  const profile = me?.profile;
  const accountId = me?.id;

  const isLoading = !me || !profile;

  return {
    profile,
    accountId,
    isLoading,
    syncState,
    triggerSyncIndicator,
  };
}
