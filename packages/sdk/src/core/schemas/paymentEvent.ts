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
 * - amount - Payment amount stored as string to avoid binary precision issues
 * - currency - Currency code for the payment
 * - timestamp - Unix timestamp when payment occurred
 * - paymentStatus - Current status of the payment event
 * - app - App ID string (reference)
 * - userAccount - Jazz Account ID of the user who made the payment
 */
export const PaymentEvent = co.map({
  amount: z.string(),
  currency: z.string(),
  timestamp: z.number(),
  paymentStatus: z.enum(["pending", "completed", "failed", "cancelled"]),
  app: z.string().describe("App for which the payment was done"),
  userAccount: z.string(),
  metadata: co.record(z.string(), z.string()),
});
export type TPaymentEvent = co.loaded<typeof PaymentEvent>;

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
export type TListOfPaymentEvents = co.loaded<typeof ListOfPaymentEvents>;
