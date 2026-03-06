import { useMemo, useState } from "react";

import type { TWebhookEvent } from "@regarde-dev/core";
import { useWebhookEvents } from "@regarde-dev/core/react";

import type { DeliveryFilters } from "../types";

export function useWebhookDeliveries(
  appId: string,
): {
  deliveries: TWebhookEvent[];
  isLoading: boolean;
  filters: DeliveryFilters;
  setFilters: (filters: DeliveryFilters) => void;
  filteredDeliveries: TWebhookEvent[];
} {
  const { events, isLoading } = useWebhookEvents(appId);
  const [filters, setFilters] = useState<DeliveryFilters>({
    status: "all",
    httpResponse: "all",
    eventType: "all",
    environment: "all",
  });

  const filteredDeliveries = useMemo(() => {
    return events.filter((delivery) => {
      if (filters.status !== "all") {
        const deliveryStatus =
          delivery.error !== undefined && delivery.error !== null
            ? "error"
            : delivery.isRetry === true
              ? "retry"
              : "success";
        if (deliveryStatus !== filters.status) return false;
      }

      if (filters.httpResponse !== "all") {
        const responseCode = delivery.httpStatusCode?.toString() ?? "";
        if (responseCode !== filters.httpResponse) return false;
      }

      if (filters.eventType !== "all") {
        const eventType = delivery.parsedEventType ?? "";
        if (eventType !== filters.eventType) return false;
      }

      return true;
    });
  }, [events, filters]);

  return {
    deliveries: events,
    isLoading,
    filters,
    setFilters,
    filteredDeliveries,
  };
}
