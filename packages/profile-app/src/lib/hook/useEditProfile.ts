import { useAccount } from 'jazz-tools/react';

import { OnboardingAccount } from '../schema';
import { useSyncState } from './useSyncState';

export function useEditProfile() {
  const { me } = useAccount(OnboardingAccount, {
    resolve: {
      profile: {
        socialLinks: true,
        projects: true,
        workExp: true,
        writing: true,
        education: true,
        certification: true,
        speaking: true,
        award: true,
        volunteering: true,
        sideProject: true,
        registrationKey: true,
        nowPage: true,
      },
    },
  });

  const { syncState, triggerSyncIndicator } = useSyncState();

  const isLoading = me === undefined;
  const profile = me?.profile || null;
  const accountId = me?.id || null;

  return {
    profile,
    accountId,
    isLoading,
    syncState,
    triggerSyncIndicator,
  };
}
