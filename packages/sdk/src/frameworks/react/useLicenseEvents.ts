import { useCoState, useCoStates } from "jazz-tools/react";
import { useMemo } from "react";

import { LicenseEvent } from "#core/schemas/licenseEvent";
import type { TLicenseEvent } from "#core/schemas/licenseEvent";
import type { TMode } from "#core/schemas/paymentEvent";
import { RegardeApp } from "#core/schemas/regardeUserApp";
import type { TRegardeApp } from "#core/schemas/regardeUserApp";

export interface UseLicenseEventsOptions {
  /** Filter by test/production mode (default: "all") */
  mode?: TMode | "all";
  /** Filter by specific license provider ID */
  providerLicenseId?: string;
}

export interface UseLicenseEventsResult {
  /** Array of loaded LicenseEvent CoMaps */
  events: TLicenseEvent[];
  /** True while initial data is loading */
  isLoading: boolean;
}

/**
 * Subscribe to LicenseEvent history for an App.
 *
 * This hook loads the App's license event index and resolves all LicenseEvent
 * CoMaps. It can filter by mode or specific license ID.
 *
 * DESIGN NOTE: Returns filtered array (loaded items only) instead of MaybeLoaded<T>[]
 * Rationale: Individual item loading states are rarely needed for lists. Users want
 * "8 licenses" not "8 of 10 loaded". See docs/research/maybeLoaded-pattern-jazz.md
 *
 * @param appId - The Jazz CoValue ID of the App
 * @param options - Optional filtering (mode, providerLicenseId)
 * @returns Object containing events array and loading state
 *
 * @example
 * ```tsx
 * function LicensesTable({ appId }: { appId: string }) {
 *   const { events, isLoading } = useLicenseEvents(appId, { mode: "production" });
 *   if (isLoading) return <div>Loading...</div>;
 *   return <Table data={events} />;
 * }
 * ```
 */
export function useLicenseEvents(
  appId: string,
  options?: UseLicenseEventsOptions,
): UseLicenseEventsResult {
  // Load the App CoValue with all nested records
  const app: TRegardeApp | null = useCoState(RegardeApp, appId, {
    resolve: {
      payments: { all: true, byUser: true },
      subscriptions: { all: true, byUser: true },
      licenses: { all: true, byUser: true },
    },
  });

  // Extract event IDs from the licenses record
  const eventIds = useMemo((): string[] => {
    if (app === null || app.$isLoaded !== true) {
      return [];
    }

    const licensesRecord = app.licenses;
    if (licensesRecord === null || licensesRecord.$isLoaded === false) {
      return [];
    }

    const allLicenses = licensesRecord.all;
    if (allLicenses === null || allLicenses.$isLoaded === false) {
      return [];
    }

    // Get all event IDs from the record
    return Object.values(allLicenses).filter(
      (id): id is string => id !== null && id !== undefined && typeof id === "string",
    );
  }, [app]);

  // Load all LicenseEvent CoMaps by their IDs
  const allEvents = useCoStates(LicenseEvent, eventIds);

  // Filter events
  const events = useMemo((): TLicenseEvent[] => {
    let loadedEvents = allEvents.filter(
      (event): event is TLicenseEvent =>
        event !== null && event !== undefined && event.$isLoaded === true,
    );

    // Apply mode filter
    const modeFilter = options?.mode;
    if (modeFilter !== null && modeFilter !== undefined && modeFilter !== "all") {
      loadedEvents = loadedEvents.filter((event) => event.mode === modeFilter);
    }

    // Apply provider license ID filter
    const providerLicenseIdFilter = options?.providerLicenseId;
    if (
      providerLicenseIdFilter !== null &&
      providerLicenseIdFilter !== undefined &&
      providerLicenseIdFilter !== ""
    ) {
      // Check all possible license ID fields
      loadedEvents = loadedEvents.filter((event) => {
        const licenseKeyMatch = event.licenseKey === providerLicenseIdFilter;
        const entitlementMatch = event.entitlementId === providerLicenseIdFilter;
        const benefitMatch = event.benefitId === providerLicenseIdFilter;
        return licenseKeyMatch || entitlementMatch || benefitMatch;
      });
    }

    return loadedEvents;
  }, [allEvents, options?.mode, options?.providerLicenseId]);

  // Determine loading state
  const isLoading = useMemo((): boolean => {
    if (app === null) return true;
    if (app.$isLoaded !== true) return true;

    const licensesRecord = app.licenses;
    if (licensesRecord === null || licensesRecord.$isLoaded === false) {
      return true;
    }

    const allLicenses = licensesRecord.all;
    if (allLicenses === null || allLicenses.$isLoaded === false) {
      return true;
    }

    // Check if all LicenseEvents are loaded
    return allEvents.some(
      (event) => event === null || event === undefined || event.$isLoaded === false,
    );
  }, [app, allEvents]);

  return {
    events,
    isLoading,
  };
}
