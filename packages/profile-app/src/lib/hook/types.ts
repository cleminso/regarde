import { type CleanLoadedJazzAppProfile } from '../schema';

export type SyncableObject = {
  waitForSync?: (options: { timeout: number }) => Promise<void>;
};

export type TriggerSyncIndicator = (profileObject?: SyncableObject) => void;

export type BaseHookProps = {
  profile: CleanLoadedJazzAppProfile;
  triggerSyncIndicator: TriggerSyncIndicator;
};