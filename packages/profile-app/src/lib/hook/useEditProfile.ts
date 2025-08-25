import { useMyJazz } from '../account/useMyJazz';
import { useSyncState } from './useSyncState';

export function useEditProfile() {
  const { account, jazzAppProfile, isAuthenticated } = useMyJazz();
  const { syncState, triggerSyncIndicator } = useSyncState();

  const isLoading = account === undefined;
  const accountId = account?.id || null;

  // Only trigger sync if we have a valid profile
  const handleSync = async () => {
    if (jazzAppProfile && isAuthenticated) {
      await triggerSyncIndicator(jazzAppProfile);
    }
  };

  return {
    profile: jazzAppProfile,
    accountId,
    isLoading,
    syncState,
    triggerSyncIndicator: handleSync,
  };
}
