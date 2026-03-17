import { useCoState, useCoStates } from "jazz-tools/react";
import { useMemo } from "react";

import { PaymentEvent } from "#core/schemas/paymentEvent";
import type { TPaymentEvent, TMode } from "#core/schemas/paymentEvent";
import { RegardeApp } from "#core/schemas/regardeUserApp";
import type { TRegardeApp } from "#core/schemas/regardeUserApp";

export interface UsePaymentEventsOptions {
  /** Filter by test/production mode (default: "all") */
  mode?: TMode | "all";
}

export interface UsePaymentEventsResult {
  /** Array of loaded PaymentEvent CoMaps */
  events: TPaymentEvent[];
  /** True while initial data is loading */
  isLoading: boolean;
}

/**
 * Subscribe to all PaymentEvents for an App with optional mode filtering.
 *
 * This hook loads the App's payment event index and resolves all PaymentEvent
 * CoMaps. It automatically updates when new webhooks create PaymentEvents.
 *
 * DESIGN NOTE: Returns filtered array (loaded items only) instead of MaybeLoaded<T>[]
 * Rationale: Individual item loading states are rarely needed for lists. Users want
 * "7 payments" not "7 of 10 loaded". See docs/research/maybeLoaded-pattern-jazz.md
 *
 * @param appId - The Jazz CoValue ID of the App
 * @param options - Optional filtering (mode)
 * @returns Object containing events array and loading state
 *
 * @example
 * ```tsx
 * function PaymentsTable({ appId }: { appId: string }) {
 *   const { events, isLoading } = usePaymentEvents(appId, { mode: "production" });
 *   if (isLoading) return <div>Loading...</div>;
 *   return <Table data={events} />;
 * }
 * ```
 */
export function usePaymentEvents(
  appId: string,
  options?: UsePaymentEventsOptions,
): UsePaymentEventsResult {
  // Load the App CoValue with all nested records
  const app: TRegardeApp | null = useCoState(RegardeApp, appId, {
    resolve: {
      payments: { all: true, byUser: true },
      subscriptions: { all: true, byUser: true },
      licenses: { all: true, byUser: true },
    },
  });

  // Extract event IDs from the payments record
  const eventIds = useMemo((): string[] => {
    if (app === null || app.$isLoaded !== true) {
      return [];
    }

    const paymentsRecord = app.payments;
    if (paymentsRecord === null || paymentsRecord.$isLoaded === false) {
      return [];
    }

    const allPayments = paymentsRecord.all;
    if (allPayments === null || allPayments.$isLoaded === false) {
      return [];
    }

    // Get all event IDs from the record
    return Object.values(allPayments).filter(
      (id): id is string => id !== null && id !== undefined && typeof id === "string",
    );
  }, [app]);

  // Load all PaymentEvent CoMaps by their IDs
  const allEvents = useCoStates(PaymentEvent, eventIds);

  // Filter events by mode
  const events = useMemo((): TPaymentEvent[] => {
    const loadedEvents = allEvents.filter(
      (event): event is TPaymentEvent =>
        event !== null && event !== undefined && event.$isLoaded === true,
    );

    const modeFilter = options?.mode;
    if (modeFilter !== null && modeFilter !== undefined && modeFilter !== "all") {
      return loadedEvents.filter((event) => event.mode === modeFilter);
    }

    return loadedEvents;
  }, [allEvents, options?.mode]);

  // Determine loading state
  const isLoading = useMemo((): boolean => {
    if (app === null) return true;
    if (app.$isLoaded !== true) return true;

    const paymentsRecord = app.payments;
    if (paymentsRecord === null || paymentsRecord.$isLoaded === false) {
      return true;
    }

    const allPayments = paymentsRecord.all;
    if (allPayments === null || allPayments.$isLoaded === false) {
      return true;
    }

    // Check if all PaymentEvents are loaded
    return allEvents.some(
      (event) => event === null || event === undefined || event.$isLoaded === false,
    );
  }, [app, allEvents]);

  return {
    events,
    isLoading,
  };
}
