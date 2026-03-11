import { co, z } from "jazz-tools";

import { PAYMENT_PROVIDERS, ModeSchema } from "./paymentEvent";

export const CHECKOUT_SESSION_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "canceled",
  "expired",
] as const;
export type TCheckoutSessionStatus = (typeof CHECKOUT_SESSION_STATUSES)[number];

export const CHECKOUT_MODES = ["payment", "subscription"] as const;
export type TCheckoutMode = (typeof CHECKOUT_MODES)[number];

/**
 * Tracks the full lifecycle of a payment checkout.
 *
 * Created by the SDK when initiating a checkout, updated by the worker
 * via webhooks. Jazz sync propagates status changes to all subscribers
 * in real-time - no polling needed.
 *
 * @schema
 * - `appId`: RegardeApp ID for webhook routing
 * - `userAccountId`: Jazz account ID of the payer
 * - `provider`: Payment provider source
 * - `providerSessionId`: Provider's checkout session ID (filled after API call)
 * - `status`: Checkout lifecycle status (updated by worker via webhooks)
 * - `mode`: Whether this is a one-time payment or subscription
 * - `amount`: Payment amount in smallest currency unit (e.g. cents)
 * - `currency`: ISO 4217 currency code (e.g. "USD")
 * - `customerEmail`: Pre-filled customer email (optional)
 * - `paymentUrl`: Provider-hosted checkout URL for redirect
 * - `paymentEventId`: Links to PaymentEvent CoMap (filled by worker)
 * - `subscriptionId`: Links to Subscription CoMap if mode=subscription (filled by worker)
 * - `createdAt`: Unix timestamp of creation
 * - `expiresAt`: Unix timestamp of session expiry (optional)
 * - `completedAt`: Unix timestamp of completion (optional)
 */
export const CheckoutSession = co.map({
  appId: z.string().describe("RegardeApp ID for webhook routing"),
  userAccountId: z.string().describe("JazzAccountId of the payer"),

  provider: z.enum(PAYMENT_PROVIDERS),
  providerSessionId: z.optional(z.string()).describe("Provider checkout session ID"),

  status: z.enum(CHECKOUT_SESSION_STATUSES),
  mode: z.enum(CHECKOUT_MODES),

  amount: z.number().describe("Amount in smallest currency unit"),
  currency: z.string().describe("ISO 4217 currency code"),
  customerEmail: z.optional(z.string()),

  paymentUrl: z.optional(z.string()).describe("Provider checkout redirect URL"),

  paymentEventId: z.optional(z.string()).describe("Links to PaymentEvent"),
  subscriptionId: z.optional(z.string()).describe("Links to Subscription (if mode=subscription)"),

  providerMetadata: co.record(z.string(), z.string()),

  createdAt: z.number(),
  expiresAt: z.optional(z.number()),
  completedAt: z.optional(z.number()),
});

export type TCheckoutSession = co.loaded<typeof CheckoutSession>;

/**
 * Index of checkout sessions for an app.
 *
 * - `all`: providerSessionId -> CheckoutSession CoMap ID
 * - `byUser`: userAccountId -> providerSessionId -> CheckoutSession CoMap ID
 */
export const AppCheckoutSessionsSchema = co.map({
  all: co.record(z.string(), z.string()),
  byUser: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TAppCheckoutSessionsSchema = co.loaded<typeof AppCheckoutSessionsSchema>;
