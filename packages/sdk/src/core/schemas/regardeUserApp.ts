import { co, z } from "jazz-tools";

import { AppCheckoutSessionsSchema } from "./checkoutSession";
import { Groups } from "./regardeGroups";

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

//Use webhook.id as feed session key
export const Webhook = co.map({
  name: z.string(),
  description: z.string(),
  provider: z.enum(["stripe", "polar"]),
  environment: z.enum(["sandbox", "production"]), // regarde related
  createdAt: z.number(),
  isEnabled: z.boolean(), // desactive webhook if I don't wanna use it
  url: z.url(),
  secret: z.string(),
  customMetadata: co.record(z.string(), z.string()), // depend on provider and type of events then I can give a code snippet to integrate
});

export const ListOfWebhooks = co.list(Webhook);

export type TWebhook = co.loaded<typeof Webhook>;

/**
 * Raw webhook payload log entry.
 *
 * Pushed into AllWebhookEventsFeed CoFeed. Uses Webhook CoMap ID as session key.
 * Self-contained for debugging - includes raw payload and processing status.
 *
 * @schema
 * - `payload`: Raw JSON payload from payment provider (arbitrary JSON)
 * - `headers`: HTTP headers from webhook request (for signature debugging)
 * - `receivedAt`: Unix timestamp when webhook was received
 * - `error`: Processing error message if normalization failed
 */
export const WebhookEvent = z.object({
  payload: z.json(),
  headers: z.optional(z.record(z.string(), z.string())),
  receivedAt: z.number(),
  error: z.optional(z.string()), // Normalization error (if any)
  httpStatusCode: z.string(),
  responseBody: z.string(),
  // responseTimeMs: z.optional(z.number()) , // responseTime = processingEndTime - receivedAt

  regardeEventId: z.optional(z.string()), // Reference to PaymentEvent/SubscriptionEvent (if successfully normalized)

  providerEventId: z.string(), // Stripe: evt_123, LemonSqueezy: meta.event_id
  parsedEventType: z.string(), // "invoice.payment_succeeded"

  isRetry: z.boolean().default(false), // True if providerEventId was seen before
  retryCount: z.number().default(0), // 0 = first delivery, 1 = first retry, etc.
});

export type TWebhookEvent = z.infer<typeof WebhookEvent>;

//Lives on RegardeApp: app.allEvents. Organizes entries by session
export const AllWebhookEventsFeed = co.feed(WebhookEvent);

export const Profile = co.map({
  description: z.optional(z.string()),
  logoUrl: z.optional(z.url()),
  website: z.optional(z.url()),
  socials: co.optional(co.record(z.string(), z.url())),
});

export type TProfile = co.loaded<typeof Profile>;
/**
 * User's app configuration.
 *
 * Stores app metadata and webhook configuration.
 *
 * @schema
 * - `name`: App display name
 * - `description`: Optional description
 * - `ownerAccountId`: Jazz account ID of owner
 * - `isEnabled`: Whether app is active
 * - `createdAt`: Creation timestamp
 * - `metadata`: Additional app data
 * - `webhooks`: List of Webhook configurations (created by user via dashboard)
 * - `payments`: Payment event records for this app (deprecated `.all` field)
 * - `subscriptions`: Subscription event records for this app (deprecated `.all` field)
 * - `licenses`: License event records for this app (deprecated `.all` field)
 * - `checkoutSessions`: Checkout session records for this app
 * - `allEvents`: CoFeed of raw webhook payloads organized by webhook ID
 * - `groups`: Permission groups for the app
 */
export const RegardeApp = co.map({
  name: z.string(),
  ownerAccountId: z.string(),
  isEnabled: z.boolean(),
  createdAt: z.number(),
  providerMetadata: co.record(z.string(), z.string()),
  profile: Profile,
  webhooks: ListOfWebhooks,
  payments: AppPaymentsSchema,
  subscriptions: AppSubscriptionsSchema,
  licenses: AppLicensesSchema,
  checkoutSessions: AppCheckoutSessionsSchema,
  allEvents: AllWebhookEventsFeed,
  groups: Groups,
});

export type TRegardeApp = co.loaded<typeof RegardeApp>;

// TODO: webhook per cofeed and turn it as session
// TODO: update webhook routes to wrap the webhookId
