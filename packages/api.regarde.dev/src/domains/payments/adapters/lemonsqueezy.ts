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
// LemonSqueezy Webhook Payload Schemas
// ---------------------------------------------------------------------------

const MetaSchema = z.object({
  event_name: z.string(),
  custom_data: z.record(z.string(), z.any()).optional(),
  test_mode: z.boolean().optional(),
});

const OrderSchema = z.object({
  meta: MetaSchema,
  data: z.object({
    type: z.literal("orders"),
    id: z.string(),
    attributes: z.object({
      identifier: z.string(),
      order_number: z.number(),
      user_email: z.email(),
      total: z.number(),
      currency: z.string(),
      status: z.enum(["paid", "pending", "failed", "refunded"]),
      created_at: z.iso.datetime(),
      updated_at: z.iso.datetime(),
      first_order_item: z.object({
        product_name: z.string(),
        variant_name: z.string().optional(),
        product_id: z.number(),
        variant_id: z.number(),
      }),
      urls: z
        .object({
          receipt: z.url().optional(),
        })
        .optional(),
    }),
  }),
});

const SubscriptionSchema = z.object({
  meta: MetaSchema,
  data: z.object({
    type: z.literal("subscriptions"),
    id: z.string(),
    attributes: z.object({
      user_email: z.email(),
      status: z.string(),
      created_at: z.iso.datetime(),
      updated_at: z.iso.datetime(),
      product_name: z.string(),
      variant_name: z.string().optional(),
      product_id: z.number(),
      variant_id: z.number(),
      urls: z
        .object({
          update_payment_method: z.url().optional(),
        })
        .optional(),
    }),
  }),
});

const SubscriptionInvoiceSchema = z.object({
  meta: MetaSchema,
  data: z.object({
    type: z.literal("subscription-invoices"),
    id: z.string(),
    attributes: z.object({
      subscription_id: z.number(),
      user_email: z.email(),
      total: z.number(),
      currency: z.string(),
      status: z.string(),
      created_at: z.iso.datetime(),
      updated_at: z.iso.datetime(),
      billing_reason: z.string(),
      urls: z
        .object({
          invoice_url: z.url().optional(),
        })
        .optional(),
    }),
  }),
});

const LicenseKeySchema = z.object({
  meta: MetaSchema,
  data: z.object({
    type: z.literal("license-keys"),
    id: z.string(),
    attributes: z.object({
      identifier: z.string(),
      key: z.string(),
      status: z.string(),
      activation_limit: z.number().optional(),
      activations_count: z.number().optional(),
      order_id: z.number(),
      product_id: z.number(),
      created_at: z.iso.datetime(),
      updated_at: z.iso.datetime(),
    }),
  }),
});

// Discriminated Union via 'type' inside 'data' would be better if Zod supported deep discrimination easily,
// but for now, we just union them. Zod will try each.
export const LemonSqueezyPayloadSchema = z.union([
  OrderSchema,
  SubscriptionSchema,
  SubscriptionInvoiceSchema,
  LicenseKeySchema,
]);

export type TLemonSqueezyPayload = z.infer<typeof LemonSqueezyPayloadSchema>;

// ---------------------------------------------------------------------------
// LemonSqueezy Adapter
// ---------------------------------------------------------------------------

