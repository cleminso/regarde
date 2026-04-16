import type { NormalizedEvent } from "#payments/types/normalized";
import { prefixProviderEventId } from "#payments/adapters/types";

import { PolarWebhookSchema } from "./schema";

type TPolarSubStatus = "trialing" | "active" | "past_due" | "canceled" | "expired" | "paused";

const mapPolarSubscriptionStatus = (status: string): TPolarSubStatus => {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "trialing":
      return "trialing";
    case "paused":
      return "paused";
    default:
      return "active";
  }
};

export const normalizePolarEvent = (payload: unknown): NormalizedEvent => {
  const parsed = PolarWebhookSchema.parse(payload);
  const data = parsed.data;
  const providerEventId = data.id ?? "";
  const prefixedProviderEventUUID = prefixProviderEventId("polar", providerEventId);
  const timestamp = data.created_at ? new Date(data.created_at).getTime() : Date.now();

  const providerMetadata: Record<string, string> = {
    polarEventType: parsed.type,
  };

  // =========================================================================
  // PAYMENT EVENTS
  // =========================================================================

  // --- checkout.created ---
  if (parsed.type === "checkout.created") {
    providerMetadata.checkoutId = data.id ?? "";
    if (data.customer_id) providerMetadata.customerId = data.customer_id;
    if (data.url) providerMetadata.checkoutUrl = data.url;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.checkout_started",
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: "0",
        currency: "USD",
        status: "pending",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- checkout.updated ---
  if (parsed.type === "checkout.updated") {
    providerMetadata.checkoutId = data.id ?? "";
    if (data.customer_id) providerMetadata.customerId = data.customer_id;
    if (data.status) providerMetadata.checkoutStatus = data.status;

    const isSucceeded = data.status === "succeeded";

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: isSucceeded ? "payment.succeeded" : "payment.updated",
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: "0",
        currency: "USD",
        status: isSucceeded ? "succeeded" : "pending",
        providerSubscriptionId: undefined,
      },
    };
  }

  // --- order.created ---
  if (parsed.type === "order.created") {
    const amount = data.net_amount ?? data.amount ?? 0;
    const currency = (data.currency ?? "usd").toUpperCase();
    if (data.customer_id) providerMetadata.customerId = data.customer_id;
    if (data.product_id) providerMetadata.productId = data.product_id;

    const orderStatus = data.status ?? "pending";
    const isPaid = orderStatus === "paid";

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: isPaid ? "payment.succeeded" : "payment.checkout_started",
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: isPaid ? "succeeded" : "pending",
        providerSubscriptionId: data.subscription_id ?? undefined,
      },
    };
  }

  // --- order.paid ---
  if (parsed.type === "order.paid") {
    const amount = data.amount ?? 0;
    const currency = (data.currency ?? "usd").toUpperCase();
    if (data.customer_id) providerMetadata.customerId = data.customer_id;
    if (data.product_id) providerMetadata.productId = data.product_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.succeeded",
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "succeeded",
        providerSubscriptionId: data.subscription_id ?? undefined,
      },
    };
  }

  // --- order.updated ---
  if (parsed.type === "order.updated") {
    const amount = data.amount ?? 0;
    const currency = (data.currency ?? "usd").toUpperCase();
    providerMetadata.orderId = data.id ?? "";
    if (data.customer_id) providerMetadata.customerId = data.customer_id;
    if (data.status) providerMetadata.orderStatus = data.status;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.updated",
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "pending",
        providerSubscriptionId: data.subscription_id ?? undefined,
      },
    };
  }

  // --- order.refunded ---
  if (parsed.type === "order.refunded") {
    const amount = data.refund_amount ?? data.amount ?? 0;
    const currency = (data.currency ?? "usd").toUpperCase();
    if (data.customer_id) providerMetadata.customerId = data.customer_id;
    if (data.id) providerMetadata.orderId = data.id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.refunded",
      timestamp,
      providerMetadata,
      data: {
        kind: "payment",
        amount: (amount / 100).toFixed(2),
        currency,
        status: "refunded",
        providerSubscriptionId: data.subscription_id ?? undefined,
      },
    };
  }

  // --- refund.created ---
  if (parsed.type === "refund.created") {
    const amount = data.amount ?? 0;
    const currency = (data.currency ?? "usd").toUpperCase();
    if (data.customer_id) providerMetadata.customerId = data.customer_id;
    if (data.order_id) providerMetadata.orderId = data.order_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.refunded",
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

  // --- refund.updated ---
  if (parsed.type === "refund.updated") {
    const amount = data.amount ?? 0;
    const currency = (data.currency ?? "usd").toUpperCase();
    providerMetadata.refundId = data.id ?? "";
    if (data.order_id) providerMetadata.orderId = data.order_id;
    if (data.status) providerMetadata.refundStatus = data.status;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "payment.refunded",
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

  // --- subscription.created ---
  if (parsed.type === "subscription.created") {
    const subId = data.id ?? "";
    if (data.customer_id) providerMetadata.customerId = data.customer_id;
    if (data.product_id) providerMetadata.productId = data.product_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.created",
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: mapPolarSubscriptionStatus(data.status),
        currentPeriodStart: data.current_period_start
          ? new Date(data.current_period_start).getTime()
          : undefined,
        currentPeriodEnd: data.current_period_end
          ? new Date(data.current_period_end).getTime()
          : undefined,
        planId: data.price_id ?? data.product_id ?? "",
      },
    };
  }

  // --- subscription.active ---
  if (parsed.type === "subscription.active") {
    const subId = data.id ?? "";
    if (data.customer_id) providerMetadata.customerId = data.customer_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.activated",
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: "active",
        currentPeriodStart: data.current_period_start
          ? new Date(data.current_period_start).getTime()
          : undefined,
        currentPeriodEnd: data.current_period_end
          ? new Date(data.current_period_end).getTime()
          : undefined,
        planId: data.price_id ?? data.product_id ?? "",
      },
    };
  }

  // --- subscription.updated ---
  if (parsed.type === "subscription.updated") {
    const subId = data.id ?? "";
    if (data.customer_id) providerMetadata.customerId = data.customer_id;
    if (data.product_id) providerMetadata.productId = data.product_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.updated",
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: mapPolarSubscriptionStatus(data.status),
        currentPeriodStart: data.current_period_start
          ? new Date(data.current_period_start).getTime()
          : undefined,
        currentPeriodEnd: data.current_period_end
          ? new Date(data.current_period_end).getTime()
          : undefined,
        planId: data.price_id ?? data.product_id ?? "",
        cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
      },
    };
  }

  // --- subscription.canceled ---
  if (parsed.type === "subscription.canceled") {
    const subId = data.id ?? "";
    if (data.customer_id) providerMetadata.customerId = data.customer_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.canceled",
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: "canceled",
        currentPeriodStart: data.current_period_start
          ? new Date(data.current_period_start).getTime()
          : undefined,
        currentPeriodEnd: data.current_period_end
          ? new Date(data.current_period_end).getTime()
          : undefined,
        planId: data.price_id ?? data.product_id ?? "",
      },
    };
  }

  // --- subscription.uncanceled ---
  if (parsed.type === "subscription.uncanceled") {
    const subId = data.id ?? "";
    if (data.customer_id) providerMetadata.customerId = data.customer_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.uncanceled",
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: mapPolarSubscriptionStatus(data.status),
        currentPeriodStart: data.current_period_start
          ? new Date(data.current_period_start).getTime()
          : undefined,
        currentPeriodEnd: data.current_period_end
          ? new Date(data.current_period_end).getTime()
          : undefined,
        planId: data.price_id ?? data.product_id ?? "",
      },
    };
  }

  // --- subscription.past_due ---
  if (parsed.type === "subscription.past_due") {
    const subId = data.id ?? "";
    if (data.customer_id) providerMetadata.customerId = data.customer_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.past_due",
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: "past_due",
        currentPeriodStart: data.current_period_start
          ? new Date(data.current_period_start).getTime()
          : undefined,
        currentPeriodEnd: data.current_period_end
          ? new Date(data.current_period_end).getTime()
          : undefined,
        planId: data.price_id ?? data.product_id ?? "",
      },
    };
  }

  // --- subscription.revoked ---
  if (parsed.type === "subscription.revoked") {
    const subId = data.id ?? "";
    if (data.customer_id) providerMetadata.customerId = data.customer_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "subscription.canceled",
      timestamp,
      providerMetadata,
      data: {
        kind: "subscription",
        providerSubscriptionId: subId,
        status: "canceled",
        currentPeriodStart: data.current_period_start
          ? new Date(data.current_period_start).getTime()
          : undefined,
        currentPeriodEnd: data.current_period_end
          ? new Date(data.current_period_end).getTime()
          : undefined,
        planId: data.price_id ?? data.product_id ?? "",
      },
    };
  }

  // =========================================================================
  // LICENSE EVENTS
  // =========================================================================

  // --- benefit_grant.created ---
  if (parsed.type === "benefit_grant.created") {
    if (data.benefit_id) providerMetadata.benefitId = data.benefit_id;
    if (data.customer_id) providerMetadata.customerId = data.customer_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "license.created",
      timestamp,
      providerMetadata,
      data: {
        kind: "license",
        benefitId: data.benefit_id ?? undefined,
        grantId: data.id ?? undefined,
        status: "active",
      },
    };
  }

  // --- benefit_grant.updated ---
  if (parsed.type === "benefit_grant.updated") {
    if (data.benefit_id) providerMetadata.benefitId = data.benefit_id;
    if (data.customer_id) providerMetadata.customerId = data.customer_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "license.updated",
      timestamp,
      providerMetadata,
      data: {
        kind: "license",
        benefitId: data.benefit_id ?? undefined,
        grantId: data.id ?? undefined,
        status: data.is_revoked === true ? "revoked" : "active",
      },
    };
  }

  // --- benefit_grant.revoked ---
  if (parsed.type === "benefit_grant.revoked") {
    if (data.benefit_id) providerMetadata.benefitId = data.benefit_id;
    if (data.customer_id) providerMetadata.customerId = data.customer_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "license.revoked",
      timestamp,
      providerMetadata,
      data: {
        kind: "license",
        benefitId: data.benefit_id ?? undefined,
        grantId: data.id ?? undefined,
        status: "revoked",
      },
    };
  }

  // --- benefit_grant.cycled ---
  if (parsed.type === "benefit_grant.cycled") {
    if (data.benefit_id) providerMetadata.benefitId = data.benefit_id;
    if (data.customer_id) providerMetadata.customerId = data.customer_id;

    return {
      provider: "polar",
      providerEventId,
      prefixedProviderEventUUID,
      eventType: "license.updated",
      timestamp,
      providerMetadata,
      data: {
        kind: "license",
        benefitId: data.benefit_id ?? undefined,
        grantId: data.id ?? undefined,
        status: data.is_revoked === true ? "revoked" : "active",
      },
    };
  }

  // =========================================================================
  // UNSUPPORTED EVENTS (Customer lifecycle - not payment-related)
  // =========================================================================

  if (
    parsed.type === "customer.created" ||
    parsed.type === "customer.updated" ||
    parsed.type === "customer.deleted" ||
    parsed.type === "customer.state_changed"
  ) {
    throw new Error(`Unsupported Polar event type (customer lifecycle): ${parsed.type}`);
  }

  throw new Error(`Unsupported Polar event type: ${parsed.type}`);
};
