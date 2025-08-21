import { TriggerSyncIndicator } from '#/lib/hook/types';
import { Loaded } from 'jazz-tools';
import { JazzAppProfile } from '#/lib/schema';

export type BaseEditProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onDoneEditing: () => void;
};

export type ContactEditProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onCloseEditor: () => void;
};
