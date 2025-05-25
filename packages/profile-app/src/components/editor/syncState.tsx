import { Badge } from '../ui/badge';

type SyncStateBadgeProps = {
  syncState: 'saved' | 'syncing';
};

export function SyncStateBadge({ syncState }: SyncStateBadgeProps) {
  return (
    <Badge
      className={
        syncState === 'saved'
          ? 'text-xs bg-green-100 text-green-700'
          : 'text-xs bg-orange-100 text-orange-700'
      }
    >
      {syncState === 'saved' ? 'Saved' : 'Syncing'}
    </Badge>
  );
}
