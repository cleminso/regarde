import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  AppRegistry,
  RegistryWorkerAccount,
  RegistryAppMetadata,
} from "@regarde-dev/sdk/registry";
import { PaymentEvent } from "@regarde-dev/sdk/payments";
import { Loaded, co } from "jazz-tools";

type AppsRecord = AppRegistry["apps"];

// ----------------------------------------------------------------------
// 1. Source Schemas (Lemon Squeezy Webhook Payload)
// ----------------------------------------------------------------------

const MetaSchema = z.object({
  event_name: z.string(),
  custom_data: z.record(z.string(), z.any()).optional(),
  test_mode: z.boolean().optional(),
});

/**
 * Schema for "Order" events (one-time purchases)
 * Events: order_created, order_refunded, etc.
 */
const OrderSchema = z.object({
  meta: MetaSchema,
  data: z.object({
    type: z.literal("orders"),
    id: z.string(),
    attributes: z.object({
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

/**
 * Schema for "Subscription" events (state changes)
 * Events: subscription_created, subscription_cancelled, subscription_updated, etc.
 */
const SubscriptionSchema = z.object({
  meta: MetaSchema,
  data: z.object({
    type: z.literal("subscriptions"),
    id: z.string(),
    attributes: z.object({
      user_email: z.email(),
      status: z.string(), // active, past_due, unpaid, cancelled, expired, etc.
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

/**
 * Schema for "Subscription Invoice" events (recurring payments)
 * Events: subscription_payment_success, subscription_payment_failed, subscription_payment_recovered
 */
const SubscriptionInvoiceSchema = z.object({
  meta: MetaSchema,
  data: z.object({
    type: z.literal("subscription-invoices"),
    id: z.string(),
    attributes: z.object({
      user_email: z.email(),
      total: z.number(),
      currency: z.string(),
      status: z.string(), // paid, void, pending, refund
      created_at: z.iso.datetime(),
      updated_at: z.iso.datetime(),
      billing_reason: z.string(), // initial, renewal, update
      urls: z
        .object({
          invoice_url: z.url().optional(),
        })
        .optional(),
    }),
  }),
});

// Discriminated Union via 'type' inside 'data' would be better if Zod supported deep discrimination easily,
// but for now, we just union them. Zod will try each.
export const LemonSqueezyPayloadSchema = z.union([
  OrderSchema,
  SubscriptionSchema,
  SubscriptionInvoiceSchema,
]);

export type TLemonSqueezyPayload = z.infer<typeof LemonSqueezyPayloadSchema>;

// ----------------------------------------------------------------------
// 2. Verification Utility
// ----------------------------------------------------------------------

export const verifyLemonSqueezySignature = (
  secret: string,
  body: string,
  signature: string | null,
): boolean => {
  if (!signature) return false;

  try {
    const hmac = createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(body).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (digest.length !== signatureBuffer.length) return false;

    return timingSafeEqual(digest, signatureBuffer);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
};

// ----------------------------------------------------------------------
// 3. Adapter (Standardization)
// ----------------------------------------------------------------------

export interface StandardPaymentCommand {
  provider: "lemonsqueezy";
  providerEventId: string;
  email: string;
  amount: string;
  currency: string;
  status: "completed" | "pending" | "failed" | "cancelled";
  timestamp: number;
  productName: string;
  metadata: Record<string, string>;
}

export const standardizeLemonSqueezy = (
  payload: TLemonSqueezyPayload,
): StandardPaymentCommand => {
  const { event_name, test_mode } = payload.meta;

  let status: StandardPaymentCommand["status"] = "pending";
  let amount = "0";
  let currency = "USD";
  let productName = "Unknown Product";
  let providerEventId = payload.data.id;
  let email = "";
  let metadata: Record<string, string> = {
    eventName: event_name,
    testMode: test_mode ? "true" : "false",
  };
  let timestamp = Date.now();

  // 1. ORDERS
  if (payload.data.type === "orders") {
    const attrs = payload.data.attributes;
    email = attrs.user_email;
    amount = attrs.total.toString();
    currency = attrs.currency;
    timestamp = new Date(attrs.created_at).getTime();
    productName = attrs.first_order_item.product_name;

    metadata.orderNumber = attrs.order_number.toString();
    if (attrs.urls?.receipt) metadata.receiptUrl = attrs.urls.receipt;

    if (attrs.status === "paid") status = "completed";
    if (attrs.status === "failed") status = "failed";
    if (attrs.status === "refunded") status = "cancelled";
  }

  // 2. SUBSCRIPTIONS (State Changes)
  else if (payload.data.type === "subscriptions") {
    const attrs = payload.data.attributes;
    email = attrs.user_email;
    amount = "0";
    currency = "USD";
    timestamp = new Date(attrs.created_at).getTime();
    productName = attrs.product_name;

    if (attrs.status === "active")
      status = "completed"; // Active sub = access granted
    else if (attrs.status === "cancelled") status = "cancelled";
    else if (attrs.status === "expired") status = "cancelled";
    else if (attrs.status === "past_due") status = "failed";
    else status = "pending";
  }

  // 3. SUBSCRIPTION INVOICES (Recurring Payments)
  else if (payload.data.type === "subscription-invoices") {
    const attrs = payload.data.attributes;
    email = attrs.user_email;
    amount = attrs.total.toString();
    currency = attrs.currency;
    timestamp = new Date(attrs.created_at).getTime();
    productName = "Subscription Renewal";
    metadata.billingReason = attrs.billing_reason;

    if (attrs.status === "paid") status = "completed";
    if (attrs.status === "void") status = "cancelled";
    if (attrs.status === "refund") status = "cancelled";
  }

  return {
    provider: "lemonsqueezy",
    providerEventId,
    email,
    amount,
    currency,
    status,
    timestamp,
    productName,
    metadata,
  };
};

// ----------------------------------------------------------------------
// 4. Handler
// ----------------------------------------------------------------------

export const lemonSqueezyWebhookHandler = (
  appsRecord: AppsRecord,
  worker: Loaded<typeof RegistryWorkerAccount>,
) => {
  return async (c: any) => {
    try {
      const appId = c.req.param("appId") as string;
      if (!appId) {
        return c.json({ error: "Missing App ID" }, 400);
      }

      // 1. Get the App Metadata
      const appMetadata = (appsRecord as any)[appId] as
        | RegistryAppMetadata
        | undefined;
      if (!appMetadata) {
        console.log(`[Webhook] App not found: ${appId}`);
        return c.json({ error: "App not found" }, 404);
      }

      // 2. Load App with payments
      const app = await (appMetadata as any).$jazz
        .resolve({ app: true })
        .then((m: any) => m.app);
      if (!app) {
        return c.json({ error: "App data unavailable" }, 500);
      }

      await app.$jazz.ensureLoaded({
        payments: true,
      });

      // 3. Verify Signature
      const secret = app.webhookSecret;
      const signature = c.req.header("x-signature") || null;
      const rawBody = await c.req.text();

      if (!verifyLemonSqueezySignature(secret, rawBody, signature)) {
        return c.json({ error: "Invalid Signature" }, 401);
      }

      // 4. Parse & Standardize
      const json = JSON.parse(rawBody);
      const parsed = LemonSqueezyPayloadSchema.parse(json);
      const command = standardizeLemonSqueezy(parsed);

      console.log(
        `[Webhook] Received ${parsed.meta.event_name} for App ${appId}:`,
        command,
      );

      // 5. Get User Account ID
      let userAccountId = parsed.meta.custom_data?.user_id;
      if (typeof userAccountId !== "string") userAccountId = undefined;

      if (!userAccountId) {
        return c.json(
          { error: "User account ID is required in custom_data.user_id" },
          400,
        );
      }

      const registryProfileWorkerGroup = await co
        .group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", { loadAs: worker });

      if (!registryProfileWorkerGroup.$isLoaded) {
        return c.json({ error: "Failed to load registry group" }, 500);
      }

      // 6. Check for duplicate events (same providerEventId)
      const payments = (app as any).payments;
      if (payments && payments.$isLoaded && payments.length > 0) {
        const duplicate = Array.from(payments.all).find(
          (payment: any) =>
            payment.$isLoaded &&
            payment.metadata.providerEventId === command.providerEventId,
        );

        if (duplicate) {
          console.log(
            `[Webhook] Duplicate event detected: ${command.providerEventId}`,
          );
          return c.json({ received: true, duplicate: true }, 200);
        }
      }

      // 7. Create PaymentEvent owned by worker for security
      const event = PaymentEvent.create(
        {
          amount: command.amount,
          currency: command.currency,
          timestamp: command.timestamp,
          paymentStatus: command.status,
          userAccount: userAccountId,
          app, // App reference already resolved
          metadata: {
            ...command.metadata,
            providerEventId: command.providerEventId,
          } as any,
        },
        { owner: registryProfileWorkerGroup },
      );

      // 8. Append to Global Payments Feed (single source of truth)
      app.payments.$jazz.push(event);

      // 9. Add reference to paymentsByUser index (not a copy)
      if (!app.paymentsByUser) {
        console.warn("[Webhook] Warning: app.paymentsByUser is undefined.");
      } else {
        // Store reference to the PaymentEvent (not a new copy)
        app.paymentsByUser.$jazz.set(userAccountId, event);
        console.log(`[Webhook] Indexed payment for user ${userAccountId}`);
      }

      console.log(`[Webhook] Payment processed for App ${app.$jazz.id}`);

      return c.json({ received: true }, 200);
    } catch (error: any) {
      console.error(
        "[ERROR] Failed to process payment event. Fix by: (1) Checking webhook signature validity, (2) Verifying user account exists, (3) Confirming app configuration",
        error,
      );
      return c.json({ error: error.message || "Internal Server Error" }, 500);
    }
  };
};
