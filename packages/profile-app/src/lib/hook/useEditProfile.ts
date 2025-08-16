import { useMyJazz } from '../account/useMyJazz';
import { useSyncState } from './useSyncState';

export function useEditProfile() {
  const { account, jazzAppProfile } = useMyJazz();

  const { syncState, triggerSyncIndicator } = useSyncState();

  const isLoading = account === undefined;
  const accountId = account?.id || null;

  return {
    profile: jazzAppProfile,
    accountId,
    isLoading,
    syncState,
    triggerSyncIndicator,
  };
}
