import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  TAppRegistry,
  RegistryWorkerAccount,
  PaymentEvent,
  TApp,
  ListOfPaymentEvents,
} from "@regarde-dev/core";
import { Loaded, co } from "jazz-tools";

type AppsRecord = TAppRegistry["apps"];

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
  if (!signature) {
    console.error("[Webhook Signature ERROR] Signature is null or undefined");
    return false;
  }

  try {
    const hmac = createHmac("sha256", secret);
    hmac.update(body);
    const expectedSignature = hmac.digest("hex");

    console.log("[Webhook Signature DEBUG] Computing signature from body");
    console.log(
      `[Webhook Signature DEBUG] Expected signature: ${expectedSignature}`,
    );
    console.log(`[Webhook Signature DEBUG] Received signature: ${signature}`);

    const digest = Buffer.from(expectedSignature, "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (digest.length !== signatureBuffer.length) {
      console.error(
        `[Webhook Signature ERROR] Length mismatch: expected ${digest.length}, got ${signatureBuffer.length}`,
      );
      return false;
    }

    const result = timingSafeEqual(digest, signatureBuffer);
    console.log(
      `[Webhook Signature DEBUG] Signature verification result: ${result}`,
    );
    return result;
  } catch (error) {
    console.error(
      "[Webhook Signature ERROR] Signature verification error:",
      error,
    );
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
      console.log("[Webhook] START - Received request");

      // Log ALL headers immediately to see what LemonSqueezy is sending
      console.log("[Webhook] ===== ALL HEADERS =====");
      const allHeaders = c.req.header();
      console.dir(allHeaders, { depth: null, colors: false });
      console.log("[Webhook] ===== END HEADERS =====");

      console.log("[Webhook] ===== HTTP REQUEST DETAILS =====");
      console.log(`[Webhook] Request method: ${c.req.method}`);
      console.log(`[Webhook] Request path: ${c.req.path}`);
      console.log(`[Webhook] Content-Type: ${c.req.header("content-type")}`);
      console.log("[Webhook] ===== END HTTP REQUEST DETAILS =====");

      const appId = c.req.param("appId") as string;
      console.log(`[Webhook] Extracted appId: ${appId}`);
      if (!appId) {
        console.log("[Webhook] ERROR - Missing App ID");
        return c.json({ error: "Missing App ID" }, 400);
      }

      // 1. Get the App (appsRecord is a record of App CoValues)
      console.log(
        `[Webhook] Looking up app in appsRecord with appId: ${appId}`,
      );
      console.log("[Webhook] appsRecord type:", typeof appsRecord);
      console.log("[Webhook] appsRecord keys:", Object.keys(appsRecord));
      const appRef = (appsRecord as any)[appId] as TApp | undefined;
      console.log("[Webhook] appRef found:", !!appRef);
      if (appRef) {
        console.log("[Webhook] appRef type:", typeof appRef);
        console.log("[Webhook] appRef.$jazz.id:", appRef.$jazz?.id);
      }
      if (!appRef) {
        console.log(`[Webhook] ERROR - App not found: ${appId}`);
        console.log("[Webhook] Available app IDs:", Object.keys(appsRecord));
        return c.json({ error: "App not found" }, 404);
      }

      // 2. Load App with payments
      console.log(`[Webhook] Loading app with payments`);
      const app = await appRef.$jazz.ensureLoaded({
        resolve: {
          payments: {
            all: { $each: true },
            byUser: true,
          },
        },
      });
      console.log(`[Webhook] App loaded: ${app.$jazz.id}`);

      const secretValid =
        typeof app.webhookSecret === "string" && app.webhookSecret !== "";
      if (secretValid === false) {
        console.log("[Webhook] ERROR - App webhookSecret is missing");
        return c.json({ error: "App webhookSecret is missing" }, 500);
      }

      const payments = app.payments;

      // 3. Verify Signature
      const secret = app.webhookSecret;

      console.log("[Webhook] ===== SIGNATURE HEADER DETAILS =====");
      const signatureX = c.req.header("X-Signature");
      const signaturex = c.req.header("x-signature");
      console.log(
        `[Webhook] X-Signature header: ${signatureX ? "PRESENT" : "MISSING"}`,
      );
      console.log(
        `[Webhook] x-signature header: ${signaturex ? "PRESENT" : "MISSING"}`,
      );
      if (signatureX) console.log(`[Webhook] X-Signature value: ${signatureX}`);
      if (signaturex) console.log(`[Webhook] x-signature value: ${signaturex}`);
      console.log("[Webhook] ===== END SIGNATURE HEADER DETAILS =====");

      const signature = signatureX || signaturex || null;
      console.log(
        `[Webhook] Using signature: ${signature ? "present" : "MISSING"}`,
      );
      if (!signature) {
        console.log(
          "[Webhook] ERROR - Both X-Signature and x-signature headers are missing",
        );
        console.log("[Webhook] Available headers:", c.req.header());
      }

      const rawBody = await c.req.text();
      console.log(`[Webhook] ===== RAW BODY =====`);
      console.log(`[Webhook] Raw body length: ${rawBody.length} characters`);
      console.log(`[Webhook] Raw body content:`);
      console.log(rawBody);
      console.log(`[Webhook] ===== END RAW BODY =====`);

      const signatureValid = verifyLemonSqueezySignature(
        secret,
        rawBody,
        signature,
      );
      console.log(`[Webhook] Signature verification result: ${signatureValid}`);
      if (!signatureValid) {
        return c.json({ error: "Invalid Signature" }, 401);
      }

      // 4. Parse & Standardize
      console.log("[Webhook] ===== PARSING PAYLOAD =====");
      console.log("[Webhook] Parsing JSON payload");
      const json = JSON.parse(rawBody);
      console.log("[Webhook] JSON parsed successfully");
      console.log("[Webhook] ===== PARSED JSON STRUCTURE =====");
      console.dir(json, { depth: null, colors: false });
      console.log("[Webhook] ===== END PARSED JSON STRUCTURE =====");

      console.log("[Webhook] Validating payload schema");
      let parsed;
      try {
        parsed = LemonSqueezyPayloadSchema.parse(json);
        console.log(
          `[Webhook] Payload validated. Event: ${parsed.meta.event_name}, Type: ${parsed.data.type}`,
        );
      } catch (schemaError: any) {
        console.error("[Webhook] ===== SCHEMA VALIDATION ERROR =====");
        console.error("[Webhook] Schema validation failed:", schemaError);
        console.error("[Webhook] Zod error:", {
          errors: schemaError.errors,
          issues: schemaError.issues,
        });
        console.error("[Webhook] ===== END SCHEMA VALIDATION ERROR =====");
        throw schemaError;
      }
      console.log("[Webhook] ===== PARSED PAYLOAD =====");
      console.dir(parsed, { depth: null, colors: false });
      console.log("[Webhook] ===== END PARSED PAYLOAD =====");

      const command = standardizeLemonSqueezy(parsed);

      console.log(
        `[Webhook] Received ${parsed.meta.event_name} for App ${appId}:`,
        command,
      );
      console.log("[Webhook] ===== END PARSING PAYLOAD =====");

      // 5. Get Jazz Account ID
      console.log("[Webhook] Extracting Jazz account ID from custom_data");
      let jazzAccountId = parsed.meta.custom_data?.user_id;
      if (typeof jazzAccountId !== "string") jazzAccountId = undefined;
      console.log(`[Webhook] Jazz account ID: ${jazzAccountId || "NOT FOUND"}`);

      if (!jazzAccountId) {
        console.log(
          "[Webhook] ERROR - Jazz account ID is required in custom_data.user_id",
        );
        return c.json(
          { error: "Jazz account ID is required in custom_data.user_id" },
          400,
        );
      }

      console.log("[Webhook] Loading registry profile worker group");
      const registryProfileWorkerGroup = await co
        .group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", { loadAs: worker });

      if (!registryProfileWorkerGroup.$isLoaded) {
        console.log("[Webhook] ERROR - Failed to load registry group");
        return c.json({ error: "Failed to load registry group" }, 500);
      }
      console.log("[Webhook] Registry group loaded");

      console.log("[Webhook] Loading worker root processedProviderEvents");
      const workerRoot = await worker.$jazz.ensureLoaded({
        resolve: {
          root: {
            processedProviderEvents: true,
          },
        },
      });

      const processedProviderEvents = workerRoot.root.processedProviderEvents;
      const processedProviderEventsLoaded =
        processedProviderEvents !== null &&
        processedProviderEvents !== undefined &&
        processedProviderEvents.$isLoaded === true;
      if (processedProviderEventsLoaded === false) {
        console.log(
          "[Webhook] ERROR - processedProviderEvents not available on worker root",
        );
        return c.json(
          { error: "processedProviderEvents not available on worker root" },
          500,
        );
      }

      const processedKey = `${appId}:lemonsqueezy:${command.providerEventId}`;
      console.log(`[Webhook] Checking for duplicate event: ${processedKey}`);
      const alreadyProcessed =
        processedProviderEvents.$jazz.has(processedKey) === true;
      if (alreadyProcessed === true) {
        console.log(`[Webhook] Duplicate event detected: ${processedKey}`);
        return c.json({ received: true, duplicate: true }, 200);
      }

      console.log(`[Webhook] Marking event as processed: ${processedKey}`);
      processedProviderEvents.$jazz.set(processedKey, Date.now());
      await processedProviderEvents.$jazz.waitForSync();
      console.log("[Webhook] Event marked as processed and synced");

      // 6. Duplicate detection is handled via worker.root.processedProviderEvents

      // 7. Create PaymentEvent owned by worker for security
      console.log("[Webhook] Creating PaymentEvent");
      const event = PaymentEvent.create(
        {
          amount: command.amount,
          currency: command.currency,
          timestamp: command.timestamp,
          paymentStatus: command.status,
          userAccount: jazzAccountId,
          app: appId,
          metadata: {
            ...command.metadata,
            providerEventId: command.providerEventId,
          } as any,
        },
        { owner: registryProfileWorkerGroup },
      );
      console.log(`[Webhook] PaymentEvent created: ${event.$jazz.id}`);

      // 8. Append to App payments (all)
      const allPayments = payments.all;
      const allPaymentsReady =
        allPayments !== null && allPayments.$isLoaded === true;
      if (allPaymentsReady === false) {
        console.log("[Webhook] ERROR - App payments list not loaded");
        return c.json({ error: "App payments list not loaded" }, 500);
      }

      console.log("[Webhook] Appending PaymentEvent to app.payments.all");
      allPayments.$jazz.push(event);
      await allPayments.$jazz.waitForSync();
      console.log("[Webhook] PaymentEvent appended to all payments");

      // 9. Append to App payments (byUser)
      const byUser = payments.byUser;
      const byUserReady = byUser !== null && byUser.$isLoaded === true;
      if (byUserReady === false) {
        console.warn("[Webhook] Warning: app.payments.byUser is not loaded.");
      } else {
        const existingUserList = byUser[jazzAccountId] ?? null;
        const existingUserListLoaded =
          existingUserList !== null && existingUserList.$isLoaded === true;

        if (existingUserListLoaded === true) {
          console.log(
            `[Webhook] Appending to existing user list: ${jazzAccountId}`,
          );
          existingUserList.$jazz.push(event);
          await existingUserList.$jazz.waitForSync();
          console.log(`[Webhook] Indexed payment for user ${jazzAccountId}`);
        } else {
          console.log(`[Webhook] Creating new user list: ${jazzAccountId}`);
          const newUserList = ListOfPaymentEvents.create([event], {
            owner: registryProfileWorkerGroup,
          });
          byUser.$jazz.set(jazzAccountId, newUserList);
          await byUser.$jazz.waitForSync();
          console.log(`[Webhook] Indexed payment for user ${jazzAccountId}`);
        }
      }

      console.log(`[Webhook] Payment processed for App ${app.$jazz.id}`);
      console.log("[Webhook] END - Request completed successfully");

      return c.json({ received: true }, 200);
    } catch (error: any) {
      console.error(
        "[ERROR] Failed to process payment event. Fix by: (1) Checking webhook signature validity, (2) Verifying user account exists, (3) Confirming app configuration",
        error,
      );
      console.error("[ERROR] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return c.json({ error: error.message || "Internal Server Error" }, 500);
    }
  };
};
