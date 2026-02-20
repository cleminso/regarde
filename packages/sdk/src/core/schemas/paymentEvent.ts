import { co, z } from "jazz-tools";

export const PAYMENT_PROVIDERS = ["lemonsqueezy", "stripe", "polar"] as const;
export type TPaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_EVENT_TYPES = [
  "payment.created",
  "payment.failed",
  "payment.refunded",
] as const;
export type TPaymentEventType = (typeof PAYMENT_EVENT_TYPES)[number];

export const PAYMENT_STATUSES = [
  "succeeded",
  "failed",
  "refunded",
  "pending",
] as const;

/**
 * Individual payment transaction record.
 *
 * Created by worker from payment provider webhook events.
 * Amount stored as string to avoid precision issues.
 *
 * @schema
 * - `provider`: Payment provider source (lemonsqueezy, stripe, polar)
 * - `mode`: Test or production mode
 * - `providerEventId`: Native provider event ID (e.g., "evt_1NG8Du..." for Stripe)
 * - `prefixedProviderEventUUID`: Prefixed ID for deduplication (e.g., "ST_evt_1NG8Du...")
 * - `eventType`: Unified event type (payment.created, payment.failed, payment.refunded)
 * - `app`: App CoMap ID for which the payment was done
 * - `userAccount`: Jazz account ID of user who paid
 * - `amount`: Payment amount as string for precision safety
 * - `currency`: Payment currency code (e.g., "USD")
 * - `status`: Payment outcome (succeeded, failed, refunded, pending)
 * - `providerSubscriptionId`: Links payment to subscription (for recurring payments)
 * - `providerLicenseId`: Links payment to license (if applicable)
 * - `providerMetadata`: Provider-specific extras (PayKit pattern)
 * - `metadata`: Legacy metadata (use providerMetadata for new events)
 * - `timestamp`: Unix timestamp of payment
 */
export const PaymentEvent = co.map({
  provider: z.enum(PAYMENT_PROVIDERS),
  mode: z.enum(["test", "production"]),

  providerEventId: z.string(),
  prefixedProviderEventUUID: z.string(),
  eventType: z.enum(PAYMENT_EVENT_TYPES),

  app: z.string().describe("App CoMap ID for which the payment was done"),
  userAccount: z
    .string()
    .describe("JazzAccountId by which the payment was done"),

  amount: z.string(),
  currency: z.string(),
  status: z.enum(PAYMENT_STATUSES),

  providerSubscriptionId: z.optional(z.string()),
  providerLicenseId: z.optional(z.string()),

  providerMetadata: co.record(z.string(), z.string()),
  metadata: co.record(z.string(), z.string()),
  timestamp: z.number(),
});

/** Loaded PaymentEvent instance */
export type TPaymentEvent = co.loaded<typeof PaymentEvent>;
