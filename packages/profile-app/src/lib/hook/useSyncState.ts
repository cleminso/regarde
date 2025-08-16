import { useCallback, useState } from 'react';
import { SyncableObject, TriggerSyncIndicator } from './types';

export function useSyncState() {
  const [syncState, setSyncState] = useState<'saved' | 'syncing' | 'error'>('saved');

  const triggerSyncIndicator: TriggerSyncIndicator = useCallback(async (profileObject?: SyncableObject) => {
    setSyncState('syncing');

    try {
      if (profileObject && typeof profileObject.waitForSync === 'function') {
        await profileObject.waitForSync({ timeout: 5000 });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setSyncState('saved');
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncState('error');
      setTimeout(() => setSyncState('saved'), 3000);
    }
  }, []);

  return {
    syncState,
    triggerSyncIndicator,
  };
}
