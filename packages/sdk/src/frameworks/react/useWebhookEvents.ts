import { useMemo } from "react";

import type { TWebhook, TWebhookEvent } from "#core/schemas/regardeUserApp";

import { useRegardeApp } from "./useRegardeApp";

const isLoadedWebhook = (webhook: unknown): webhook is TWebhook => {
  return (
    webhook !== null &&
    webhook !== undefined &&
    typeof webhook === "object" &&
    "$isLoaded" in webhook &&
    webhook.$isLoaded === true
  );
};

export interface UseWebhookEventsOptions {
  status?: "success" | "failure" | "all";
  limit?: number;
}

export type WebhookDelivery = TWebhookEvent;

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

    return webhooksList.filter(isLoadedWebhook);
  }, [app]);

  // Find the specific webhook and read from its events feed
  const targetWebhook = useMemo(() => {
    return webhooks.find((w) => w.$jazz.id === webhookId);
  }, [webhooks, webhookId]);

  const deliveries = useMemo((): WebhookDelivery[] => {
    if (targetWebhook === undefined) {
      return [];
    }

    // Primary: read from webhook.events feed
    const eventsFeed = targetWebhook.events;
    if (eventsFeed === null || eventsFeed.$isLoaded !== true) {
      return [];
    }

    const entries: WebhookDelivery[] = [];

    // CoFeed is iterable - cast to any due to TypeScript type limitations
    // oxlint-disable-next-line no-unsafe-type-assertion
    for (const entry of eventsFeed as unknown as Iterable<{ value: TWebhookEvent }>) {
      // oxlint-disable-next-line no-unsafe-type-assertion -- Jazz runtime data requires type assertion
      const value = entry.value as TWebhookEvent;
      if (value === undefined) {
        continue;
      }

      const isEntryValid =
        value.providerEventId !== undefined && value.parsedEventType !== undefined;

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
        error: value.error,
        regardeEventId: value.regardeEventId,
        webhookId: targetWebhook.$jazz.id,
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
      limit !== undefined && limit !== null && limit > 0 && Number.isFinite(limit);

    if (isLimitValid === true) {
      return filteredEntries.slice(0, limit);
    }

    return filteredEntries;
  }, [targetWebhook, options?.status, options?.limit]);

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

    // Check if target webhook's events are loaded
    if (targetWebhook !== undefined) {
      const eventsFeed = targetWebhook.events;
      if (eventsFeed === null || eventsFeed.$isLoaded !== true) {
        return true;
      }
    }

    return false;
  }, [app, targetWebhook]);

  return {
    webhooks,
    deliveries,
    stats,
    isLoading,
  };
}
