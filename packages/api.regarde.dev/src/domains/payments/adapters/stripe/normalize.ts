import type { NormalizedEvent } from "#payments/types/normalized";
import { prefixProviderEventId } from "#payments/adapters/types";

import { StripeEventSchema } from "./schema";

type TStripeSubStatus = "trialing" | "active" | "past_due" | "canceled" | "expired" | "paused";

const mapStripeSubscriptionStatus = (status: string): TStripeSubStatus => {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "incomplete_expired":
      return "expired";
    case "paused":
      return "paused";
    default:
      return "active";
  }
};

const extractStripePlanId = (subscriptionObj: Record<string, any>): string => {
  const items = subscriptionObj.items?.data;
  if (Array.isArray(items) && items.length > 0) {
    return items[0].price?.id ?? items[0].plan?.id ?? "";
  }
  return subscriptionObj.plan?.id ?? "";
};

export const normalizeStripeEvent = (payload: unknown): NormalizedEvent => {
  const parsed = StripeEventSchema.parse(payload);
  const obj = parsed.data.object;
  const mode = parsed.livemode === false ? "test" : "production";
  const providerEventId = parsed.id;
  const prefixedProviderEventUUID = prefixProviderEventId("stripe", providerEventId);
  const timestamp = parsed.created * 1000;

  const providerMetadata: Record<string, string> = {
    stripeEventType: parsed.type,
  };

  // =========================================================================
  // PAYMENT EVENTS
  // =========================================================================

  // --- checkout.session.completed ---
  if (parsed.type === "checkout.session.completed") {
    const amountTotal = obj.amount_total ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.sessionId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.payment_intent) providerMetadata.paymentIntentId = obj.payment_intent;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.checkout_completed",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountTotal / 100).toFixed(2),
        currency,
        status: "succeeded",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- checkout.session.async_payment_succeeded ---
  if (parsed.type === "checkout.session.async_payment_succeeded") {
    const amountTotal = obj.amount_total ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.sessionId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.payment_intent) providerMetadata.paymentIntentId = obj.payment_intent;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.checkout_succeeded",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountTotal / 100).toFixed(2),
        currency,
        status: "succeeded",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- checkout.session.async_payment_failed ---
  if (parsed.type === "checkout.session.async_payment_failed") {
    const amountTotal = obj.amount_total ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.sessionId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.payment_intent) providerMetadata.paymentIntentId = obj.payment_intent;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.checkout_failed",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountTotal / 100).toFixed(2),
        currency,
        status: "failed",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- checkout.session.expired ---
  if (parsed.type === "checkout.session.expired") {
    providerMetadata.sessionId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.expires_at) providerMetadata.expiresAt = obj.expires_at.toString();

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.checkout_expired",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: "0",
        currency: "USD",
        status: "failed",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- payment_intent.created ---
  if (parsed.type === "payment_intent.created") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.paymentIntentId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.checkout_started",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "pending",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- payment_intent.succeeded ---
  if (parsed.type === "payment_intent.succeeded") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.paymentIntentId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.charges?.data?.[0]?.id) {
      providerMetadata.chargeId = obj.charges.data[0].id;
    }

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.succeeded",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "succeeded",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- payment_intent.payment_failed ---
  if (parsed.type === "payment_intent.payment_failed") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.paymentIntentId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.last_payment_error?.decline_code) {
      providerMetadata.declineCode = obj.last_payment_error.decline_code;
    }
    if (obj.last_payment_error?.code) {
      providerMetadata.errorCode = obj.last_payment_error.code;
    }
    if (obj.last_payment_error?.message) {
      providerMetadata.errorMessage = obj.last_payment_error.message;
    }

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.failed",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "failed",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- payment_intent.canceled ---
  if (parsed.type === "payment_intent.canceled") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.paymentIntentId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.cancellation_reason) providerMetadata.cancellationReason = obj.cancellation_reason;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.canceled",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "failed",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- payment_intent.requires_action ---
  if (parsed.type === "payment_intent.requires_action") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.paymentIntentId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.client_secret) providerMetadata.clientSecret = "present";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.action_required",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "action_required",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- payment_intent.processing ---
  if (parsed.type === "payment_intent.processing") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.paymentIntentId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    providerMetadata.status = "processing";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.processing",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "pending",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- payment_intent.partially_funded ---
  if (parsed.type === "payment_intent.partially_funded") {
    const amount = obj.amount_received ?? obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.paymentIntentId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    providerMetadata.partiallyFunded = "true";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.partially_funded",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "pending",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- payment_intent.amount_capturable_updated ---
  if (parsed.type === "payment_intent.amount_capturable_updated") {
    const amount = obj.amount_capturable ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.paymentIntentId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.updated",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "pending",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- charge.succeeded ---
  if (parsed.type === "charge.succeeded") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.chargeId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.succeeded",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "succeeded",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- charge.captured ---
  if (parsed.type === "charge.captured") {
    const amount = obj.amount_captured ?? obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.chargeId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    providerMetadata.captured = "true";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.captured",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "succeeded",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- charge.failed ---
  if (parsed.type === "charge.failed") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.chargeId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.failure_code) providerMetadata.failureCode = obj.failure_code;
    if (obj.failure_message) providerMetadata.failureMessage = obj.failure_message;
    if (obj.outcome?.reason) providerMetadata.outcomeReason = obj.outcome.reason;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.failed",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "failed",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- charge.expired ---
  if (parsed.type === "charge.expired") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.chargeId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.expires_at) providerMetadata.expiresAt = obj.expires_at.toString();

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.expired",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "failed",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- charge.pending ---
  if (parsed.type === "charge.pending") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.chargeId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.processing",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "pending",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- charge.updated ---
  if (parsed.type === "charge.updated") {
    providerMetadata.chargeId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.description) providerMetadata.description = obj.description;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.updated",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: "0",
        currency: "USD",
        status: "succeeded",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- charge.refunded ---
  if (parsed.type === "charge.refunded") {
    const amount = obj.amount_refunded ?? obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.chargeId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    providerMetadata.refunded = "true";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.refunded",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "refunded",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- invoice.paid ---
  if (parsed.type === "invoice.paid") {
    const amountPaid = obj.amount_paid ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.invoiceId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.billing_reason) providerMetadata.billingReason = obj.billing_reason;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.succeeded",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountPaid / 100).toFixed(2),
        currency,
        status: "succeeded",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- invoice.payment_succeeded ---
  if (parsed.type === "invoice.payment_succeeded") {
    const amountPaid = obj.amount_paid ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.invoiceId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.billing_reason) providerMetadata.billingReason = obj.billing_reason;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.succeeded",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountPaid / 100).toFixed(2),
        currency,
        status: "succeeded",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- invoice.payment_failed ---
  if (parsed.type === "invoice.payment_failed") {
    const amountDue = obj.amount_due ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.invoiceId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.failed",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountDue / 100).toFixed(2),
        currency,
        status: "failed",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- invoice.payment_action_required ---
  if (parsed.type === "invoice.payment_action_required") {
    const amountDue = obj.amount_due ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.invoiceId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.hosted_invoice_url) providerMetadata.invoiceUrl = obj.hosted_invoice_url;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.action_required",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountDue / 100).toFixed(2),
        currency,
        status: "action_required",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- invoice.created ---
  if (parsed.type === "invoice.created") {
    const amountDue = obj.amount_due ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.invoiceId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.subscription) providerMetadata.subscriptionId = obj.subscription;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.updated",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountDue / 100).toFixed(2),
        currency,
        status: "pending",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- invoice.finalized ---
  if (parsed.type === "invoice.finalized") {
    const amountDue = obj.amount_due ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.invoiceId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    providerMetadata.status = "open";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.updated",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountDue / 100).toFixed(2),
        currency,
        status: "pending",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- invoice.deleted ---
  if (parsed.type === "invoice.deleted") {
    providerMetadata.invoiceId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    providerMetadata.deleted = "true";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.canceled",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: "0",
        currency: "USD",
        status: "failed",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- invoice.finalization_failed ---
  if (parsed.type === "invoice.finalization_failed") {
    const amountDue = obj.amount_due ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.invoiceId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    if (obj.last_finalization_error?.message) {
      providerMetadata.errorMessage = obj.last_finalization_error.message;
    }

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.failed",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountDue / 100).toFixed(2),
        currency,
        status: "failed",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- invoice.marked_uncollectible ---
  if (parsed.type === "invoice.marked_uncollectible") {
    const amountDue = obj.amount_due ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.invoiceId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    providerMetadata.status = "uncollectible";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.failed",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountDue / 100).toFixed(2),
        currency,
        status: "failed",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- invoice.voided ---
  if (parsed.type === "invoice.voided") {
    const amountDue = obj.amount_due ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.invoiceId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    providerMetadata.status = "void";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.canceled",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amountDue / 100).toFixed(2),
        currency,
        status: "failed",
        providerSubscriptionId: obj.subscription ?? undefined,
      },
    };
  }

  // --- refund.created ---
  if (parsed.type === "refund.created") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.refundId = obj.id ?? "";
    if (obj.charge) providerMetadata.chargeId = obj.charge;
    if (obj.payment_intent) providerMetadata.paymentIntentId = obj.payment_intent;
    if (obj.reason) providerMetadata.refundReason = obj.reason;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.refunded",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "refunded",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- refund.failed ---
  if (parsed.type === "refund.failed") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.refundId = obj.id ?? "";
    if (obj.charge) providerMetadata.chargeId = obj.charge;
    if (obj.payment_intent) providerMetadata.paymentIntentId = obj.payment_intent;
    if (obj.failure_reason) providerMetadata.failureReason = obj.failure_reason;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.refund_failed",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "failed",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- refund.updated ---
  if (parsed.type === "refund.updated") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.refundId = obj.id ?? "";
    if (obj.charge) providerMetadata.chargeId = obj.charge;
    if (obj.payment_intent) providerMetadata.paymentIntentId = obj.payment_intent;
    if (obj.status) providerMetadata.refundStatus = obj.status;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.refunded",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "refunded",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- charge.refund.updated ---
  if (parsed.type === "charge.refund.updated") {
    const amount = obj.amount ?? 0;
    const currency = (obj.currency ?? "usd").toUpperCase();
    providerMetadata.refundId = obj.id ?? "";
    if (obj.charge) providerMetadata.chargeId = obj.charge;
    if (obj.status) providerMetadata.refundStatus = obj.status;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.refunded",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "refunded",
        providerSubscriptionId: undefined,
      },
    };
  }

  // =========================================================================
  // SUBSCRIPTION EVENTS
  // =========================================================================

  // --- customer.subscription.created ---
  if (parsed.type === "customer.subscription.created") {
    const subId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.created",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: mapStripeSubscriptionStatus(obj.status),
        currentPeriodStart: obj.current_period_start
          ? obj.current_period_start * 1000
          : undefined,
        currentPeriodEnd: obj.current_period_end ? obj.current_period_end * 1000 : undefined,
        planId: extractStripePlanId(obj),
        cancelAtPeriodEnd: obj.cancel_at_period_end ?? false,
      },
    };
  }

  // --- customer.subscription.deleted ---
  if (parsed.type === "customer.subscription.deleted") {
    const subId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.canceled",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: "canceled",
        currentPeriodStart: obj.current_period_start
          ? obj.current_period_start * 1000
          : undefined,
        currentPeriodEnd: obj.current_period_end ? obj.current_period_end * 1000 : undefined,
        planId: extractStripePlanId(obj),
      },
    };
  }

  // --- customer.subscription.paused ---
  if (parsed.type === "customer.subscription.paused") {
    const subId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.paused",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: "paused",
        currentPeriodStart: obj.current_period_start
          ? obj.current_period_start * 1000
          : undefined,
        currentPeriodEnd: obj.current_period_end ? obj.current_period_end * 1000 : undefined,
        planId: extractStripePlanId(obj),
      },
    };
  }

  // --- customer.subscription.resumed ---
  if (parsed.type === "customer.subscription.resumed") {
    const subId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.resumed",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: "active",
        currentPeriodStart: obj.current_period_start
          ? obj.current_period_start * 1000
          : undefined,
        currentPeriodEnd: obj.current_period_end ? obj.current_period_end * 1000 : undefined,
        planId: extractStripePlanId(obj),
      },
    };
  }

  // --- customer.subscription.trial_will_end ---
  if (parsed.type === "customer.subscription.trial_will_end") {
    const subId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;
    providerMetadata.trialEnd = obj.trial_end ? new Date(obj.trial_end * 1000).toISOString() : "";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.trial_will_end",
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: mapStripeSubscriptionStatus(obj.status),
        currentPeriodStart: obj.current_period_start
          ? obj.current_period_start * 1000
          : undefined,
        currentPeriodEnd: obj.current_period_end ? obj.current_period_end * 1000 : undefined,
        planId: extractStripePlanId(obj),
      },
    };
  }

  // --- customer.subscription.updated ---
  if (parsed.type === "customer.subscription.updated") {
    const subId = obj.id ?? "";
    if (obj.customer) providerMetadata.customerId = obj.customer;

    const status = mapStripeSubscriptionStatus(obj.status);
    const eventType: "subscription.past_due" | "subscription.updated" =
      status === "past_due" ? "subscription.past_due" : "subscription.updated";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType,
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status,
        currentPeriodStart: obj.current_period_start
          ? obj.current_period_start * 1000
          : undefined,
        currentPeriodEnd: obj.current_period_end ? obj.current_period_end * 1000 : undefined,
        planId: extractStripePlanId(obj),
        cancelAtPeriodEnd: obj.cancel_at_period_end ?? false,
      },
    };
  }

  // =========================================================================
  // LICENSE EVENTS
  // =========================================================================

  // --- entitlements.active_entitlement_summary.updated ---
  if (parsed.type === "entitlements.active_entitlement_summary.updated") {
    const entitlements = obj.entitlements?.data ?? [];
    const hasEntitlements = entitlements.length > 0;
    if (obj.customer) providerMetadata.customerId = obj.customer;

    let eventType: "license.created" | "license.updated" | "license.revoked";
    let status: "active" | "inactive" | "revoked";

    if (hasEntitlements === false) {
      eventType = "license.revoked";
      status = "revoked";
    } else {
      eventType = "license.updated";
      status = "active";
    }

    const firstEntitlement = entitlements[0];
    const entitlementId = firstEntitlement?.id ?? "";

    return {
      provider: "stripe",
      providerEventId,
      prefixedProviderEventUUID,
      eventType,
      mode,
      timestamp,
      providerMetadata,
      data: {
        kind: "license",
        entitlementId,
        status,
      },
    };
  }

  // =========================================================================
  // UNSUPPORTED EVENTS (Customer lifecycle - not payment-related)
  // =========================================================================

  if (
    parsed.type === "customer.created" ||
    parsed.type === "customer.updated" ||
    parsed.type === "customer.deleted"
  ) {
    throw new Error(`Unsupported Stripe event type (customer lifecycle): ${parsed.type}`);
  }

  throw new Error(`Unsupported Stripe event type: ${parsed.type}`);
};
