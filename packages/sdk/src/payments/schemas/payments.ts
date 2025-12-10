import { Account, co, z } from "jazz-tools";
import { App } from "../../registry/schemas/registry";

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
 * - amount - Payment amount stored as string to avoid binary precision issues
 * - currency - Currency code for the payment
 * - timestamp - Unix timestamp when payment occurred
 * - paymentStatus - Current status of the payment event
 * - app - Reference to the App CoValue
 * - userAccount - Jazz Account ID of the user who made the payment
 */
export const PaymentEvent = co.map({
  amount: z.string(),
  currency: z.string().default("USD"),
  timestamp: z.number(),
  paymentStatus: z.enum(["pending", "completed", "failed", "cancelled"]),
  app: App,
  userAccount: Account,
  metadata: co.record(z.string(), z.string()), // json string everything then let sdk suer to fetch
});

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
export const ListOfPaymentEvents = co.feed(PaymentEvent);

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
  allMyPayments: ListOfPaymentEvents,
  paymentHistoryByApp: co.record(z.string(), ListOfPaymentEvents),
  version: z.number().default(1),
});

export type PaymentManagerLoaded = co.loaded<typeof PaymentManager>;
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
