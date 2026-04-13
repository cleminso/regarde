import { co, z } from "jazz-tools";

import { AppCheckoutSessionsSchema } from "./checkoutSession";
import { AppRefundsSchema } from "./refund";
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

export const WEBHOOK_NAME_MAX_LENGTH = 30;
export const WEBHOOK_DESCRIPTION_MAX_LENGTH = 120;

/**
 * Stripe secret key prefixes for webhook signature verification
 */
export const STRIPE_SECRET_PREFIX = "whsec_";

/**
 * Polar secret key prefixes for webhook signature verification
 */
export const POLAR_SECRET_PREFIX = "polar_whs_";

/**
 * Webhook endpoint configuration for receiving payment provider events.
 *
 * Created per-webhook endpoint. Used as session key in AllWebhookEventsFeed.
 *
 * @schema
 * - `name`: Human-readable identifier for this webhook
 * - `description`: Optional details about the webhook's purpose
 * - `provider`: Payment provider (stripe or polar)
 * - `environment`: sandbox or production (Regarde-managed)
 * - `createdAt`: Unix timestamp when webhook was created
 * - `isEnabled`: Whether webhook is active (can disable without deleting)
 * - `url`: Endpoint URL where provider sends webhooks
 * - `secret`: Signing secret for webhook verification
 * - `customMetadata`: Provider-specific configuration and integration hints
 */
export const Webhook = co.map({
  name: z.string().min(1).max(WEBHOOK_NAME_MAX_LENGTH),
  description: z.string().max(WEBHOOK_DESCRIPTION_MAX_LENGTH),
  provider: z.enum(["stripe", "polar"]),
  environment: z.enum(["sandbox", "production"]),
  createdAt: z.number(),
  isEnabled: z.boolean(),
  url: z.url(),
  secret: z.string(),
  customMetadata: co.record(z.string(), z.string()),
});

export const ListOfWebhooks = co.list(Webhook);

export type TWebhook = co.loaded<typeof Webhook>;

/**
 * Partial webhook schema for incremental form building.
 *
 * Used in creation forms where fields are built up gradually before
 * finalizing into a full Webhook CoValue.
 */
export const PartialWebhook = Webhook.partial();
export type TPartialWebhook = co.loaded<typeof PartialWebhook>;

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
 * - `httpStatusCode`: HTTP status code returned to provider (e.g., "200", "500")
 * - `responseBody`: Response body sent back to provider
 * - `error`: Processing error message if normalization failed
 * - `providerEventId`: Provider's unique event ID (Stripe: evt_123, Polar: event UUID)
 * - `parsedEventType`: Normalized event type (e.g., "invoice.payment_succeeded")
 * - `regardeEventId`: Reference to PaymentEvent/SubscriptionEvent CoMap ID (if successfully normalized)
 * - `isRetry`: True if this providerEventId was seen before (deduplication marker)
 * - `retryCount`: Number of times provider has retried (0 = first delivery)
 */
export const WebhookEvent = z.object({
  payload: z.json(),
  headers: z.optional(z.record(z.string(), z.string())),
  receivedAt: z.number(),
  httpStatusCode: z.string(),
  responseBody: z.string(),
  // responseTimeMs: z.optional(z.number()) , // responseTime = processingEndTime - receivedAt
  error: z.optional(z.string()),
  providerEventId: z.string(),
  parsedEventType: z.string(),
  regardeEventId: z.optional(z.string()),
  isRetry: z.boolean().default(false).describe("true if providerEventId was seen before"),
  retryCount: z.number().default(0).describe("0 = first delivery, 1 = first retry, etc."),
});

export type TWebhookEvent = z.infer<typeof WebhookEvent>;

//Lives on RegardeApp: app.allEvents. Organizes entries by session
export const AllWebhookEventsFeed = co.feed(WebhookEvent);

export const Profile = co.map({
  description: z.optional(z.string().min(1).max(WEBHOOK_DESCRIPTION_MAX_LENGTH)),
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
 * - `refunds`: Refund event records for this app
 * - `checkoutSessions`: Checkout session records for this app
 * - `allEvents`: CoFeed of raw webhook payloads organized by webhook ID
 * - `groups`: Permission groups for the app
 */
export const RegardeApp = co.map({
  name: z.string().min(1).max(30),
  ownerAccountId: z.string(),
  isEnabled: z.boolean(),
  createdAt: z.number(),
  providerMetadata: co.record(z.string(), z.string()),
  profile: Profile,
  webhooks: ListOfWebhooks,
  payments: AppPaymentsSchema,
  subscriptions: AppSubscriptionsSchema,
  licenses: AppLicensesSchema,
  refunds: AppRefundsSchema,
  checkoutSessions: AppCheckoutSessionsSchema,
  allEvents: AllWebhookEventsFeed,
  groups: Groups,
});

export type TRegardeApp = co.loaded<typeof RegardeApp>;

// TODO: webhook per cofeed and turn it as session
// TODO: update webhook routes to wrap the webhookId
