import { useMyJazz } from '../account/useMyJazz';
import { useSyncState } from './useSyncState';

export function useEditProfile() {
  const { account: me, jazzAppProfile } = useMyJazz();

  const { syncState, triggerSyncIndicator } = useSyncState();

  const isLoading = me === undefined;
  const accountId = me?.id || null;

  return {
    profile: jazzAppProfile,
    accountId,
    isLoading,
    syncState,
    triggerSyncIndicator,
  };
}
