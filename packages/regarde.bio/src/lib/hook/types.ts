import { type Loaded } from 'jazz-tools';
import { type RegardeProfile } from '@regarde-dev/jazz-schemas/regarde.bio';

export type SyncableObject = {
  waitForSync?: (options: { timeout: number }) => Promise<any>;
};

export type TriggerSyncIndicator = (RegardeProfile?: Loaded<typeof RegardeProfile>) => Promise<void>;

export type BaseHookProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
};
