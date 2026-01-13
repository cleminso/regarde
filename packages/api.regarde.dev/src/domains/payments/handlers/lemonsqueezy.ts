import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  RegistryWorkerAccount,
  PaymentEvent,
  TApp,
  ListOfPaymentEvents,
  App,
  RegardeSDK,
  TPaymentSchema,
  PaymentSchema,
  AppPaymentsSchema,
  TRegistryWorkerAccountRoot,
} from "@regarde-dev/core";
import { Account, Group, ID, Loaded, co } from "jazz-tools";

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
      identifier: z.string(),
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
      identifier: z.string(),
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

    const digest = Buffer.from(expectedSignature, "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (digest.length !== signatureBuffer.length) {
      console.error(
        `[Webhook Signature ERROR] Length mismatch: expected ${digest.length}, got ${signatureBuffer.length}`,
      );
      return false;
    }

    const result = timingSafeEqual(digest, signatureBuffer);
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
  prefixedProviderEventUUID: string;
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
  let email = "";
  let prefixedProviderEventUUID = "";
  let metadata: Record<string, string> = {
    eventName: event_name,
    testMode: test_mode ? "true" : "false",
  };
  let timestamp = Date.now();

  // 1. ORDERS
  if (payload.data.type === "orders") {
    const attrs = payload.data.attributes;
    email = attrs.user_email;
    prefixedProviderEventUUID = attrs.identifier;
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
    prefixedProviderEventUUID = attrs.identifier;
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
    prefixedProviderEventUUID = attrs.identifier;
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
    prefixedProviderEventUUID,
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
  worker: Loaded<typeof RegistryWorkerAccount>,
) => {
  return async (c: any) => {
    try {
      const workerId = process.env.REGARDE_REGISTRY_WORKER;
      if (!workerId) {
        throw new Error(
          "[ERROR] Missing required environment variable: REGARDE_REGISTRY_WORKER. Please check your .env file.",
        );
      }
      console.log("[WEBHOOK DEBUG] Request received, parsing body...");
      // Capture original state for signature verification by extracting headers, raw body, method, path, content-type
      const rawBody = await c.req.text();
      const json = JSON.parse(rawBody);

      let parsed;
      try {
        parsed = LemonSqueezyPayloadSchema.parse(json);
        console.log(
          "[WEBHOOK DEBUG] Schema validated, custom_data:",
          parsed.meta.custom_data,
        );
      } catch (schemaError: any) {
        console.error("[Webhook] Schema validation failed:", schemaError);
        throw schemaError;
      }
      // Need context: which app, which user, which SDK
      // Webhook url must include thoses data that user create `App` placeholder in account `paymentsByAp`
      let jazzAccountId = parsed.meta.custom_data?.user_id;
      if (typeof jazzAccountId !== "string") jazzAccountId = undefined;

      let regardeSDKId = parsed.meta.custom_data?.regarde_sdk_id;
      if (typeof regardeSDKId !== "string") regardeSDKId = undefined;

      const appId = parsed.meta.custom_data?.app_id as ID<Account>;
      console.log(
        "[WEBHOOK DEBUG] Extracted IDs - jazzAccountId:",
        jazzAccountId,
        "regardeSDKId:",
        regardeSDKId,
        "appId:",
        appId,
      );

      if (!appId) {
        return c.json({ error: "Missing App ID" }, 400);
      }

      // Need App configuration so load `App` and ensureLoaded `payments` structures
      console.log("[WEBHOOK DEBUG] Loading App:", appId);
      const appRef = await App.load(appId, {
        resolve: {
          payments: {
            all: true,
            byUser: true,
          },
        },
      });
      console.log("[WEBHOOK DEBUG] App loaded, $jazz.id:", appRef.$jazz.id);

      if (!appRef.$jazz.id) {
        return c.json({ error: "App not found" }, 404);
      }

      // 2. Load App with payments
      console.log("[WEBHOOK DEBUG] Calling ensureLoaded on App payments...");
      const app = await (appRef as TApp).$jazz.ensureLoaded({
        resolve: {
          payments: {
            all: true,
            byUser: true,
          },
        },
      });
      console.log("[WEBHOOK DEBUG] App payments loaded");

      // Ensure request come from Lemon Squeezy
      const secretValid =
        typeof app.webhookSecret === "string" && app.webhookSecret !== "";
      if (secretValid === false) {
        return c.json({ error: "App webhookSecret is missing" }, 500);
      }

      const secret = app.webhookSecret;

      const signatureX = c.req.header("X-Signature");
      const signaturex = c.req.header("x-signature");
      const signature = signatureX || signaturex || null;

      const signatureValid = verifyLemonSqueezySignature(
        secret,
        rawBody,
        signature,
      );
      if (!signatureValid) {
        return c.json({ error: "Invalid Signature" }, 401);
      }

      // Convert LemonSqueezy event type to unified format
      const command = standardizeLemonSqueezy(parsed);

      //  Need to link payment to user `RegardeSDK` so need RegardeSDK CoValueId to update user's payment history
      if (!regardeSDKId) {
        return c.json(
          { error: "RegardeSDK ID is required in custom_data.regarde_sdk_id" },
          400,
        );
      }

      // Need group for creating `PaymentEvent` CoValue by sharing ownership for `paymentEvents`
      console.log("[WEBHOOK DEBUG] Loading registry profile worker group...");
      const registryProfileWorkerGroup = await co.group().load(workerId, {
        loadAs: worker,
      });
      console.log("[WEBHOOK DEBUG] Registry profile worker group loaded");

      if (!registryProfileWorkerGroup.$isLoaded) {
        return c.json({ error: "Failed to load registry group" }, 500);
      }

      console.log(
        "[WEBHOOK DEBUG] Using pre-loaded processedProviderEvents from worker root",
      );
      const workerRoot = worker.root as TRegistryWorkerAccountRoot;

      console.log("[WEBHOOK DEBUG] Worker root ready");

      // Need to check for duplicate webhook deliveries  against worker deduplication records of processed event IDs
      const processedProviderEvents = workerRoot.processedProviderEvents;
      const processedProviderEventsLoaded =
        processedProviderEvents !== null &&
        processedProviderEvents !== undefined &&
        processedProviderEvents.$isLoaded === true;
      if (processedProviderEventsLoaded === false) {
        return c.json(
          { error: "processedProviderEvents not available on worker root" },
          500,
        );
      }

      // If event is not in records create `PaymentEvent` and set it into records
      const prefixedProviderEventUUID = `LS_${parsed.data.attributes.identifier}`;
      console.log(
        "[WEBHOOK DEBUG] Prefixed UUID:",
        prefixedProviderEventUUID,
        "Checking if already processed...",
      );

      let event: co.loaded<typeof PaymentEvent>;

      if (processedProviderEvents[prefixedProviderEventUUID]) {
        console.log(
          "[WEBHOOK DEBUG] Event already processed, loading existing PaymentEvent:",
          processedProviderEvents[prefixedProviderEventUUID],
        );
        event = (await PaymentEvent.load(
          processedProviderEvents[prefixedProviderEventUUID],
          {
            loadAs: worker,
          },
        )) as co.loaded<typeof PaymentEvent>;
        console.log("[WEBHOOK DEBUG] Existing PaymentEvent loaded");
      } else {
        console.log("[WEBHOOK DEBUG] Creating new PaymentEvent...");

        const userAccount = await co.account().load(jazzAccountId);

        if (!userAccount.$isLoaded)
          return c.json({ error: "easy peasy lemon squeezy" }, 500);

        // Create with worker being owner
        const paymentOwnerGroup = Group.create();
        // Assign registry worker as admin
        paymentOwnerGroup.addMember(registryProfileWorkerGroup, "admin");
        paymentOwnerGroup.addMember(userAccount, "reader");
        paymentOwnerGroup.addMember(app.$jazz.owner, "reader");

        event = PaymentEvent.create(
          {
            amount: command.amount,
            prefixedProviderEventUUID: command.prefixedProviderEventUUID,
            currency: command.currency,
            timestamp: command.timestamp,
            paymentStatus: command.status,
            userAccount: jazzAccountId,
            app: appId,
            metadata: {
              ...command.metadata,
            },
          },
          { owner: paymentOwnerGroup },
        );
        console.log("[WEBHOOK DEBUG] PaymentEvent created:", event.$jazz.id);

        console.log("[WEBHOOK DEBUG] Waiting for PaymentEvent sync...");
        await event.$jazz.waitForSync();

        console.log("[WEBHOOK DEBUG] Setting in processedProviderEvents...");
        processedProviderEvents.$jazz.set(
          prefixedProviderEventUUID,
          event.$jazz.id,
        );
        await processedProviderEvents.$jazz.waitForSync();
        console.log("[WEBHOOK DEBUG] PaymentEvent processed and synced");
      }

      console.log("[WEBHOOK DEBUG] Loading user RegardeSDK:", regardeSDKId);
      const userSDK = await RegardeSDK.load(regardeSDKId, {
        loadAs: worker,
        resolve: {
          myPayments: {
            all: { $each: true },
            byApp: { $each: true },
          },
        },
      });

      const userSDKLoaded = userSDK.$isLoaded === true;
      console.log("[WEBHOOK DEBUG] RegardeSDK loaded?", userSDKLoaded);
      if (userSDKLoaded === false) {
        return c.json({ error: "Failed to load user RegardeSDK" }, 500);
      }

      // User Payments
      console.log("[WEBHOOK DEBUG] Ensuring myPayments loaded...");
      const { myPayments: userPayments } = await userSDK.$jazz.ensureLoaded({
        resolve: {
          myPayments: {
            all: { $each: true },
            byApp: true,
          },
        },
      });
      console.log("[WEBHOOK DEBUG] MyPayments loaded");

      if (userPayments.all.$jazz.has(prefixedProviderEventUUID) === false) {
        console.log("[WEBHOOK DEBUG] Setting in userPayments.all");
        userPayments.all.$jazz.set(prefixedProviderEventUUID, event.$jazz.id);
        await userPayments.$jazz.waitForSync();
      }

      if (userPayments.byApp.$jazz.has(app.$jazz.id) === false) {
        userPayments.byApp.$jazz.set(app.$jazz.id, {
          prefixedProviderEventUUID: event.$jazz.id,
        });
      } else if (
        userPayments.byApp[app.$jazz.id].$jazz.has(
          prefixedProviderEventUUID,
        ) === false
      ) {
        console.log("[WEBHOOK DEBUG] Setting in userPayments.byApp");
        userPayments.byApp[app.$jazz.id].$jazz.set(
          prefixedProviderEventUUID,
          event.$jazz.id,
        );
        await userPayments.$jazz.waitForSync();
      }
      // End user payments

      // App Payments
      console.log("[WEBHOOK DEBUG] Loading app payments...");
      const appPayments = await app.payments.$jazz.ensureLoaded({
        resolve: {
          all: { $each: true },
          byUser: true,
        },
      });
      const appPaymentsByUser = await appPayments.byUser.$jazz.ensureLoaded({
        resolve: {
          $each: true,
        },
      });

      console.log("[WEBHOOK DEBUG] App payments loaded");

      if (appPayments.all.$jazz.has(prefixedProviderEventUUID) === false) {
        console.log("[WEBHOOK DEBUG] Setting in appPayments.all");
        appPayments.all.$jazz.set(prefixedProviderEventUUID, event.$jazz.id);
        await app.$jazz.waitForSync();
      }

      if (appPaymentsByUser.$jazz.has(jazzAccountId) === false) {
        console.log("[WEBHOOK DEBUG] Setting in appPayments.byUser");
        appPaymentsByUser.$jazz.set(jazzAccountId, {
          [prefixedProviderEventUUID]: event.$jazz.id,
        });
        await app.$jazz.waitForSync();
      } else if (
        appPaymentsByUser[jazzAccountId].$jazz.has(
          prefixedProviderEventUUID,
        ) === false
      ) {
        console.log("[WEBHOOK DEBUG] Setting in appPayments.byUser");
        appPaymentsByUser[jazzAccountId].$jazz.set(
          prefixedProviderEventUUID,
          event.$jazz.id,
        );
        await app.$jazz.waitForSync();
      }

      console.log(
        "[WEBHOOK DEBUG] Webhook processing complete, returning success",
      );
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
