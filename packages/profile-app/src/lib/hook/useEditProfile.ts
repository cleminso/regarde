import { useMyJazz } from '../account/useMyJazz';
import { useSyncState } from './useSyncState';

export function useEditProfile() {
  const { account, regardeProfile, isAuthenticated } = useMyJazz();
  const { syncState, triggerSyncIndicator } = useSyncState();

  const isLoading = account === undefined;
  const accountId = account?.$jazz.id || null;

  // Only trigger sync if we have a valid profile
  const handleSync = async () => {
    if (regardeProfile && isAuthenticated) {
      await triggerSyncIndicator(regardeProfile);
    }
  };

  return {
    profile: regardeProfile,
    accountId,
    isLoading,
    syncState,
    triggerSyncIndicator: handleSync,
  };
}
