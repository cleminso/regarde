import { co, z } from "jazz-tools";

import { PAYMENT_PROVIDERS } from "./paymentEvent";

export const REFUND_STATUSES = ["pending", "succeeded", "failed"] as const;
export type TRefundStatus = (typeof REFUND_STATUSES)[number];

/**
 * Refund line item for partial refunds with multiple items.
 */
export const RefundLineItem = co.map({
  description: z.string(),
  amount: z.number().describe("Refund amount for this line item"),
});

export type TRefundLineItem = co.loaded<typeof RefundLineItem>;

/**
 * Tracks refund operations and their status.
 *
 * Created by SDK when initiating a refund, updated by worker via webhooks.
 * Refunds can be partial or full (amount = original payment amount).
 *
 * @schema
 * - `appId`: RegardeApp ID
 * - `userAccountId`: Jazz account ID of the payer
 * - `paymentEventId`: Links to original PaymentEvent
 * - `provider`: Payment provider source
 * - `providerRefundId`: Provider's refund ID (filled after API call)
 * - `amount`: Refund amount in smallest currency unit (can be partial)
 * - `currency`: ISO 4217 currency code
 * - `reason`: Reason for refund (optional)
 * - `status`: Refund lifecycle status
 * - `lineItems`: Breakdown for partial refunds (optional)
 * - `createdAt`: Unix timestamp of creation
 * - `completedAt`: Unix timestamp of completion (optional)
 */
export const Refund = co.map({
  appId: z.string(),
  userAccountId: z.string(),
  paymentEventId: z.string().describe("Links to original PaymentEvent"),

  provider: z.enum(PAYMENT_PROVIDERS),
  providerRefundId: z.optional(z.string()).describe("Provider refund ID"),

  amount: z.number().describe("Refund amount in smallest currency unit"),
  currency: z.string().describe("ISO 4217 currency code"),
  reason: z.optional(z.string()),
  status: z.enum(REFUND_STATUSES),

  lineItems: co.optional(co.list(RefundLineItem)),

  providerMetadata: co.record(z.string(), z.string()),

  createdAt: z.number(),
  completedAt: z.optional(z.number()),
});

export type TRefund = co.loaded<typeof Refund>;

/**
 * App-level refund index.
 *
 * - `all`: providerRefundId -> Refund CoMap ID
 * - `byUser`: userAccountId -> providerRefundId -> Refund CoMap ID
 */
export const AppRefundIndex = co.map({
  all: co.record(z.string(), z.string()),
  byUser: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TAppRefundIndex = co.loaded<typeof AppRefundIndex>;

/**
 * SDK-level refund index.
 *
 * Maps refund IDs to Refund CoMap IDs.
 * - `all`: Global lookup by refundId
 * - `byApp`: App-scoped lookup by App.id -> refundId -> Refund.id
 */
export const SdkRefundIndex = co.map({
  all: co.record(z.string(), z.string()),
  byApp: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TSdkRefundIndex = co.loaded<typeof SdkRefundIndex>;
