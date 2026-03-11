import { co, z } from "jazz-tools";

export const PAYMENT_PROVIDERS = ["stripe", "polar"] as const;
export type TPaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_EVENT_TYPES = [
  // Checkout events
  "payment.checkout_started",
  "payment.checkout_completed",
  "payment.checkout_succeeded",
  "payment.checkout_failed",
  "payment.checkout_expired",

  // Lifecycle events
  "payment.authorized",
  "payment.captured",
  "payment.succeeded",
  "payment.failed",
  "payment.canceled",
  "payment.expired",

  // Intermediate states
  "payment.processing",
  "payment.action_required",
  "payment.partially_funded",

  // Post-payment
  "payment.refunded",
  "payment.refund_failed",

  // Metadata-only
  "payment.updated",
] as const;
export type TPaymentEventType = (typeof PAYMENT_EVENT_TYPES)[number];

export const PAYMENT_STATUSES = [
  "succeeded",
  "failed",
  "refunded",
  "pending",
  "action_required",
] as const;
export type TPaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Shared mode type across all event schemas
export type TMode = "test" | "production";
export const ModeSchema = z.enum(["test", "production"]);

/**
 * Individual payment transaction record.
 *
 * Created by worker from payment provider webhook events.
 * Amount stored as string to avoid precision issues.
 *
 * @schema
 * - `webhookId`: Webhook CoMap ID that received this event
 * - `provider`: Payment provider source (lemonsqueezy, stripe, polar)
 * - `mode`: Test or production mode (from webhook.environment)
 * - `providerEventId`: Native provider event ID (e.g., "evt_1NG8Du..." for Stripe)
 * - `prefixedProviderEventUUID`: Prefixed ID for deduplication (e.g., "ST_evt_1NG8Du...")
 * - `eventType`: Unified event type (payment.checkout_started, payment.checkout_completed, payment.succeeded, payment.failed, payment.refunded, etc.)
 * - `app`: App CoMap ID for which the payment was done
 * - `userAccount`: Jazz account ID of user who paid
 * - `amount`: Payment amount as string for precision safety
 * - `currency`: Payment currency code (e.g., "USD")
 * - `status`: Payment outcome (succeeded, failed, refunded, pending, action_required)
 * - `providerSubscriptionId`: Links payment to subscription (for recurring payments)
 * - `providerLicenseId`: Links payment to license (if applicable)
 * - `providerMetadata`: Provider-specific extras (PayKit pattern)
 * - `metadata`: Legacy metadata (use providerMetadata for new events)
 * - `timestamp`: Unix timestamp of payment
 */
export const PaymentEvent = co.map({
  webhookId: z.string().describe("Webhook CoMap ID that received this event"),
  provider: z.enum(PAYMENT_PROVIDERS),
  mode: z
    .optional(ModeSchema)
    .describe("From webhook.environment (production -> 'production', sandbox -> 'test')"),

  providerEventId: z.string(),
  prefixedProviderEventUUID: z.string(),
  eventType: z.enum(PAYMENT_EVENT_TYPES),

  app: z.string().describe("App CoMap ID for which the payment was done"),
  userAccount: z.string().describe("JazzAccountId by which the payment was done"),

  amount: z.string(),
  currency: z.string(),
  status: z.enum(PAYMENT_STATUSES),

  providerSubscriptionId: z.optional(z.string()), // Since we properly map event, is it still needed?
  providerLicenseId: z.optional(z.string()), // same

  providerMetadata: co.record(z.string(), z.string()),
  metadata: co.record(z.string(), z.string()),
  timestamp: z.number(),
});

/** Loaded PaymentEvent instance */
export type TPaymentEvent = co.loaded<typeof PaymentEvent>;
