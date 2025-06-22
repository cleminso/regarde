import { Badge } from '../ui/badge.tsx';

type SyncStateBadgeProps = {
  syncState: 'saved' | 'syncing';
};

export function SyncStateBadge({ syncState }: SyncStateBadgeProps) {
  return (
    <Badge variant={syncState === 'saved' ? 'saved' : 'syncing'}>
      {syncState === 'saved' ? 'Saved' : 'Syncing'}
    </Badge>
  );
}
