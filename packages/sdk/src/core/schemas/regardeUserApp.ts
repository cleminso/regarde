import { co, z } from "jazz-tools";

/**
 * Payment records for a single app.
 *
 * Maps provider event UUIDs to PaymentEvent CoMap IDs.
 */
export const AppPaymentsSchema = co.map({
  all: co.record(z.string(), z.string()), // prefixedProviderEventUUID -> PaymentEvent.id
  byUser: co.record(z.string(), co.record(z.string(), z.string())), // JazzAccount.id -> prefixedProviderEventUUID -> PaymentEvent.id
});

/** Loaded AppPaymentsSchema instance */
export type TAppPaymentsSchema = co.loaded<typeof AppPaymentsSchema>;

/**
 * User's app configuration.
 *
 * Stores app metadata, payment provider settings, and webhook configuration.
 *
 * @schema
 * - `name`: App display name
 * - `description`: Optional description
 * - `ownerAccountId`: Jazz account ID of owner
 * - `paymentProvider`: "lemonsqueezy" or "stripe"
 * - `isEnabled`: Whether app is active
 * - `createdAt`: Creation timestamp
 * - `metadata`: Additional app data
 * - `webhookSecret`: Provider webhook secret
 * - `payments`: Payment event records
 */
export const App = co.map({
  name: z.string(),
  description: z.string(),
  ownerAccountId: z.string(),
  paymentProvider: z.enum(["lemonsqueezy", "stripe"]),
  isEnabled: z.boolean(), // default false
  createdAt: z.number(),
  metadata: co.record(z.string(), z.string()),
  webhookSecret: z.string(),
  payments: AppPaymentsSchema,
  // providerAppId: z.string(), verify if needed but we made it via metadat from webhook
});

/** Loaded App instance */
export type TApp = co.loaded<typeof App>;
