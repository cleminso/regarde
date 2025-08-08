import { Badge } from '../ui/badge.tsx';

type SyncStateBadgeProps = {
  syncState: 'saved' | 'syncing' | 'error';
};

export function SyncStateBadge({ syncState }: SyncStateBadgeProps) {
  const variant = syncState === 'saved' ? 'saved' : 
                  syncState === 'error' ? 'destructive' : 'syncing';
  
  const text = syncState === 'saved' ? 'Saved' : 
               syncState === 'error' ? 'Sync Error' : 'Syncing';
  
  return (
    <Badge variant={variant}>
      {text}
    </Badge>
  );
}
