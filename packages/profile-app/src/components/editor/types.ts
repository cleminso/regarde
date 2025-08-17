import { TriggerSyncIndicator } from '#/lib/hook/types';
import { CleanLoadedJazzAppProfile } from '#/lib/schema';

export type BaseEditProps = {
  profile: CleanLoadedJazzAppProfile;
  triggerSyncIndicator: TriggerSyncIndicator;
  onDoneEditing: () => void;
};

export type ContactEditProps = {
  profile: CleanLoadedJazzAppProfile;
  triggerSyncIndicator: TriggerSyncIndicator;
  onCloseEditor: () => void;
};