export const lemonsqueezyAdapter: PaymentProviderAdapter = {
  provider: "lemonsqueezy",
  signatureHeader: "x-signature",

  validateSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    const digest = Buffer.from(expectedSignature, "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (digest.length !== signatureBuffer.length) {
      return false;
    }

    return timingSafeEqual(digest, signatureBuffer);
  },

  extractContext(
    payload: unknown,
    queryContext?: WebhookQueryContext,
  ): WebhookContext {
    const parsed = LemonSqueezyPayloadSchema.parse(payload);
    const customData = parsed.meta.custom_data ?? {};

    // Use custom_data first, fall back to URL path for appId
    const appId = customData.app_id ?? queryContext?.pathAppId;
    // Use custom_data first, fall back to query params for testing
    const jazzAccountId =
      customData.user_id ?? queryContext?.regarde_user_id;
    const regardeSDKId =
      customData.regarde_sdk_id ?? queryContext?.regarde_sdk_id;

    if (typeof appId !== "string" || appId === "") {
      throw new Error("Missing app_id in custom_data or URL path");
    }
    if (typeof jazzAccountId !== "string" || jazzAccountId === "") {
      throw new Error(
        "Missing user_id in custom_data or query params (regarde_user_id)",
      );
    }
    if (typeof regardeSDKId !== "string" || regardeSDKId === "") {
      throw new Error(
        "Missing regarde_sdk_id in custom_data or query params (regarde_sdk_id)",
      );
    }

    return { appId, jazzAccountId, regardeSDKId };
  },

  normalizeEvent(payload: unknown): NormalizedEvent {
    const parsed = LemonSqueezyPayloadSchema.parse(payload);
    const { event_name, test_mode } = parsed.meta;
    const mode = test_mode === true ? "test" : "production";
    const providerEventId = parsed.data.id;
    const prefixedProviderEventUUID = prefixProviderEventId(
      "lemonsqueezy",
      providerEventId,
    );

    // --- Orders ---
    if (parsed.data.type === "orders") {
      const attrs = parsed.data.attributes;
      const providerMetadata: Record<string, string> = {
        eventName: event_name,
        orderNumber: attrs.order_number.toString(),
        productName: attrs.first_order_item.product_name,
      };
      if (attrs.urls?.receipt) providerMetadata.receiptUrl = attrs.urls.receipt;

      let status: "succeeded" | "failed" | "refunded" | "pending" = "pending";
      let eventType: "payment.created" | "payment.failed" | "payment.refunded" =
        "payment.created";

      if (attrs.status === "paid") {
        status = "succeeded";
        eventType = "payment.created";
      } else if (attrs.status === "failed") {
        status = "failed";
        eventType = "payment.failed";
      } else if (attrs.status === "refunded") {
        status = "refunded";
        eventType = "payment.refunded";
      }

      return {
        provider: "lemonsqueezy",
        providerEventId,
        prefixedProviderEventUUID,
        eventType,
        mode,
        timestamp: new Date(attrs.created_at).getTime(),
        providerMetadata,
        data: {
          kind: "payment",
          amount: attrs.total.toString(),
          currency: attrs.currency,
          status,
        },
      };
    }

    // --- Subscriptions ---
    if (parsed.data.type === "subscriptions") {
      const attrs = parsed.data.attributes;
      const providerMetadata: Record<string, string> = {
        eventName: event_name,
        productName: attrs.product_name,
      };

      let eventType:
        | "subscription.created"
        | "subscription.canceled"
        | "subscription.updated";
      let status: "trialing" | "active" | "past_due" | "canceled" | "expired";

      if (event_name === "subscription_created") {
        eventType = "subscription.created";
      } else if (event_name === "subscription_cancelled") {
        eventType = "subscription.canceled";
      } else {
        eventType = "subscription.updated";
      }

      if (attrs.status === "active") status = "active";
      else if (attrs.status === "cancelled") status = "canceled";
      else if (attrs.status === "expired") status = "expired";
      else if (attrs.status === "past_due") status = "past_due";
      else if (attrs.status === "on_trial") status = "trialing";
      else status = "active";

      return {
        provider: "lemonsqueezy",
        providerEventId,
        prefixedProviderEventUUID,
        eventType,
        mode,
        timestamp: new Date(attrs.created_at).getTime(),
        providerMetadata,
        data: {
          kind: "subscription",
          providerSubscriptionId: parsed.data.id,
          status,
          planId: attrs.variant_id.toString(),
        },
      };
    }

    // --- Subscription Invoices ---
    if (parsed.data.type === "subscription-invoices") {
      const attrs = parsed.data.attributes;
      const providerMetadata: Record<string, string> = {
        eventName: event_name,
        billingReason: attrs.billing_reason,
      };

      let status: "succeeded" | "failed" | "refunded" | "pending" = "pending";
      let eventType: "payment.created" | "payment.failed" | "payment.refunded" =
        "payment.created";

      if (
        event_name === "subscription_payment_success" ||
        attrs.status === "paid"
      ) {
        status = "succeeded";
        eventType = "payment.created";
      } else if (event_name === "subscription_payment_failed") {
        status = "failed";
        eventType = "payment.failed";
      } else if (attrs.status === "void" || attrs.status === "refund") {
        status = "refunded";
        eventType = "payment.refunded";
      }

      return {
        provider: "lemonsqueezy",
        providerEventId,
        prefixedProviderEventUUID,
        eventType,
        mode,
        timestamp: new Date(attrs.created_at).getTime(),
        providerMetadata,
        data: {
          kind: "payment",
          amount: attrs.total.toString(),
          currency: attrs.currency,
          status,
          providerSubscriptionId: attrs.subscription_id.toString(),
        },
      };
    }

    // --- License Keys ---
    if (parsed.data.type === "license-keys") {
      const attrs = parsed.data.attributes;
      const providerMetadata: Record<string, string> = {
        eventName: event_name,
        productId: attrs.product_id.toString(),
        orderId: attrs.order_id.toString(),
      };
      if (attrs.activation_limit !== undefined) {
        providerMetadata.activationLimit = attrs.activation_limit.toString();
      }
      if (attrs.activations_count !== undefined) {
        providerMetadata.activationsCount = attrs.activations_count.toString();
      }

      let eventType: "license.created" | "license.updated" | "license.revoked";
      let status: "active" | "inactive" | "revoked";

      if (event_name === "license_key_created") {
        eventType = "license.created";
        status = "active";
      } else if (event_name === "license_key_updated") {
        eventType = "license.updated";
        status = attrs.status === "disabled" ? "inactive" : "active";
      } else {
        eventType = "license.revoked";
        status = "revoked";
      }

      return {
        provider: "lemonsqueezy",
        providerEventId,
        prefixedProviderEventUUID,
        eventType,
        mode,
        timestamp: new Date(attrs.created_at).getTime(),
        providerMetadata,
        data: {
          kind: "license",
          licenseKey: attrs.key,
          productId: attrs.product_id.toString(),
          status,
        },
      };
    }

    throw new Error(
      `Unsupported LemonSqueezy payload type: ${(parsed.data as any).type}`,
    );
  },
};
