import { type Loaded } from 'jazz-tools';
import { type JazzAppProfile } from '@onboarding.jazz/shared-schemas';

export type SyncableObject = {
  waitForSync?: (options: { timeout: number }) => Promise<any>;
};

export type TriggerSyncIndicator = (jazzAppProfile?: Loaded<typeof JazzAppProfile>) => Promise<void>;

export type BaseHookProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
};
