import { useEffect, useRef, useState } from 'react';

export function useSyncState() {
  const [syncState, setSyncState] = useState<'saved' | 'syncing'>('saved');
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSyncIndicator = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    setSyncState('syncing');
    timeoutIdRef.current = setTimeout(() => {
      setSyncState('saved');
      timeoutIdRef.current = null;
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return { syncState, triggerSyncIndicator };
}
