import { useMyJazz } from '../account/useMyJazz';
import { useSyncState } from './useSyncState';

export function useEditProfile() {
  const { account, jazzAppProfile } = useMyJazz();
  const { syncState, triggerSyncIndicator } = useSyncState();

  const isLoading = account === undefined;
  const accountId = account?.id || null;

  // Create a wrapper that passes the jazzAppProfile
  const handleSync = async () => await triggerSyncIndicator(jazzAppProfile);

  return {
    profile: jazzAppProfile,
    accountId,
    isLoading,
    syncState,
    triggerSyncIndicator: handleSync,
  };
}
