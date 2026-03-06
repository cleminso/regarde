"use client";

import type { TWebhookEvent } from "@regarde-dev/core";

import { PayloadViewer } from "./payloadViewer";

interface DeliveryDetailProps {
  delivery?: TWebhookEvent;
}

const MOCK_DELIVERY = {
  providerEventId: "PO_a35fe539-bc93-4025-8923-cee808045aad",
  regardeEventId: "co_z4XWyijwkQwhD74Vp4GnVB8DuMH",
  webhookName: "Monthly Subscription",
  isRetry: false,
  retryCount: 0,
  payload: {
    type: "order.updated",
    timestamp: "2026-02-24T15:31:06.676604Z",
    data: {
      id: "a35fe539-bc93-4025-8923-cee808045aad",
      status: "paid",
      total_amount: 9919,
      currency: "usd",
      customer: {
        email: "clem2inso@gmail.com",
        name: "clem",
      },
    },
  },
  headers: {
    "Content-Type": "application/json",
    "X-Webhook-Signature": "sha256=abc123...",
  },
  response: {
    status: 200,
    body: '{ "success": true }',
  },
};

export function DeliveryDetail({
  delivery,
}: DeliveryDetailProps): React.ReactElement {
  const displayData = delivery?.providerEventId
    ? {
        providerEventId: delivery.providerEventId,
        regardeEventId: delivery.$jazz?.id || MOCK_DELIVERY.regardeEventId,
        webhookName: delivery.webhookName || MOCK_DELIVERY.webhookName,
        isRetry: delivery.isRetry ?? MOCK_DELIVERY.isRetry,
        retryCount: delivery.retryCount ?? MOCK_DELIVERY.retryCount,
        payload: delivery.payload || MOCK_DELIVERY.payload,
        headers: delivery.headers || MOCK_DELIVERY.headers,
        response: delivery.responseBody
          ? { body: delivery.responseBody }
          : MOCK_DELIVERY.response,
      }
    : MOCK_DELIVERY;

  return (
    <div className="flex h-full flex-col p-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center">
          <p className="font-mono text-sm text-muted-foreground">
            <span>EventID: </span>
            <span className="text-foreground">
              {displayData.providerEventId}
            </span>
          </p>
        </div>
        <div className="flex items-center">
          <p className="font-mono text-sm text-muted-foreground">
            <span>RegardeEventId: </span>
            <span className="text-[#7d82e8]">{displayData.regardeEventId}</span>
          </p>
        </div>
        <div className="flex items-center">
          <p className="font-mono text-sm text-muted-foreground">
            <span>WebhookName: </span>
            <span className="text-foreground">{displayData.webhookName}</span>
          </p>
        </div>
        <div className="flex items-center">
          <p className="font-mono text-sm text-muted-foreground">
            <span>IsRetry: </span>
            <span className="text-foreground">
              {displayData.isRetry === true ? "true" : "false"}
            </span>
          </p>
        </div>
        <div className="flex items-center">
          <p className="font-mono text-sm text-muted-foreground">
            <span>RetryCount: </span>
            <span className="text-foreground">{displayData.retryCount}</span>
          </p>
        </div>
      </div>

      <div className="h-5 w-full" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <PayloadViewer
          payload={displayData.payload}
          headers={displayData.headers}
          response={displayData.response}
        />
      </div>
    </div>
  );
}
