import { co, z } from "jazz-tools";

import { PAYMENT_PROVIDERS, ModeSchema } from "./paymentEvent";

export const SUBSCRIPTION_EVENT_TYPES = [
  "subscription.created",
  "subscription.activated",
  "subscription.paused",
  "subscription.resumed",
  "subscription.past_due",
  "subscription.canceled",
  "subscription.uncanceled",
  "subscription.expired",
  "subscription.trial_will_end",
  "subscription.updated",
] as const;
export type TSubscriptionEventType = (typeof SUBSCRIPTION_EVENT_TYPES)[number];

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "expired",
  "paused",
] as const;
export type TSubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * Immutable subscription lifecycle event record.
 *
 * Created by worker from subscription-related webhook events.
 * Each event captures a point-in-time snapshot of a subscription state change.
 *
 * @schema
 * - `webhookId`: Webhook CoMap ID that received this event
 * - `provider`: Payment provider source
 * - `mode`: Test or production mode (from webhook.environment)
 * - `providerEventId`: Native provider event ID
 * - `prefixedProviderEventUUID`: Prefixed ID for deduplication
 * - `eventType`: Unified event type (subscription.created, .activated, .paused, .resumed, .canceled, etc.)
 * - `app`: App CoMap ID
 * - `userAccount`: Jazz account ID of subscriber
 * - `providerSubscriptionId`: Provider's subscription identifier (for linking to Subscription state)
 * - `status`: Subscription status at time of event
 * - `currentPeriodStart`: Current billing period start (optional)
 * - `currentPeriodEnd`: Current billing period end (optional)
 * - `planId`: Provider plan/price identifier (optional)
 * - `providerMetadata`: Provider-specific extras
 * - `metadata`: Legacy metadata
 * - `timestamp`: Unix timestamp of event
 */
export const SubscriptionEvent = co.map({
  webhookId: z.string().describe("Webhook CoMap ID that received this event"),
  provider: z.enum(PAYMENT_PROVIDERS),
  mode: z
    .optional(ModeSchema)
    .describe("From webhook.environment (production -> 'production', sandbox -> 'test')"),

  providerEventId: z.string(),
  prefixedProviderEventUUID: z.string(),
  eventType: z.enum(SUBSCRIPTION_EVENT_TYPES),

  app: z.string().describe("App CoMap ID for which the payment was done"),
  userAccount: z.string().describe("JazzAccountId by which the payment was done"),

  providerSubscriptionId: z.string(),
  status: z.enum(SUBSCRIPTION_STATUSES),
  currentPeriodStart: z.optional(z.number()),
  currentPeriodEnd: z.optional(z.number()),
  planId: z.optional(z.string()),

  providerMetadata: co.record(z.string(), z.string()),
  metadata: co.record(z.string(), z.string()),
  timestamp: z.number(),
});

export type TSubscriptionEvent = co.loaded<typeof SubscriptionEvent>;

/**
 * Mutable subscription state.
 *
 * Tracks current status of a subscription, updated by subscription events.
 * Separates "what happened" (SubscriptionEvent logs) from "current state" (Subscription).
 *
 * @schema
 * - `app`: App CoMap ID
 * - `userAccount`: Jazz account ID of subscriber
 * - `provider`: Payment provider
 * - `providerSubscriptionId`: Provider's subscription ID (lookup key)
 * - `createdByEventId`: SubscriptionEvent that created this subscription
 * - `lastSubscriptionEventId`: Most recent SubscriptionEvent ID
 * - `lastPaymentEventId`: Most recent PaymentEvent ID (for renewals)
 * - `canceledByEventId`: SubscriptionEvent that canceled this (if applicable)
 * - `status`: Current subscription status
 * - `currentPeriodStart`: Current billing period start
 * - `currentPeriodEnd`: Current billing period end
 * - `planId`: Current plan/price identifier
 * - `cancelAtPeriodEnd`: Whether subscription cancels at period end
 * - `createdAt`: Subscription creation timestamp
 * - `updatedAt`: Last update timestamp
 */
export const Subscription = co.map({
  app: z.string(),
  userAccount: z.string(),
  provider: z.enum(PAYMENT_PROVIDERS),
  providerSubscriptionId: z.string(),

  createdByEventId: z.string(),
  lastSubscriptionEventId: z.string(),
  lastPaymentEventId: z.optional(z.string()),
  canceledByEventId: z.optional(z.string()),

  status: z.enum(SUBSCRIPTION_STATUSES),
  currentPeriodStart: z.number(),
  currentPeriodEnd: z.number(),
  planId: z.string(),
  cancelAtPeriodEnd: z.boolean(),

  createdAt: z.number(),
  updatedAt: z.number(),
});

export type TSubscription = co.loaded<typeof Subscription>;
