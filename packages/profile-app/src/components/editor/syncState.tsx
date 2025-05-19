import { Badge } from '../ui/badge';

type SyncStateBadgeProps = {
  syncState: 'saved' | 'syncing';
};

export function SyncStateBadge({ syncState }: SyncStateBadgeProps) {
  return (
    <Badge
      className={
        syncState === 'saved'
          ? 'bg-green-100 text-green-700'
          : 'bg-orange-100 text-orange-700'
      }
    >
      {syncState === 'saved' ? 'Saved' : 'Syncing'}
    </Badge>
  );
}
