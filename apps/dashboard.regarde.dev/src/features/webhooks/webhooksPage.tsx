"use client";

import { useState } from "react";

import type { TWebhookEvent } from "@regarde-dev/core";

import { MetricsSection } from "./webhookMetricCards";
import { useWebhooks } from "./hooks/useWebhooks";
import { useWebhookDeliveries } from "./hooks/useWebhookDeliveries";
import type { DeliveryFilters } from "./types";
import { DeliveryDetail } from "./deliveryDetail";
import { DeliveryFilters as FiltersComponent } from "./deliveryFilters";
import { DeliveryList } from "./deliveryList";
import { WebhookList } from "./webhookList";

interface WebhooksPageProps {
  appId: string;
}

export function WebhooksPage({ appId }: WebhooksPageProps): React.ReactElement {
  const { webhooks, isLoading: isLoadingWebhooks } = useWebhooks(null);

  const [selectedDelivery, setSelectedDelivery] = useState<
    TWebhookEvent | undefined
  >(undefined);
  const [filters, setFilters] = useState<DeliveryFilters>({
    status: "all",
    httpResponse: "all",
    eventType: "all",
    environment: "all",
  });

  const { filteredDeliveries, isLoading: isLoadingDeliveries } =
    useWebhookDeliveries(appId);

  // Only show loading for initial webhook load
  const isLoading = isLoadingWebhooks === true;

  // Calculate webhook metrics
  const activeWebhooks = webhooks.filter((w) => w.isEnabled).length;
  const totalDeliveries = filteredDeliveries.length;
  const successfulDeliveries = filteredDeliveries.filter(
    (d) =>
      d.httpStatusCode &&
      parseInt(d.httpStatusCode) >= 200 &&
      parseInt(d.httpStatusCode) < 300,
  ).length;

  const metrics = [
    { label: "Active Webhooks", value: activeWebhooks.toString() },
    { label: "Total Deliveries", value: totalDeliveries.toString() },
    {
      label: "Success Rate",
      value:
        totalDeliveries > 0
          ? `${Math.round((successfulDeliveries / totalDeliveries) * 100)}%`
          : "0%",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <MetricsSection metrics={metrics} />

      <WebhookList webhooks={webhooks} appId={appId} />

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <FiltersComponent filters={filters} onChange={setFilters} />

        <div className="flex min-h-0 flex-1 border-t">
          <div className="flex w-1/2 flex-col overflow-hidden border-r">
            {isLoadingDeliveries ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
              </div>
            ) : (
              <DeliveryList
                deliveries={filteredDeliveries}
                selectedId={selectedDelivery?.providerEventId}
                onSelect={setSelectedDelivery}
              />
            )}
          </div>

          <div className="flex w-1/2 flex-col overflow-hidden">
            <DeliveryDetail delivery={selectedDelivery} />
          </div>
        </div>
      </div>
    </div>
  );
}
