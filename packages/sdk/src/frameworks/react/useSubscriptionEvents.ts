import { useCoState, useCoStates } from "jazz-tools/react";
import { useMemo } from "react";

import type { TMode } from "#core/schemas/paymentEvent";
import { RegardeApp } from "#core/schemas/regardeUserApp";
import type { TRegardeApp } from "#core/schemas/regardeUserApp";
import { SubscriptionEvent } from "#core/schemas/subscriptionEvent";
import type { TSubscriptionEvent } from "#core/schemas/subscriptionEvent";

export interface UseSubscriptionEventsOptions {
  /** Filter by test/production mode (default: "all") */
  mode?: TMode | "all";
  /** Filter by specific subscription provider ID */
  providerSubscriptionId?: string;
}

export interface UseSubscriptionEventsResult {
  /** Array of loaded SubscriptionEvent CoMaps */
  events: TSubscriptionEvent[];
  /** True while initial data is loading */
  isLoading: boolean;
}

/**
 * Subscribe to SubscriptionEvent history for an App.
 *
 * This hook loads the App's subscription event index and resolves all
 * SubscriptionEvent CoMaps. It can filter by mode or specific subscription ID.
 *
 * DESIGN NOTE: Returns filtered array (loaded items only) instead of MaybeLoaded<T>[]
 * Rationale: Individual item loading states are rarely needed for lists. Users want
 * "12 events" not "12 of 15 loaded". See docs/research/maybeLoaded-pattern-jazz.md
 *
 * @param appId - The Jazz CoValue ID of the App
 * @param options - Optional filtering (mode, providerSubscriptionId)
 * @returns Object containing events array and loading state
 *
 * @example
 * ```tsx
 * function SubscriptionsTable({ appId }: { appId: string }) {
 *   const { events, isLoading } = useSubscriptionEvents(appId, { mode: "test" });
 *   if (isLoading) return <div>Loading...</div>;
 *   return <Table data={events} />;
 * }
 * ```
 */
export function useSubscriptionEvents(
  appId: string,
  options?: UseSubscriptionEventsOptions,
): UseSubscriptionEventsResult {
  // Load the App CoValue with the subscription index
  const app: TRegardeApp | null = useCoState(RegardeApp, appId, {
    resolve: {
      subscriptions: { all: true, byUser: true },
    },
  });

  // Extract event IDs from the subscription index
  const subscriptionEventIds = useMemo((): string[] => {
    if (app === null || app.$isLoaded !== true) {
      return [];
    }

    const subscriptionsIndex = app.subscriptions;
    if (subscriptionsIndex === null || subscriptionsIndex.$isLoaded === false) {
      return [];
    }

    const allSubscriptions = subscriptionsIndex.all;
    if (allSubscriptions === null || allSubscriptions.$isLoaded === false) {
      return [];
    }

    // Get all event IDs from the index
    return Object.values(allSubscriptions).filter(
      (id): id is string => id !== null && id !== undefined && typeof id === "string",
    );
  }, [app]);

  // Load all SubscriptionEvent CoMaps by their IDs
  const allSubscriptionEvents = useCoStates(SubscriptionEvent, subscriptionEventIds);

  // Filter events
  const subscriptionEvents = useMemo((): TSubscriptionEvent[] => {
    let loadedSubscriptionEvents = allSubscriptionEvents.filter(
      (event): event is TSubscriptionEvent =>
        event !== null && event !== undefined && event.$isLoaded === true,
    );

    // Apply mode filter
    const modeFilter = options?.mode;
    if (modeFilter !== null && modeFilter !== undefined && modeFilter !== "all") {
      loadedSubscriptionEvents = loadedSubscriptionEvents.filter((event) => event.mode === modeFilter);
    }

    // Apply provider subscription ID filter
    const providerSubIdFilter = options?.providerSubscriptionId;
    if (
      providerSubIdFilter !== null &&
      providerSubIdFilter !== undefined &&
      providerSubIdFilter !== ""
    ) {
      loadedSubscriptionEvents = loadedSubscriptionEvents.filter(
        (event) => event.providerSubscriptionId === providerSubIdFilter,
      );
    }

    return loadedSubscriptionEvents;
  }, [allSubscriptionEvents, options?.mode, options?.providerSubscriptionId]);

  // Determine loading state
  const isLoading = useMemo((): boolean => {
    if (app === null) return true;
    if (app.$isLoaded !== true) return true;

    const subscriptionsIndex = app.subscriptions;
    if (subscriptionsIndex === null || subscriptionsIndex.$isLoaded === false) {
      return true;
    }

    const allSubscriptions = subscriptionsIndex.all;
    if (allSubscriptions === null || allSubscriptions.$isLoaded === false) {
      return true;
    }

    // Check if all SubscriptionEvents are loaded
    return allSubscriptionEvents.some(
      (event) => event === null || event === undefined || event.$isLoaded === false,
    );
  }, [app, allSubscriptionEvents]);

  return {
    events: subscriptionEvents,
    isLoading,
  };
}
