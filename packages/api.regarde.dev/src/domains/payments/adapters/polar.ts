import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import type {
  PaymentProviderAdapter,
  NormalizedEvent,
  WebhookContext,
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
  provider: "polar",
  signatureHeader: "webhook-signature",

  validateSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    // Polar uses standard webhook signature format: "v1,{timestamp},{signature}"
    // or a simpler HMAC-SHA256 format depending on version
    const parts = signature.split(",");

    if (parts.length >= 3) {
      // Format: v1,{timestamp},{signature}
      const timestamp = parts[1];
      const sig = parts[2];
      const signedPayload = `${timestamp}.${payload}`;
      const expected = createHmac("sha256", secret)
        .update(signedPayload)
        .digest("hex");

      const sigBuffer = Buffer.from(sig, "utf8");
      const expectedBuffer = Buffer.from(expected, "utf8");
      if (sigBuffer.length !== expectedBuffer.length) return false;
      return timingSafeEqual(sigBuffer, expectedBuffer);
    }

    // Fallback: simple HMAC comparison
    const expected = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(sigBuffer, expectedBuffer);
  },

  extractContext(payload: unknown): WebhookContext {
    const parsed = PolarWebhookSchema.parse(payload);
    const data = parsed.data;
    const metadata = data.metadata ?? {};

    const appId = metadata.regarde_app_id ?? metadata.app_id;
    const jazzAccountId = metadata.regarde_user_id ?? metadata.user_id;
    const regardeSDKId = metadata.regarde_sdk_id;

    if (typeof appId !== "string" || appId === "") {
      throw new Error("Missing regarde_app_id in Polar metadata");
    }
    if (typeof jazzAccountId !== "string" || jazzAccountId === "") {
      throw new Error("Missing regarde_user_id in Polar metadata");
    }
    if (typeof regardeSDKId !== "string" || regardeSDKId === "") {
      throw new Error("Missing regarde_sdk_id in Polar metadata");
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
