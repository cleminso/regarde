import { Loaded } from 'jazz-tools';

import { TriggerSyncIndicator } from '#/lib/hook/types';
import { RegardeProfile } from '#/lib/schema';

export type BaseEditProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onDoneEditing: () => void;
};

export type ContactEditProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onCloseEditor: () => void;
};
