import { useCallback, useState } from 'react';

import { logger } from '#/lib/utils/logger';
import { TriggerSyncIndicator } from './types';
import { RegardeProfile } from '../schema';
import { Loaded } from 'jazz-tools';

export function useSyncState() {
  const [syncState, setSyncState] = useState<'saved' | 'syncing' | 'error'>(
    'saved',
  );

  const triggerSyncIndicator: TriggerSyncIndicator = useCallback(
    async (regardeProfile?: Loaded<typeof RegardeProfile>) => {
      if (!regardeProfile?.$isLoaded) {
        // No profile to sync, just show brief syncing state
        setSyncState('syncing');
        setTimeout(() => setSyncState('saved'), 300);
        return;
      }

      setSyncState('syncing');

      try {
        // Use Jazz's waitForSync with appropriate timeout
          await regardeProfile.$jazz.waitForSync({ timeout: 5000 });
        setSyncState('saved');
      } catch (error) {
        logger.error('Profile sync failed:', error);
        setSyncState('error');
        // Auto-recover from error state after 3 seconds
        setTimeout(() => setSyncState('saved'), 3000);
      }
    },
    [],
  );

  return {
    syncState,
    triggerSyncIndicator,
  };
}
