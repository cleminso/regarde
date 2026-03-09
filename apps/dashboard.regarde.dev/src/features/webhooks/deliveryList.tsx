"use client";

import type { TWebhookEvent } from "@regarde-dev/core";
import { cn } from "#/lib/utils";

interface DeliveryListProps {
  deliveries: TWebhookEvent[];
  selectedId?: string;
  onSelect: (delivery: TWebhookEvent) => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DeliveryList({
  deliveries,
  selectedId,
  onSelect,
}: DeliveryListProps): React.ReactElement {
  const getStatusBadge = (delivery: TWebhookEvent) => {
    const hasError = delivery.error !== undefined && delivery.error !== null;
    const isRetry = delivery.isRetry === true;

    if (hasError) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
          Error
        </span>
      );
    }
    if (isRetry) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
          Retry {delivery.retryCount > 0 ? `(${delivery.retryCount})` : ""}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        Success
      </span>
    );
  };

  const getHttpBadge = (delivery: TWebhookEvent) => {
    const response = parseInt(delivery.httpStatusCode ?? "200", 10);
    const isSuccess = response >= 200 && response < 300;

    return (
      <span
        className={cn(
          "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono",
          isSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
        )}
      >
        {delivery.httpStatusCode}
      </span>
    );
  };

  if (deliveries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          No deliveries found. Webhook events will appear here when received.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead className="sticky top-0 bg-muted/50">
          <tr className="border-b">
            <th className="px-4 py-2 text-left text-xs font-medium">Type</th>
            <th className="px-4 py-2 text-left text-xs font-medium">
              Response
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium">Sent At</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((delivery) => {
            const isSelected = delivery.providerEventId === selectedId;

            return (
              <tr
                key={delivery.providerEventId}
                onClick={() => onSelect(delivery)}
                className={cn(
                  "cursor-pointer border-b transition-colors hover:bg-muted/50",
                  isSelected && "bg-muted",
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(delivery)}
                    <span className="font-mono text-sm">
                      {delivery.parsedEventType}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">{getHttpBadge(delivery)}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(delivery.receivedAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
