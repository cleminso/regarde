import { useMemo } from "react";

import type { TWebhook, TWebhookEvent } from "#core/schemas/regardeUserApp";

import { useRegardeApp } from "./useRegardeApp";

export interface UseWebhookEventsOptions {
  status?: "success" | "failure" | "all";
  limit?: number;
}

export interface WebhookDelivery extends TWebhookEvent {
  webhookId: string;
}

export interface WebhookStats {
  totalWebhooks: number;
  enabledWebhooks: number;
  totalDeliveries: number;
  failedDeliveries: number;
}

export interface UseWebhookEventsResult {
  webhooks: TWebhook[];
  deliveries: WebhookDelivery[];
  stats: WebhookStats;
  isLoading: boolean;
}

export function useWebhookEvents(
  appId: string,
  webhookId: string,
  options?: UseWebhookEventsOptions,
): UseWebhookEventsResult {
  const app = useRegardeApp(appId);

  const webhooks = useMemo((): TWebhook[] => {
    if (app === null || app.$isLoaded !== true) {
      return [];
    }

    const webhooksList = app.webhooks;
    if (webhooksList === null || webhooksList.$isLoaded !== true) {
      return [];
    }

    return webhooksList.filter(
      (webhook): webhook is TWebhook =>
        webhook !== null && webhook !== undefined && webhook.$isLoaded === true,
    );
  }, [app]);

  const deliveries = useMemo((): WebhookDelivery[] => {
    if (app === null || app.$isLoaded !== true) {
      return [];
    }

    const allEvents = app.allEvents;
    if (allEvents === null || allEvents.$isLoaded !== true) {
      return [];
    }

    const sessionFeed = allEvents.perSession[webhookId as any];
    if (sessionFeed === undefined) {
      return [];
    }

    const allEntries = sessionFeed.all;
    if (allEntries === undefined) {
      return [];
    }

    const entries: WebhookDelivery[] = [];

    for (const entry of allEntries) {
      const value = entry.value as TWebhookEvent;
      if (value === undefined) {
        continue;
      }

      const isEntryValid =
        value.providerEventId !== undefined &&
        value.parsedEventType !== undefined;

      if (isEntryValid !== true) {
        continue;
      }

      const delivery: WebhookDelivery = {
        payload: value.payload,
        headers: value.headers,
        receivedAt: value.receivedAt,
        httpStatusCode: value.httpStatusCode,
        responseBody: value.responseBody,
        providerEventId: value.providerEventId,
        parsedEventType: value.parsedEventType,
        isRetry: value.isRetry ?? false,
        retryCount: value.retryCount ?? 0,
        error: value.error,
        regardeEventId: value.regardeEventId,
        webhookId,
      };
      entries.push(delivery);
    }

    const statusFilter = options?.status;
    let filteredEntries = entries;

    if (statusFilter !== undefined && statusFilter !== "all") {
      filteredEntries = entries.filter((entry) => {
        const statusCode = parseInt(entry.httpStatusCode, 10);
        const isSuccess = statusCode >= 200 && statusCode < 300;

        if (statusFilter === "success") {
          return isSuccess === true;
        }

        if (statusFilter === "failure") {
          return isSuccess === false;
        }

        return true;
      });
    }

    const limit = options?.limit;
    const isLimitValid =
      limit !== undefined &&
      limit !== null &&
      limit > 0 &&
      Number.isFinite(limit);

    if (isLimitValid === true) {
      return filteredEntries.slice(0, limit);
    }

    return filteredEntries;
  }, [app, webhookId, options?.status, options?.limit]);

  const stats = useMemo((): WebhookStats => {
    const totalWebhooks = webhooks.length;

    const enabledWebhooks = webhooks.filter((webhook) => {
      const isEnabled = webhook.isEnabled;
      return isEnabled === true;
    }).length;

    const totalDeliveries = deliveries.length;

    const failedDeliveries = deliveries.filter((delivery) => {
      const statusCode = parseInt(delivery.httpStatusCode, 10);
      const isSuccess = statusCode >= 200 && statusCode < 300;
      return isSuccess === false;
    }).length;

    return {
      totalWebhooks,
      enabledWebhooks,
      totalDeliveries,
      failedDeliveries,
    };
  }, [webhooks, deliveries]);

  const isLoading = useMemo((): boolean => {
    if (app === null) {
      return true;
    }

    if (app.$isLoaded !== true) {
      return true;
    }

    const webhooksList = app.webhooks;
    if (webhooksList === null || webhooksList.$isLoaded !== true) {
      return true;
    }

    const allEvents = app.allEvents;
    if (allEvents === null || allEvents.$isLoaded !== true) {
      return true;
    }

    return false;
  }, [app]);

  return {
    webhooks,
    deliveries,
    stats,
    isLoading,
  };
}
