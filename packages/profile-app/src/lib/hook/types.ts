import { type CleanLoadedJazzAppProfile } from '../schema';

export type SyncableObject = {
  waitForSync?: (options: { timeout: number }) => Promise<any>;
};

export type TriggerSyncIndicator = (profileObject?: any) => void;

export type BaseHookProps = {
  profile: CleanLoadedJazzAppProfile;
  triggerSyncIndicator: TriggerSyncIndicator;
};
