import { useState } from 'react';

export function useSyncState() {
  const [syncState, setSyncState] = useState<'saved' | 'syncing' | 'error'>('saved');
  
  const triggerSyncIndicator = () => {
    setSyncState('syncing');
    
    const timeout = setTimeout(() => {
      setSyncState('saved');
    }, 1500);
    
    return () => {
      clearTimeout(timeout);
    };
  };

  return { syncState, triggerSyncIndicator };
}
