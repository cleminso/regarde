import { SubscriptionEvent } from "@regarde-dev/core";

import { indexSubscriptionEvent } from "#payments/services/indexing/subscription";
import { manageSubscriptionState } from "#payments/services/mutations/subscriptionState";
import type { TProcessSubscriptionEventInput } from "./types";

export const processSubscriptionEvent = async ({
  normalized,
  data,
  eventOwnerGroup,
  jazzAccountId,
  appId,
  app,
  regardeSDKId,
  processedProviderEvents,
  worker,
  webhookId,
}: TProcessSubscriptionEventInput): Promise<string> => {
  const event = SubscriptionEvent.create(
    {
      webhookId,
      provider: normalized.provider,
      mode: normalized.mode,
      providerEventId: normalized.providerEventId,
      prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
      eventType: normalized.eventType,
      appId,
      userAccountId: jazzAccountId,
      providerSubscriptionId: data.providerSubscriptionId,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      planId: data.planId,
      providerMetadata: { ...normalized.providerMetadata },
      metadata: {},
      timestamp: normalized.timestamp,
    },
    { owner: eventOwnerGroup },
  );

  await event.$jazz.waitForSync();

  processedProviderEvents.$jazz.set(normalized.prefixedProviderEventUUID, event.$jazz.id);
  await processedProviderEvents.$jazz.waitForSync();

  await indexSubscriptionEvent({
    eventId: event.$jazz.id,
    prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
    appId,
    jazzAccountId,
    regardeSDKId,
    app,
    worker,
  });

  await manageSubscriptionState({
    normalized,
    data,
    subscriptionEventId: event.$jazz.id,
    eventOwnerGroup,
    jazzAccountId,
    appId,
    regardeSDKId,
    worker,
  });

  return event.$jazz.id;
};
