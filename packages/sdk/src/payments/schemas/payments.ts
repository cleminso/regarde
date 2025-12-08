import { co, z } from "jazz-tools";

/**
 * # PaymentEvent - Individual Payment Transaction Record
 *
 * ## Purpose
 * - Stores single payment transaction details from webhook events
 * - Maintains audit trail of all payment activity
 * - Enables payment history queries for end users
 *
 * ## Who creates this: Regarde Server/Worker
 * - Processed from payment provider webhook events
 * - Immutable record of payment transaction
 * - Permissions: Read access to user and app owner
 *
 * ## Fields
 * - id - Unique identifier for the payment event
 * - amount - Payment amount stored as string to avoid binary precision issues
 * - currency - Currency code for the payment
 * - timestamp - Unix timestamp when payment occurred
 * - type - Type of payment event (subscription, one-time, refund)
 * - status - Current status of the payment event
 * - description - Human-readable description of the payment
 * - appId - Reference to the App CoValue
 * - userJazzAccountId - Jazz Account ID of the user who made the payment
 * - planId - App-defined plan identifier
 * - subscriptionType - Legacy field for backward compatibility (monthly, yearly, one-time)
 * - providerSubscriptionId - Payment provider's subscription ID
 */
export const PaymentEvent = co.map({
  id: z.string(),
  amount: z.string(),
  currency: z.string().default("USD"),
  timestamp: z.number(),
  type: z.enum(["subscription", "one-time", "refund"]),
  status: z.enum(["pending", "completed", "failed", "cancelled"]),
  description: z.string(),
  appId: z.string(),
  userJazzAccountId: z.string(),
  planId: z.string(),
  subscriptionType: z.enum(["monthly", "yearly", "one-time"]),
  providerSubscriptionId: z.string(),
});

/**
 * # MySubscription - User's Subscription State
 *
 * ## Purpose
 * - Tracks user's active subscription status across different apps
 * - Enables access verification for SDK users
 * - Provides subscription history for end users
 *
 * ## Who creates this: Regarde Server/Worker
 * - Created/updated from payment provider webhook events
 * - Managed by Regarde system, not directly by SDK user or end user
 * - Permissions: Read access to end user and app owner
 *
 * ## Who accesses this:
 * - SDK User: Check if user has valid subscription
 * - End User: View their active subscriptions
 * - Regarde Worker: Update status from webhooks
 *
 * ## Fields
 * - id - Unique identifier for the subscription
 * - appId - Application identifier this subscription applies to
 * - planId - App-defined plan identifier
 * - planType - Type of billing model (subscription, license, addon)
 * - amount - Subscription amount stored as string to avoid binary precision issues
 * - currency - Currency code for the subscription
 * - status - Current subscription status
 * - startedAt - Unix timestamp when subscription started
 * - expiresAt - Unix timestamp when subscription expires or renews
 * - isAutoRenewing - Whether subscription automatically renews
 * - quantity - Number of seats/licenses (for seat-based licensing)
 * - licenseKeys - License keys for traditional licensing model
 * - hasAccess - Whether user currently has access based on payment status
 * - providerSubscriptionId - For canceling/renewing via provider
 */
export const MySubscription = co.map({
  id: z.string(),
  appId: z.string(),
  planId: z.string(),
  planType: z
    .enum(["subscription", "license", "addon"])
    .default("subscription"),
  amount: z.string(),
  currency: z.string().default("USD"),
  status: z.enum(["active", "cancelled", "expired", "pending"]),
  startedAt: z.number(),
  expiresAt: z.number(),
  isAutoRenewing: z.boolean().default(false),
  quantity: z.optional(z.number()),
  licenseKeys: co.optional(co.list(z.string())),
  hasAccess: z.boolean().default(true),
  providerSubscriptionId: z.string(),
});

/**
 * # ListOfMySubscriptions - Collection of User Subscriptions
 *
 * ## Purpose
 * - Container for all subscriptions belonging to a user
 * - Enables bulk operations and queries on user's subscriptions
 *
 * ## Who creates this: Regarde Server/Worker
 * - Initialized when user account is created
 * - Populated with subscription records from webhook events
 *
 * ## Who accesses this:
 * - SDK User: Check if user subscribes to their app
 * - End User: View all their subscriptions in UI
 */
export const ListOfMySubscriptions = co.list(MySubscription);

/**
 * # ListOfPaymentEvents - Collection of Payment Records
 *
 * ## Purpose
 * - Container for all payment transactions belonging to a user
 * - Maintains complete payment history for audit and display
 *
 * ## Who creates this: Regarde Server/Worker
 * - Initialized when user account is created
 * - Populated with payment records from webhook events
 *
 * ## Who accesses this:
 * - SDK User: View payment history for their customers
 * - End User: View their own payment transactions
 */
export const ListOfPaymentEvents = co.list(PaymentEvent);

/**
 * # PaymentManager - User Payment Data Container
 *
 * ## Purpose
 * - Root container for all payment-related data for a user
 * - Organized access point for subscription and payment history
 * - Enables schema migration and versioning
 *
 * ## Who creates this: Regarde SDK
 * - Automatically initialized when user account is created
 * - Stored in user's RegardeSDK payments field
 *
 * ## Who accesses this:
 * - SDK User: Access through hooks (useMySubscriptions, usePaymentHistory)
 * - End User: Access through SDK-provided UI components
 * - Regarde Worker: Updates subscription status via webhooks
 *
 * ## Fields
 * - mySubscriptions - List of user's current and past subscriptions
 * - paymentHistory - Complete payment transaction history
 * - version - Schema version for migration tracking
 */
export const PaymentManager = co.map({
  mySubscriptions: co.optional(ListOfMySubscriptions),
  paymentHistory: co.optional(ListOfPaymentEvents),
  version: z.number().default(1),
});

export type PaymentManagerLoaded = co.loaded<typeof PaymentManager>;
export type MySubscriptionLoaded = co.loaded<typeof MySubscription>;
export type PaymentEventLoaded = co.loaded<typeof PaymentEvent>;

/**
 * # Type Definitions
 *
 * ## Who uses these types:
 * - SDK User: Type safety when accessing payment data through hooks
 * - End User: Type safety in React components displaying subscription info
 * - Regarde Worker: Type safety when processing webhook events
 *
 * ## Purpose:
 * - Provides TypeScript type safety for all payment-related operations
 * - Enables IDE autocompletion and compile-time error checking
 * - Documents the structure of payment data for all consumers
 */
