import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import type {
  PaymentProviderAdapter,
  NormalizedEvent,
  WebhookContext,
} from "./types";
import { prefixProviderEventId } from "./types";

// ---------------------------------------------------------------------------
// Stripe Webhook Payload Schemas
// ---------------------------------------------------------------------------

const StripeEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  livemode: z.boolean(),
  created: z.number(),
  data: z.object({
    object: z.record(z.string(), z.any()),
  }),
});

export type TStripeEvent = z.infer<typeof StripeEventSchema>;

// ---------------------------------------------------------------------------
// Stripe Signature Verification
// ---------------------------------------------------------------------------

const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;

const parseStripeSignature = (
  header: string,
): { timestamp: string; signatures: string[] } => {
  const parts = header.split(",");
  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1") signatures.push(value);
  }

  return { timestamp, signatures };
};

// ---------------------------------------------------------------------------
// Stripe Adapter
// ---------------------------------------------------------------------------

export const stripeAdapter: PaymentProviderAdapter = {
  provider: "stripe",
  signatureHeader: "stripe-signature",

  validateSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const { timestamp, signatures } = parseStripeSignature(signature);

    if (signatures.length === 0 || timestamp === "") {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const timestampNum = parseInt(timestamp, 10);
    if (Math.abs(now - timestampNum) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    return signatures.some((sig) => {
      const sigBuffer = Buffer.from(sig, "utf8");
      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      if (sigBuffer.length !== expectedBuffer.length) return false;
      return timingSafeEqual(sigBuffer, expectedBuffer);
    });
  },

  extractContext(payload: unknown): WebhookContext {
    const parsed = StripeEventSchema.parse(payload);
    const obj = parsed.data.object;

    const metadata = obj.metadata ?? {};
    const appId = metadata.regarde_app_id ?? metadata.app_id;
    const jazzAccountId = metadata.regarde_user_id ?? metadata.user_id;
    const regardeSDKId = metadata.regarde_sdk_id;

    if (typeof appId !== "string" || appId === "") {
      throw new Error("Missing regarde_app_id in Stripe metadata");
    }
    if (typeof jazzAccountId !== "string" || jazzAccountId === "") {
      throw new Error("Missing regarde_user_id in Stripe metadata");
    }
    if (typeof regardeSDKId !== "string" || regardeSDKId === "") {
      throw new Error("Missing regarde_sdk_id in Stripe metadata");
    }

    return { appId, jazzAccountId, regardeSDKId };
  },

  normalizeEvent(payload: unknown): NormalizedEvent {
    const parsed = StripeEventSchema.parse(payload);
    const obj = parsed.data.object;
    const mode = parsed.livemode === false ? "test" : "production";
    const providerEventId = parsed.id;
    const prefixedProviderEventUUID = prefixProviderEventId("stripe", providerEventId);
    const timestamp = parsed.created * 1000;

    const providerMetadata: Record<string, string> = {
      stripeEventType: parsed.type,
    };

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
        eventType: "payment.created",
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
        eventType: "payment.created",
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
          currentPeriodEnd: obj.current_period_end
            ? obj.current_period_end * 1000
            : undefined,
          planId: extractStripePlanId(obj),
          cancelAtPeriodEnd: obj.cancel_at_period_end ?? false,
        },
      };
    }

    // --- customer.subscription.updated ---
    if (parsed.type === "customer.subscription.updated") {
      const subId = obj.id ?? "";
      if (obj.customer) providerMetadata.customerId = obj.customer;

      return {
        provider: "stripe",
        providerEventId,
        prefixedProviderEventUUID,
        eventType: "subscription.updated",
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
          currentPeriodEnd: obj.current_period_end
            ? obj.current_period_end * 1000
            : undefined,
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
          currentPeriodEnd: obj.current_period_end
            ? obj.current_period_end * 1000
            : undefined,
          planId: extractStripePlanId(obj),
        },
      };
    }

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

    throw new Error(`Unsupported Stripe event type: ${parsed.type}`);
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TStripeSubStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";

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
