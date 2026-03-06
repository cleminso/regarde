import { useMemo } from "react";

import type { TWebhookEvent } from "@regarde-dev/core";

// Mock data for UI development
const MOCK_DELIVERIES: TWebhookEvent[] = [
  {
    payload: { type: "order.paid", data: { id: "ord_123", amount: 1000 } },
    headers: { "Content-Type": "application/json" },
    receivedAt: Date.now() - 1000 * 60 * 5,
    httpStatusCode: "200",
    responseBody: "{\"received\": true}",
    providerEventId: "evt_001",
    parsedEventType: "order.paid",
    isRetry: false,
    retryCount: 0,
  },
  {
    payload: { type: "order.updated", data: { id: "ord_124", status: "paid" } },
    headers: { "Content-Type": "application/json" },
    receivedAt: Date.now() - 1000 * 60 * 30,
    httpStatusCode: "200",
    responseBody: "{\"received\": true}",
    providerEventId: "evt_002",
    parsedEventType: "order.updated",
    isRetry: false,
    retryCount: 0,
  },
  {
    payload: { type: "order.paid", data: { id: "ord_125", amount: 2500 } },
    headers: { "Content-Type": "application/json" },
    receivedAt: Date.now() - 1000 * 60 * 60 * 2,
    httpStatusCode: "500",
    responseBody: "Internal Server Error",
    providerEventId: "evt_003",
    parsedEventType: "order.paid",
    isRetry: true,
    retryCount: 1,
    error: "Failed to process payment",
  },
];

export interface UseWebhookEventsResult {
  events: TWebhookEvent[];
  isLoading: boolean;
}

export function useWebhookEvents(
  _appId: string,
): UseWebhookEventsResult {
  // Return mock data for UI development
  return useMemo(
    () => ({
      events: MOCK_DELIVERIES,
      isLoading: false,
    }),
    [],
  );
}
