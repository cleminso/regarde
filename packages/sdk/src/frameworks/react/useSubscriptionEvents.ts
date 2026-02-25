import { useCoState, useCoStates } from "jazz-tools/react";
import { useMemo } from "react";

import type { TMode } from "#core/schemas/paymentEvent";
import { App } from "#core/schemas/regardeUserApp";
import type { TApp } from "#core/schemas/regardeUserApp";
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
  // Load the App CoValue with all nested records
  const app: TApp | null = useCoState(App, appId, {
    resolve: {
      payments: { all: true, byUser: true },
      subscriptions: { all: true, byUser: true },
      licenses: { all: true, byUser: true },
    },
  });

  // Extract event IDs from the subscriptions record
  const eventIds = useMemo((): string[] => {
    if (app === null || app.$isLoaded !== true) {
      return [];
    }

    const subscriptionsRecord = app.subscriptions;
    if (
      subscriptionsRecord === null ||
      subscriptionsRecord.$isLoaded === false
    ) {
      return [];
    }

    const allSubscriptions = subscriptionsRecord.all;
    if (allSubscriptions === null || allSubscriptions.$isLoaded === false) {
      return [];
    }

    // Get all event IDs from the record
    return Object.values(allSubscriptions).filter(
      (id): id is string =>
        id !== null && id !== undefined && typeof id === "string",
    );
  }, [app]);

  // Load all SubscriptionEvent CoMaps by their IDs
  const allEvents = useCoStates(SubscriptionEvent, eventIds);

  // Filter events
  const events = useMemo((): TSubscriptionEvent[] => {
    let loadedEvents = allEvents.filter(
      (event): event is TSubscriptionEvent =>
        event !== null && event !== undefined && event.$isLoaded === true,
    );

    // Apply mode filter
    const modeFilter = options?.mode;
    if (
      modeFilter !== null &&
      modeFilter !== undefined &&
      modeFilter !== "all"
    ) {
      loadedEvents = loadedEvents.filter((event) => event.mode === modeFilter);
    }

    // Apply provider subscription ID filter
    const providerSubIdFilter = options?.providerSubscriptionId;
    if (
      providerSubIdFilter !== null &&
      providerSubIdFilter !== undefined &&
      providerSubIdFilter !== ""
    ) {
      loadedEvents = loadedEvents.filter(
        (event) => event.providerSubscriptionId === providerSubIdFilter,
      );
    }

    return loadedEvents;
  }, [allEvents, options?.mode, options?.providerSubscriptionId]);

  // Determine loading state
  const isLoading = useMemo((): boolean => {
    if (app === null) return true;
    if (app.$isLoaded !== true) return true;

    const subscriptionsRecord = app.subscriptions;
    if (
      subscriptionsRecord === null ||
      subscriptionsRecord.$isLoaded === false
    ) {
      return true;
    }

    const allSubscriptions = subscriptionsRecord.all;
    if (allSubscriptions === null || allSubscriptions.$isLoaded === false) {
      return true;
    }

    // Check if all SubscriptionEvents are loaded
    return allEvents.some(
      (event) => event === null || event === undefined || event.$isLoaded === false,
    );
  }, [app, allEvents]);

  return {
    events,
    isLoading,
  };
}
