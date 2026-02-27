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

export const Webhook = co.map({
  name: z.string(),
  provider: z.enum(["lemonsqueezy", "stripe", "polar"]),
  environment: z.enum(["sandbox", "production"]), // regarde related
  createdAt: z.number(),
  isEnabled: z.boolean(), // desactive webhook if I don't wanna use it
  url: z.url(),
  secret: z.string(),
  customMetadata: co.record(z.string(), z.string()), // depend on provider and type of events then I can give a code snippet to integrate
});

export const ListOfWebhooks = co.list(Webhook);

export const WebhookEvent = co.record(z.string(), z.object());

export type TWebhookEvent = co.loaded<typeof WebhookEvent>;

export const AllWebhookEventsFeed = co.feed(WebhookEvent);

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
export const RegardeApp = co.map({
  name: z.string(),
  description: z.string(),
  ownerAccountId: z.string(),
  isEnabled: z.boolean(),
  createdAt: z.number(),
  metadata: co.record(z.string(), z.string()),
  webhooks: ListOfWebhooks,
  payments: AppPaymentsSchema,
  subscriptions: AppSubscriptionsSchema,
  licenses: AppLicensesSchema,
  allEvents: AllWebhookEventsFeed,
});

export type TRegardeApp = co.loaded<typeof RegardeApp>;

// TODO: webhook per cofeed and turn it as session
// TODO: once update done, remove `.all` from all Schemas
// TODO: update webhook routes to wrap the webhookId
