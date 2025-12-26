import { useMyRegardeAccount } from '../account/useMyRegardeAccount';
import { useSyncState } from './useSyncState';

export function useEditProfile() {
  const {
    account,
    regardeProfile,
    regardeAuth,
    userNickname,
    isAuthenticated,
  } = useMyRegardeAccount();
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
    regardeAuth,
    userNickname,
    isLoading,
    syncState,
    triggerSyncIndicator: handleSync,
  };
}
