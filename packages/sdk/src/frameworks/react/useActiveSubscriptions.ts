import { useAccount, useCoStates } from "jazz-tools/react";
import { useMemo } from "react";

import { Subscription } from "#core/schemas/subscriptionEvent";
import type { TSubscription, TSubscriptionStatus } from "#core/schemas/subscriptionEvent";
import { RegardeAccount } from "#schemas/regardeAccount";

export interface UseActiveSubscriptionsOptions {
  /** Filter by subscription status (default: all non-terminal statuses) */
  statuses?: TSubscriptionStatus[];
  /** Include canceled subscriptions that are still active until period end */
  includeCanceling?: boolean;
}

export interface UseActiveSubscriptionsResult {
  /** Array of loaded Subscription CoMaps (current state) */
  subscriptions: TSubscription[];
  /** True while initial data is loading */
  isLoading: boolean;
  /** Number of subscriptions found before filtering */
  totalCount: number;
}

const DEFAULT_ACTIVE_STATUSES: TSubscriptionStatus[] = ["trialing", "active", "past_due"];

/**
 * Subscribe to current subscription state for the current user and a specific App.
 *
 * This hook loads the user's active subscriptions from their RegardeSDK.mySubscriptions
 * and filters for a specific app. It returns Subscription CoMaps representing the
 * current state (not event history).
 *
 * @param appId - The Jazz CoValue ID of the App to filter subscriptions by
 * @param options - Optional filtering (statuses, includeCanceling)
 * @returns Object containing subscriptions array, loading state, and total count
 *
 * @example
 * ```tsx
 * function ActiveSubscriptions({ appId }: { appId: string }) {
 *   const { subscriptions, isLoading } = useActiveSubscriptions(appId, {
 *     statuses: ["active", "trialing"]
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {subscriptions.map(sub => (
 *         <div key={sub.$jazz.id}>
 *           Status: {sub.status}
 *           Period: {new Date(sub.currentPeriodStart).toLocaleDateString()} -
 *                   {new Date(sub.currentPeriodEnd).toLocaleDateString()}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useActiveSubscriptions(
  appId: string,
  options?: UseActiveSubscriptionsOptions,
): UseActiveSubscriptionsResult {
  // Load the current user's account with RegardeSDK and subscriptions
  const account = useAccount(RegardeAccount, {
    resolve: {
      root: {
        "regarde-sdk": {
          mySubscriptions: {
            all: true,
            byApp: true,
            status: true,
          },
        },
      },
    },
  });

  // Extract subscription IDs for the given app
  const subscriptionIds = useMemo((): string[] => {
    if (account === null || account === undefined) {
      return [];
    }

    if (account.$isLoaded === false) {
      return [];
    }

    const root = account.root;
    const isRootLoaded = root !== null && root !== undefined && root.$isLoaded === true;
    if (isRootLoaded === false) {
      return [];
    }

    const regardeSdk = root["regarde-sdk"];
    const isRegardeSdkLoaded =
      regardeSdk !== null && regardeSdk !== undefined && regardeSdk.$isLoaded === true;
    if (isRegardeSdkLoaded === false) {
      return [];
    }

    const mySubscriptions = regardeSdk.mySubscriptions;
    const isMySubscriptionsLoaded =
      mySubscriptions !== null &&
      mySubscriptions !== undefined &&
      mySubscriptions.$isLoaded === true;
    if (isMySubscriptionsLoaded === false) {
      return [];
    }

    // Get subscriptions for this specific app from byApp record
    const byApp = mySubscriptions.byApp;
    const isByAppLoaded = byApp !== null && byApp !== undefined && byApp.$isLoaded === true;
    if (isByAppLoaded === false) {
      return [];
    }

    const appSubscriptions = byApp[appId];
    if (
      appSubscriptions === null ||
      appSubscriptions === undefined ||
      appSubscriptions.$isLoaded === false
    ) {
      return [];
    }

    // Extract subscription IDs (values are Subscription CoMap IDs)
    return Object.values(appSubscriptions).filter(
      (id): id is string => id !== null && id !== undefined && typeof id === "string",
    );
  }, [account, appId]);

  // Load all Subscription CoMaps by their IDs
  const allSubscriptions = useCoStates(Subscription, subscriptionIds);

  // Filter subscriptions by status
  const subscriptions = useMemo((): TSubscription[] => {
    const loadedSubscriptions = allSubscriptions.filter(
      (sub): sub is TSubscription => sub !== null && sub !== undefined && sub.$isLoaded === true,
    );

    const statusesToInclude = options?.statuses ?? DEFAULT_ACTIVE_STATUSES;
    const includeCanceling = options?.includeCanceling ?? false;

    return loadedSubscriptions.filter((sub) => {
      // Check if status is in the allowed list
      const statusMatch = statusesToInclude.includes(sub.status);

      // If including canceling subscriptions, also check cancelAtPeriodEnd
      if (includeCanceling && sub.status === "canceled" && sub.cancelAtPeriodEnd === true) {
        return true;
      }

      return statusMatch;
    });
  }, [allSubscriptions, options?.statuses, options?.includeCanceling]);

  // Determine loading state
  const isLoading = useMemo((): boolean => {
    if (account === null || account === undefined) return true;
    if (account.$isLoaded === false) return true;

    const root = account.root;
    const isRootLoaded = root !== null && root !== undefined && root.$isLoaded === true;
    if (isRootLoaded === false) {
      return true;
    }

    const regardeSdk = root["regarde-sdk"];
    const isRegardeSdkLoaded =
      regardeSdk !== null && regardeSdk !== undefined && regardeSdk.$isLoaded === true;
    if (isRegardeSdkLoaded === false) {
      return true;
    }

    const mySubscriptions = regardeSdk.mySubscriptions;
    const isMySubscriptionsLoaded =
      mySubscriptions !== null &&
      mySubscriptions !== undefined &&
      mySubscriptions.$isLoaded === true;
    if (isMySubscriptionsLoaded === false) {
      return true;
    }

    // Check if all Subscription CoMaps are loaded
    return allSubscriptions.some(
      (sub) => sub === null || sub === undefined || sub.$isLoaded === false,
    );
  }, [account, allSubscriptions]);

  return {
    subscriptions,
    isLoading,
    totalCount: subscriptionIds.length,
  };
}
