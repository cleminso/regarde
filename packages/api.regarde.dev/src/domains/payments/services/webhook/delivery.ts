import {
  TRegistryWebhookDelivery,
  TRegistryWorkerAccountRoot,
  TWebhook,
  TWebhookEvent,
} from "@regarde-dev/core";

import type {
  TBuildWebhookDeliveryInput,
  TWebhookDeliveryEntries,
  TWebhookDeliveryFeeds,
} from "./types";

export const appendWebhookEvent = async (
  feed: TWebhook["events"],
  entry: TWebhookEvent,
): Promise<void> => {
  const isFeedLoaded = feed !== null && feed.$isLoaded === true;
  if (isFeedLoaded === false) {
    return;
  }

  feed.$jazz.push(entry);
  await feed.$jazz.waitForSync();
};

export const appendRegistryWebhookDelivery = async (
  feed: TRegistryWorkerAccountRoot["webhookDeliveries"],
  entry: TRegistryWebhookDelivery,
): Promise<void> => {
  const isFeedLoaded = feed !== null && feed.$isLoaded === true;
  if (isFeedLoaded === false) {
    return;
  }

  feed.$jazz.push(entry);
  await feed.$jazz.waitForSync();
};

export const buildWebhookDeliveryEntries = ({
  context,
  providerEventId,
  parsedEventType,
  receivedAt,
  httpStatusCode,
  responseBody,
  deliveryOutcome,
  isRetry,
  retryCount,
  error,
  regardeEventId,
}: TBuildWebhookDeliveryInput): TWebhookDeliveryEntries => {
  return {
    appEvent: {
      payload: context.payload,
      headers: context.headers,
      receivedAt,
      regardeEventId,
      providerEventId,
      parsedEventType,
      error,
      httpStatusCode,
      responseBody,
      webhookId: context.webhookId,
    },
    registryDelivery: {
      appId: context.appId,
      ownerAccountId: context.ownerAccountId,
      webhookId: context.webhookId,
      provider: context.provider,
      environment: context.environment,
      providerEventId,
      parsedEventType,
      receivedAt,
      httpStatusCode,
      error,
      regardeEventId,
      deliveryOutcome,
      isRetry,
      retryCount,
    },
  };
};

export const recordWebhookDelivery = async ({
  webhookEvents,
  webhookDeliveries,
  appEvent,
  registryDelivery,
}: TWebhookDeliveryFeeds & TWebhookDeliveryEntries): Promise<void> => {
  await appendWebhookEvent(webhookEvents, appEvent);
  await appendRegistryWebhookDelivery(webhookDeliveries, registryDelivery);
};
