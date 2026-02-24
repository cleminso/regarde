import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import type {
  PaymentProviderAdapter,
  NormalizedEvent,
  WebhookContext,
  WebhookQueryContext,
} from "./types";
import { prefixProviderEventId } from "./types";

// ---------------------------------------------------------------------------
// Polar Webhook Payload Schemas
// ---------------------------------------------------------------------------

const PolarWebhookSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.any()),
});

export type TPolarWebhook = z.infer<typeof PolarWebhookSchema>;

// ---------------------------------------------------------------------------
// Polar Adapter
// ---------------------------------------------------------------------------

export const polarAdapter: PaymentProviderAdapter = {
  signatureHeader: "webhook-signature",
  timestampHeader: "webhook-timestamp",
  idHeader: "webhook-id",

  validateSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp?: string,
    id?: string,
  ): boolean {
    // For Standard Webhooks manual implementation, use the secret as-is
    const signingSecret = secret;

    // Polar uses standard webhook signature format: "v1,{base64-signature}"
    const parts = signature.split(",");

    if (parts.length === 2) {
      // Standard Webhooks format: v1,{base64-signature}
      // The signed payload should be: {id}.{timestamp}.{body}
      const sig = parts[1];
      
      // Construct signed payload according to Standard Webhooks spec
      let signedPayload: string;
      if (id !== undefined && id !== "" && timestamp !== undefined && timestamp !== "") {
        signedPayload = `${id}.${timestamp}.${payload}`;
      } else if (timestamp !== undefined && timestamp !== "") {
        signedPayload = `${timestamp}.${payload}`;
      } else {
        signedPayload = payload;
      }
      
      const expected = createHmac("sha256", signingSecret)
        .update(signedPayload)
        .digest("base64");

      const sigBuffer = Buffer.from(sig, "base64");
      const expectedBuffer = Buffer.from(expected, "base64");
      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }
      return timingSafeEqual(sigBuffer, expectedBuffer);
    }

    // Legacy format or fallback
    const expected = createHmac("sha256", signingSecret)
      .update(payload)
      .digest("base64");

    const sigBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expected, "base64");
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(sigBuffer, expectedBuffer);
  },

  extractContext(
    payload: unknown,
    queryContext?: WebhookQueryContext,
  ): WebhookContext {
    const parsed = PolarWebhookSchema.parse(payload);
    const data = parsed.data;
    const metadata = data.metadata ?? {};

    // Use metadata first, fall back to URL path for appId
    const appId =
      metadata.regarde_app_id ?? metadata.app_id ?? queryContext?.pathAppId;
    // Use metadata first, fall back to query params for testing
    const jazzAccountId =
      metadata.regarde_user_id ??
      metadata.user_id ??
      queryContext?.regarde_user_id;
    const regardeSDKId =
      metadata.regarde_sdk_id ?? queryContext?.regarde_sdk_id;

    if (typeof appId !== "string" || appId === "") {
      throw new Error("Missing regarde_app_id in Polar metadata or URL path");
    }
    if (typeof jazzAccountId !== "string" || jazzAccountId === "") {
      throw new Error(
        "Missing regarde_user_id in Polar metadata or query params (regarde_user_id)",
      );
    }
    if (typeof regardeSDKId !== "string" || regardeSDKId === "") {
      throw new Error(
        "Missing regarde_sdk_id in Polar metadata or query params (regarde_sdk_id)",
      );
    }

    return { appId, jazzAccountId, regardeSDKId };
  },

  normalizeEvent(payload: unknown): NormalizedEvent {
    const parsed = PolarWebhookSchema.parse(payload);
    const data = parsed.data;
    const providerEventId = data.id ?? "";
    const prefixedProviderEventUUID = prefixProviderEventId("polar", providerEventId);
    const timestamp = data.created_at
      ? new Date(data.created_at).getTime()
      : Date.now();

    // Polar sandbox = test mode; production = production mode
    const mode = data.is_sandbox === true ? "test" : "production";

    const providerMetadata: Record<string, string> = {
      polarEventType: parsed.type,
    };

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
        eventType: "payment.created",
        mode,
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
        mode,
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

    // --- subscription.canceled ---
    if (parsed.type === "subscription.canceled") {
      const subId = data.id ?? "";
      if (data.customer_id) providerMetadata.customerId = data.customer_id;

      return {
        provider: "polar",
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

    // --- benefit_grant.created ---
    if (parsed.type === "benefit_grant.created") {
      if (data.benefit_id) providerMetadata.benefitId = data.benefit_id;
      if (data.customer_id) providerMetadata.customerId = data.customer_id;

      return {
        provider: "polar",
        providerEventId,
        prefixedProviderEventUUID,
        eventType: "license.created",
        mode,
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
        mode,
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
        mode,
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

    // --- order.created ---
    if (parsed.type === "order.created") {
      const amount = data.net_amount ?? data.amount ?? 0;
      const currency = (data.currency ?? "usd").toUpperCase();
      if (data.customer_id) providerMetadata.customerId = data.customer_id;
      if (data.product_id) providerMetadata.productId = data.product_id;
      
      // order.created might be pending, check status
      const orderStatus = data.status ?? "pending";
      const paymentStatus: TPaymentStatus = orderStatus === "paid" ? "succeeded" : "pending";

      return {
        provider: "polar",
        providerEventId,
        prefixedProviderEventUUID,
        eventType: "payment.created",
        mode,
        timestamp,
        providerMetadata,
        data: {
          kind: "payment",
          amount: (amount / 100).toFixed(2),
          currency,
          status: paymentStatus,
          providerSubscriptionId: data.subscription_id ?? undefined,
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
        mode,
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

    // --- subscription.active ---
    if (parsed.type === "subscription.active") {
      const subId = data.id ?? "";
      if (data.customer_id) providerMetadata.customerId = data.customer_id;

      return {
        provider: "polar",
        providerEventId,
        prefixedProviderEventUUID,
        eventType: "subscription.updated",
        mode,
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

    // --- subscription.past_due ---
    if (parsed.type === "subscription.past_due") {
      const subId = data.id ?? "";
      if (data.customer_id) providerMetadata.customerId = data.customer_id;

      return {
        provider: "polar",
        providerEventId,
        prefixedProviderEventUUID,
        eventType: "subscription.updated",
        mode,
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

    // --- subscription.uncanceled ---
    if (parsed.type === "subscription.uncanceled") {
      const subId = data.id ?? "";
      if (data.customer_id) providerMetadata.customerId = data.customer_id;

      return {
        provider: "polar",
        providerEventId,
        prefixedProviderEventUUID,
        eventType: "subscription.updated",
        mode,
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

    // --- subscription.revoked ---
    if (parsed.type === "subscription.revoked") {
      const subId = data.id ?? "";
      if (data.customer_id) providerMetadata.customerId = data.customer_id;

      return {
        provider: "polar",
        providerEventId,
        prefixedProviderEventUUID,
        eventType: "subscription.updated",
        mode,
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

    // --- benefit_grant.cycled ---
    if (parsed.type === "benefit_grant.cycled") {
      if (data.benefit_id) providerMetadata.benefitId = data.benefit_id;
      if (data.customer_id) providerMetadata.customerId = data.customer_id;

      return {
        provider: "polar",
        providerEventId,
        prefixedProviderEventUUID,
        eventType: "license.updated",
        mode,
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

    throw new Error(`Unsupported Polar event type: ${parsed.type}`);
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TPolarSubStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";

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
    default:
      return "active";
  }
};
