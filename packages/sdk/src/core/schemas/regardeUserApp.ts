import { co, z } from "jazz-tools";

import { AppCheckoutSessionsSchema } from "./checkoutSession";
import { AppRefundIndex } from "./refund";
import { Groups } from "./regardeGroups";

/**
 * Payment index for a single app.
 *
 * Maps provider event UUIDs to PaymentEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID -> PaymentEvent.id
 * - `byUser`: User-scoped by JazzAccount.id -> prefixedProviderEventUUID -> PaymentEvent.id
 */
export const AppPaymentIndex = co.map({
  all: co.record(z.string(), z.string()),
  byUser: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TAppPaymentIndex = co.loaded<typeof AppPaymentIndex>;

/**
 * Subscription index for a single app.
 *
 * Maps provider event UUIDs to SubscriptionEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID -> SubscriptionEvent.id
 * - `byUser`: User-scoped by JazzAccount.id -> prefixedProviderEventUUID -> SubscriptionEvent.id
 */
export const AppSubscriptionIndex = co.map({
  all: co.record(z.string(), z.string()),
  byUser: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TAppSubscriptionIndex = co.loaded<typeof AppSubscriptionIndex>;

/**
 * License index for a single app.
 *
 * Maps provider event UUIDs to LicenseEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID -> LicenseEvent.id
 * - `byUser`: User-scoped by JazzAccount.id -> prefixedProviderEventUUID -> LicenseEvent.id
 */
export const AppLicenseIndex = co.map({
  all: co.record(z.string(), z.string()),
  byUser: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TAppLicenseIndex = co.loaded<typeof AppLicenseIndex>;

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
 * Raw webhook payload log entry.
 *
 * Pushed into webhook.events CoFeed.
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
 * - `webhookId`: CoValue ID of the Webhook CoMap that received this event
 */
export const WebhookEvent = z.object({
  payload: z.json(),
  headers: z.optional(z.record(z.string(), z.string())),
  receivedAt: z.number(),
  httpStatusCode: z.string(),
  responseBody: z.string(),
  error: z.optional(z.string()),
  providerEventId: z.string(),
  parsedEventType: z.string(),
  regardeEventId: z.optional(z.string()),
  isRetry: z.boolean().default(false).describe("true if providerEventId was seen before"),
  retryCount: z.number().default(0).describe("0 = first delivery, 1 = first retry, etc."),
  webhookId: z.string().describe("CoValue ID of the Webhook CoMap"),
});

export type TWebhookEvent = z.infer<typeof WebhookEvent>;

/**
 * Per-webhook event feed.
 *
 * Each webhook has its own CoFeed for events, enabling direct access without
 * filtering. This is the primary storage for webhook events.
 */
export const WebhookEventsFeed = co.feed(WebhookEvent);

/**
 * Webhook endpoint configuration for receiving payment provider events.
 *
 * Each webhook represents a provider-specific endpoint (Stripe, Polar, LemonSqueezy).
 * The URL is auto-generated on creation using the format:
 * `https://api.regarde.dev/v1/webhooks/{provider}/{appId}/{webhookId}`
 *
 * @schema
 * - `name`: Human-readable identifier (e.g., "Stripe Production")
 * - `provider`: Which payment provider sends events
 * - `environment`: sandbox (test) or production (live)
 * - `url`: Auto-generated webhook endpoint URL
 * - `secret`: Signing secret for webhook verification
 * - `events`: CoFeed containing all events for this webhook (primary storage)
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
  events: WebhookEventsFeed,
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
  payments: AppPaymentIndex,
  subscriptions: AppSubscriptionIndex,
  licenses: AppLicenseIndex,
  refunds: AppRefundIndex,
  checkoutSessions: AppCheckoutSessionsSchema,
  groups: Groups,
});

export type TRegardeApp = co.loaded<typeof RegardeApp>;

// TODO: webhook per cofeed and turn it as session
// TODO: update webhook routes to wrap the webhookId
