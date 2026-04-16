import {
  PaymentEvent,
  TPaymentEventType,
} from "@regarde-dev/core";

import { indexPaymentEvent } from "../indexing/payment";
import { updateSubscriptionFromPayment } from "../sideEffects/subscriptionState";
import { updateCheckoutSessionFromPayment } from "../sideEffects/checkoutSession";
import { createInvoiceFromPayment } from "../sideEffects/invoice";
import type { TProcessPaymentEventInput } from "./types";

export const processPaymentEvent = async ({
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
}: TProcessPaymentEventInput): Promise<string> => {
  const event = PaymentEvent.create(
    {
      webhookId,
      provider: normalized.provider,
      mode: normalized.mode,
      providerEventId: normalized.providerEventId,
      prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
      eventType: normalized.eventType as TPaymentEventType,
      appId,
      userAccountId: jazzAccountId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      providerSubscriptionId: data.providerSubscriptionId,
      providerLicenseId: data.providerLicenseId,
      providerMetadata: { ...normalized.providerMetadata },
      metadata: {},
      timestamp: normalized.timestamp,
    },
    { owner: eventOwnerGroup },
  );

  await event.$jazz.waitForSync();

  processedProviderEvents.$jazz.set(normalized.prefixedProviderEventUUID, event.$jazz.id);
  await processedProviderEvents.$jazz.waitForSync();

  await indexPaymentEvent({
    eventId: event.$jazz.id,
    prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
    appId,
    jazzAccountId,
    regardeSDKId,
    app,
    worker,
  });

  const providerSubscriptionId = data.providerSubscriptionId;
  const hasProviderSubscriptionId =
    providerSubscriptionId !== undefined && providerSubscriptionId !== null;
  if (hasProviderSubscriptionId === true) {
    await updateSubscriptionFromPayment({
      paymentEventId: event.$jazz.id,
      providerSubscriptionId,
      regardeSDKId,
      worker,
    });
  }

  await updateCheckoutSessionFromPayment({
    normalized,
    paymentEventId: event.$jazz.id,
    app,
    worker,
  });

  await createInvoiceFromPayment({
    normalized,
    data,
    paymentEventId: event.$jazz.id,
    app,
    jazzAccountId,
    eventOwnerGroup,
  });

  return event.$jazz.id;
};
