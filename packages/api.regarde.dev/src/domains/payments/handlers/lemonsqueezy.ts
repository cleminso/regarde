import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  type TAllRegistryAppsSchema,
  RegistryWorkerAccount,
  RegistryAppMetadata,
} from "@regarde-dev/sdk/registry";
import { App, PaymentEvent } from "@regarde-dev/sdk/payments";
import { Group, Loaded } from "jazz-tools";

// ----------------------------------------------------------------------
// 1. Source Schema (Lemon Squeezy Webhook Payload)
// ----------------------------------------------------------------------

/**
 * Zod schema for Lemon Squeezy "order_created" event.
 * Based on the "Golden Sample" payload.
 */
export const LemonSqueezyPayloadSchema = z.object({
  meta: z.object({
    event_name: z.string(),
    custom_data: z.record(z.string(), z.any()).optional(),
    test_mode: z.boolean().optional(),
  }),
  data: z.object({
    type: z.literal("orders"),
    id: z.string(),
    attributes: z.object({
      order_number: z.number(),
      user_email: z.string().email(),
      total: z.number(), // Amount in smallest unit (e.g., cents)
      currency: z.string(),
      status: z.enum(["paid", "pending", "failed", "refunded"]),
      created_at: z.string().datetime(),
      updated_at: z.string().datetime(),
      first_order_item: z.object({
        product_name: z.string(),
        variant_name: z.string().optional(),
        product_id: z.number(),
        variant_id: z.number(),
      }),
      urls: z
        .object({
          receipt: z.string().url().optional(),
        })
        .optional(),
    }),
  }),
});

export type LemonSqueezyPayload = z.infer<typeof LemonSqueezyPayloadSchema>;

// ----------------------------------------------------------------------
// 2. Verification Utility
// ----------------------------------------------------------------------

/**
 * Verifies the X-Signature header from Lemon Squeezy.
 * @returns true if valid, false otherwise.
 */
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
  payload: LemonSqueezyPayload,
): StandardPaymentCommand => {
  const { attributes, id } = payload.data;

  // Map Status
  let status: StandardPaymentCommand["status"] = "pending";
  if (attributes.status === "paid") status = "completed";
  if (attributes.status === "failed") status = "failed";
  if (attributes.status === "refunded") status = "cancelled";

  return {
    provider: "lemonsqueezy",
    providerEventId: id,
    email: attributes.user_email,
    amount: attributes.total.toString(),
    currency: attributes.currency,
    status,
    timestamp: new Date(attributes.created_at).getTime(),
    productName: attributes.first_order_item.product_name,
    metadata: {
      orderNumber: attributes.order_number.toString(),
      receiptUrl: attributes.urls?.receipt || "",
      variant: attributes.first_order_item.variant_name || "",
      testMode: payload.meta.test_mode ? "true" : "false",
    },
  };
};

// ----------------------------------------------------------------------
// 4. Handler
// ----------------------------------------------------------------------

export const lemonSqueezyWebhookHandler = (
  appsRecord: TAllRegistryAppsSchema,
  worker: Loaded<typeof RegistryWorkerAccount>,
) => {
  return async (c: any) => {
    try {
      const appId = c.req.param("appId");
      if (!appId) {
        return c.json({ error: "Missing App ID" }, 400);
      }

      // 1. Get the App
      const appMetadata = appsRecord[appId] as RegistryAppMetadata | undefined;
      if (!appMetadata) {
        return c.json({ error: "App not found" }, 404);
      }

      // Ensure Metadata is loaded
      // We explicitly cast to access the methods available on the loaded proxy
      const loadedMetadata = await (appMetadata as any).$jazz.ensureLoaded({
        app: true,
      });
      if (!loadedMetadata || !loadedMetadata.app) {
        return c.json({ error: "App data unavailable" }, 500);
      }

      const app = (await loadedMetadata.app.$jazz.ensureLoaded({
        payments: true,
      })) as App;

      // 2. Verify Signature
      const secret = app.webhookSecret;
      const signature = c.req.header("x-signature") || null;
      const rawBody = await c.req.text();

      if (!verifyLemonSqueezySignature(secret, rawBody, signature)) {
        return c.json({ error: "Invalid Signature" }, 401);
      }

      // 3. Parse & Standardize
      const json = JSON.parse(rawBody);
      const parsed = LemonSqueezyPayloadSchema.parse(json);
      const command = standardizeLemonSqueezy(parsed);

      console.log(`[Webhook] Received payment for App ${appId}:`, command);

      // 4. Provisioning (Create PaymentEvent)
      let userAccountId = parsed.meta.custom_data?.user_id; // Check if it's string
      if (typeof userAccountId !== "string") userAccountId = undefined;

      if (!userAccountId) {
        console.warn(
          "[Webhook] Warning: No user_id in custom_data. Using 'unverified_user'.",
        );
        userAccountId = "unverified_user";
      }

      const group = Group.create({
        owner: worker,
      });
      // TODO: Account.load() for theses
      group.addMember(app.ownerAccountId, "reader");
      group.addMember(userAccountId, "reader");

      const event = PaymentEvent.create(
        {
          amount: command.amount,
          currency: command.currency,
          timestamp: command.timestamp,
          paymentStatus: command.status,
          userAccount: userAccountId,
          app: app,
          metadata: command.metadata as any,
        },
        { owner: group },
      );

      // 5. Append to App payments
      app.payments?.$jazz.push(event);

      return c.json({ received: true }, 200);
    } catch (error: any) {
      console.error("[Webhook] Error processing:", error);
      return c.json({ error: error.message || "Internal Server Error" }, 500);
    }
  };
};
