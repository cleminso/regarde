import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  RegistryWorkerAccount,
  PaymentEvent,
  TApp,
  App,
  RegardeSDK,
  TRegistryWorkerAccountRoot,
  useLogging,
} from "@regarde-dev/core";
import { Account, Group, ID, Loaded, co } from "jazz-tools";

const logger = useLogging({
  module: __filename,
});

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
    return false;
  }

  const hmac = createHmac("sha256", secret);
  hmac.update(body);
  const expectedSignature = hmac.digest("hex");

  const digest = Buffer.from(expectedSignature, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (digest.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(digest, signatureBuffer);
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
      const workerId = process.env.REGARDE_REGISTRY_GROUP;
      if (!workerId) {
        logger.debug({
          message: "Starting webhook handler, checking registry group",
          data: { workerId },
        });
        throw new Error(
          "Missing `REGARDE_REGISTRY_GROUP` required environment variable",
        );
      }

      // Capture original state for signature verification by extracting headers, raw body, method, path, content-type
      const rawBody = await c.req.text();
      const json = JSON.parse(rawBody);

      let parsed;
      parsed = LemonSqueezyPayloadSchema.parse(json);

      // Need context: which app, which user, which SDK
      // Webhook url must include thoses data that user create `App` placeholder in account `paymentsByAp`
      let jazzAccountId = parsed.meta.custom_data?.user_id;
      if (typeof jazzAccountId !== "string") jazzAccountId = undefined;

      let regardeSDKId = parsed.meta.custom_data?.regarde_sdk_id;
      if (typeof regardeSDKId !== "string") regardeSDKId = undefined;

      const appId = parsed.meta.custom_data?.app_id as ID<Account>;
      const isAppIdValid =
        appId !== null && appId !== undefined && appId !== "";
      if (isAppIdValid === false) {
        logger.error({
          message: "Missing App ID in custom_data",
          data: {
            appId,
            customData: parsed.meta.custom_data,
          },
        });
        return c.json({ error: "Missing App ID from custom_data" }, 400);
      }

      const appRef = await App.load(appId, {
        resolve: {
          payments: {
            all: true,
            byUser: true,
          },
        },
      });
      // TODO: after load id
      // (1) sync doesnt work - hard pit if jazz connection is well establish
      // (2) doesn't have permissions to load - what's happen if I dont have? if crash I need a try catch; what if it's empty?
      // (3) is the webhook correspond to App

      if (!appRef.$jazz.id) {
        logger.error({
          message: "App not found or failed to load",
          data: {
            appId,
            jazzAccountId,
            regardeSDKId,
          },
        });
        return c.json({ error: "App not found" }, 404);
      }

      const app = await (appRef as TApp).$jazz.ensureLoaded({
        resolve: {
          payments: {
            all: true,
            byUser: true,
          },
        },
      });

      // Ensure request come from Lemon Squeezy
      const isSecretValid =
        typeof app.webhookSecret === "string" && app.webhookSecret !== "";
      if (isSecretValid === false) {
        logger.error({
          message: "App webhookSecret is missing",
          data: {
            appId,
            webhookSecretType: typeof app.webhookSecret,
          },
        });
        return c.json({ error: "App webhookSecret is missing" }, 500);
      }

      const secret = app.webhookSecret;

      const signatureX = c.req.header("X-Signature");
      const signaturex = c.req.header("x-signature");
      const signature = signatureX || signaturex || null;

      const isSignatureValid = verifyLemonSqueezySignature(
        secret,
        rawBody,
        signature,
      );
      if (!isSignatureValid) {
        logger.error({
          message: "Invalid webhook signature - review misconfiguration",
          data: {
            appId,
            isSignaturePresent: signature !== null,
            signatureLength: signature?.length,
          },
        });
        return c.json({ error: "Invalid Signature" }, 401);
      }

      // Convert LemonSqueezy event type to unified format
      const command = standardizeLemonSqueezy(parsed);

      //  Need to link payment to user `RegardeSDK` so need RegardeSDK CoValueId to update user's payment history
      const isRegardeSDKIdValid =
        regardeSDKId !== undefined && regardeSDKId !== "";
      if (isRegardeSDKIdValid === false) {
        logger.error({
          message: "RegardeSDK ID is required in custom_data.regarde_sdk_id",
          data: {
            appId, // which app configuration is broken?
            jazzAccountId, // which user account is involved?
            customData: parsed.meta.custom_data, // what did Lemon Squeezy actually send?
          },
        });
        return c.json(
          { error: "RegardeSDK ID is required in custom_data.regarde_sdk_id" },
          400,
        );
      }

      // Need group for creating `PaymentEvent` CoValue by sharing ownership for `paymentEvents`
      const registryProfileWorkerGroup = await co.group().load(workerId, {
        loadAs: worker,
      });

      const isGroupLoaded = registryProfileWorkerGroup.$isLoaded === true;
      if (isGroupLoaded === false) {
        logger.error({
          message: "Failed to load registryProfileWorkerGroup",
          data: {
            workerId,
            workerAccountId: worker.$jazz.id, // Which worker is trying to load?
            appId,
          },
        });
        return c.json(
          { error: "Failed to load registryProfileWorkerGroup" },
          500,
        );
      }

      const workerRoot = worker.root as TRegistryWorkerAccountRoot;

      // Need to check for duplicate webhook deliveries  against worker deduplication records of processed event IDs
      const processedProviderEvents = workerRoot.processedProviderEvents;
      const isProcessedProviderEventsLoaded =
        processedProviderEvents !== null &&
        processedProviderEvents !== undefined &&
        processedProviderEvents.$isLoaded === true;
      if (isProcessedProviderEventsLoaded === false) {
        logger.error({
          message: "Failed to load processedProviderEvents from worker root",
          data: {
            workerJazzId: worker.$jazz.id, // which worker has the broken root
            workerId, // which registry group
            appId,
            processedProviderEventsPresent: processedProviderEvents !== null,
            processedProviderEventsIsLoaded: processedProviderEvents.$isLoaded,
          },
        });
        return c.json(
          { error: "processedProviderEvents not available on worker root" },
          500,
        );
      }

      // If event is not in records create `PaymentEvent` and set it into records
      const prefixedProviderEventUUID = `LS_${parsed.data.attributes.identifier}`;

      let event: co.loaded<typeof PaymentEvent>;

      if (processedProviderEvents[prefixedProviderEventUUID]) {
        logger.debug({
          message: "Payment event already processed (idempotent replay)",
          data: {
            prefixedProviderEventUUID,
            appId,
          },
        });
        // Branch 1 - Load existing event
        const existingEventId =
          processedProviderEvents[prefixedProviderEventUUID];
        event = (await PaymentEvent.load(existingEventId, {
          loadAs: worker,
        })) as co.loaded<typeof PaymentEvent>;

        const isEventLoaded = event.$isLoaded === true;
        if (isEventLoaded === false) {
          logger.error({
            message: "Failed to load existing PaymentEvent",
            data: {
              metadata: { operation: "load existing event" },
              existingEventId,
              prefixedProviderEventUUID,
              appId,
            },
          });
          return c.json({ error: "Failed to load PaymentEvent" }, 500);
        }
      } else {
        // Branch 2 - Create new payment event
        const userAccount = await co.account().load(jazzAccountId);

        const isUserAccountLoaded = userAccount.$isLoaded === true;
        if (isUserAccountLoaded === false) {
          logger.error({
            message: "Failed to load userAccount",
            data: {
              metadata: { operation: "create payment event" },
              userAccountIsLoaded: userAccount.$isLoaded,
              jazzAccountId, // which account id failed to load?
              appId,
            },
          });
          return c.json({ error: "Failed to load user account" }, 500);
        }

        const paymentOwnerGroup = Group.create();
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

        await event.$jazz.waitForSync();

        processedProviderEvents.$jazz.set(
          prefixedProviderEventUUID,
          event.$jazz.id,
        );
        await processedProviderEvents.$jazz.waitForSync();
        logger.info({
          message: "Payment event created and recorded",
          data: {
            eventJazzId: event.$jazz.id,
            prefixedProviderEventUUID,
            amount: command.amount,
            currency: command.currency,
            paymentStatus: command.status,
            appId,
            jazzAccountId,
          },
        });
      }

      const userSDK = await RegardeSDK.load(regardeSDKId, {
        loadAs: worker,
        resolve: {
          myPayments: {
            all: { $each: true },
            byApp: { $each: true },
          },
        },
      });

      const isUserSDKLoaded = userSDK.$isLoaded === true;
      if (isUserSDKLoaded === false) {
        logger.error({
          message: "Failed to load user RegardeSDK",
          data: {
            regardeSDKId, // what I'm trying to load - input
            jazzAccountId, // which user is involved - context
            appId, // which app is involded - context
            userSDKIsLoaded: userSDK.$isLoaded, // state diagnostic
          },
        });
        return c.json({ error: "Failed to load user RegardeSDK" }, 500);
      }

      // Link Payment Event to User
      const { myPayments: userPayments } = await userSDK.$jazz.ensureLoaded({
        resolve: {
          myPayments: {
            all: { $each: true },
            byApp: true,
          },
        },
      });

      if (userPayments.all.$jazz.has(prefixedProviderEventUUID) === false) {
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
        userPayments.byApp[app.$jazz.id].$jazz.set(
          prefixedProviderEventUUID,
          event.$jazz.id,
        );
        await userPayments.$jazz.waitForSync();
      }

      // Link Payment Event to App
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

      if (appPayments.all.$jazz.has(prefixedProviderEventUUID) === false) {
        appPayments.all.$jazz.set(prefixedProviderEventUUID, event.$jazz.id);
        await app.$jazz.waitForSync();
      }

      if (appPaymentsByUser.$jazz.has(jazzAccountId) === false) {
        appPaymentsByUser.$jazz.set(jazzAccountId, {
          [prefixedProviderEventUUID]: event.$jazz.id,
        });
        await app.$jazz.waitForSync();
      } else if (
        appPaymentsByUser[jazzAccountId].$jazz.has(
          prefixedProviderEventUUID,
        ) === false
      ) {
        appPaymentsByUser[jazzAccountId].$jazz.set(
          prefixedProviderEventUUID,
          event.$jazz.id,
        );
        await app.$jazz.waitForSync();
      }

      logger.info({
        message: "Webhook processing complete",
        data: {
          prefixedProviderEventUUID,
          eventJazzId: event.$jazz.id,
          appId,
          jazzAccountId,
          paymentStatus: command.status,
        },
      });
      return c.json({ received: true }, 200);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";

      logger.error({
        message: "Unexpected error in webhook handler",
        data: { errorMessage: message },
      });

      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }

      return c.json({ error: message }, 500);
    }
  };
};
