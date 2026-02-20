import { co, z } from "jazz-tools";

/**
 * Payment records for a single app.
 *
 * Maps provider event UUIDs to PaymentEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID -> PaymentEvent.id
 * - `byUser`: User-scoped by JazzAccount.id -> prefixedProviderEventUUID -> PaymentEvent.id
 */
export const AppPaymentsSchema = co.map({
  all: co.record(z.string(), z.string()),
  byUser: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TAppPaymentsSchema = co.loaded<typeof AppPaymentsSchema>;

/**
 * Subscription records for a single app.
 *
 * Maps provider event UUIDs to SubscriptionEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID -> SubscriptionEvent.id
 * - `byUser`: User-scoped by JazzAccount.id -> prefixedProviderEventUUID -> SubscriptionEvent.id
 */
export const AppSubscriptionsSchema = co.map({
  all: co.record(z.string(), z.string()),
  byUser: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TAppSubscriptionsSchema = co.loaded<typeof AppSubscriptionsSchema>;

/**
 * License records for a single app.
 *
 * Maps provider event UUIDs to LicenseEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID -> LicenseEvent.id
 * - `byUser`: User-scoped by JazzAccount.id -> prefixedProviderEventUUID -> LicenseEvent.id
 */
export const AppLicensesSchema = co.map({
  all: co.record(z.string(), z.string()),
  byUser: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TAppLicensesSchema = co.loaded<typeof AppLicensesSchema>;

/**
 * User's app configuration.
 *
 * Stores app metadata, payment provider settings, and webhook configuration.
 *
 * @schema
 * - `name`: App display name
 * - `description`: Optional description
 * - `ownerAccountId`: Jazz account ID of owner
 * - `paymentProvider`: "stripe", "polar", or "lemonsqueezy"
 * - `isEnabled`: Whether app is active
 * - `createdAt`: Creation timestamp
 * - `metadata`: Additional app data
 * - `webhookSecret`: Provider webhook secret
 * - `payments`: Payment event records for this app
 * - `subscriptions`: Subscription event records for this app
 * - `licenses`: License event records for this app
 */
export const App = co.map({
  name: z.string(),
  description: z.string(),
  ownerAccountId: z.string(),
  paymentProvider: z.enum(["stripe", "polar", "lemonsqueezy"]),
  isEnabled: z.boolean(),
  createdAt: z.number(),
  metadata: co.record(z.string(), z.string()),
  webhookSecret: z.string(),
  payments: AppPaymentsSchema,
  subscriptions: AppSubscriptionsSchema,
  licenses: AppLicensesSchema,
});

export type TApp = co.loaded<typeof App>;
