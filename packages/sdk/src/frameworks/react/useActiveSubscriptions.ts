import { useCoState } from "jazz-tools/react";
import { useMemo } from "react";

import { RegardeApp } from "#core/schemas/regardeUserApp";
import type { TRegardeApp } from "#core/schemas/regardeUserApp";

export interface UseActiveSubscriptionsResult {
  /** Array of loaded Subscription CoMaps (current state, not events) */
  subscriptions: never[];
  /** True while initial data is loading */
  isLoading: boolean;
}

/**
 * Subscribe to current subscription state for an App.
 *
 * NOTE: Currently returns empty array as the App schema doesn't include
 * the subscription status map. This will be fixed when we implement
 * proper subscription state tracking at the App level.
 *
 * @param _appId - The Jazz CoValue ID of the App (unused currently)
 * @returns Object containing subscriptions array and loading state
 *
 * @example
 * ```tsx
 * function ActiveSubscriptions({ appId }: { appId: string }) {
 *   const { subscriptions, isLoading } = useActiveSubscriptions(appId);
 *   if (isLoading) return <div>Loading...</div>;
 *   return (
 *     <div>
 *       {subscriptions.map(sub => (
 *         <div key={sub.$jazz.id}>
 *           Status: {sub.status}
 *           Period: {sub.currentPeriodStart} - {sub.currentPeriodEnd}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useActiveSubscriptions(
  _appId: string,
): UseActiveSubscriptionsResult {
  // Load the App CoValue with all nested records
  const app: TRegardeApp | null = useCoState(RegardeApp, _appId, {
    resolve: {
      payments: { all: true, byUser: true },
      subscriptions: { all: true, byUser: true },
      licenses: { all: true, byUser: true },
    },
  });

  // Note: App.subscriptions doesn't have a status field
  // The status field is only in RegardeSDK.mySubscriptions.status
  // For now, we return empty. In the future, we may need to:
  // 1. Load the user's RegardeSDK
  // 2. Access mySubscriptions.status
  // 3. Filter by appId
  // 4. Load the Subscription CoMaps

  const isLoading = useMemo((): boolean => {
    if (app === null) return true;
    if (app.$isLoaded !== true) return true;
    return false;
  }, [app]);

  return {
    subscriptions: [],
    isLoading,
  };
}
