import { co, z } from "jazz-tools";

/**
 * Individual payment transaction record.
 *
 * Created by worker from payment provider webhook events.
 * Amount stored as string to avoid precision issues.
 *
 * Fields:
 * - `amount`: Payment amount
 * - `app`: App ID for the payment
 * - `currency`: Payment currency code
 * - `metadata`: Additional payment data
 * - `prefixedProviderEventUUID`: Provider event identifier
 * - `paymentStatus`: pending, completed, failed, or cancelled
 * - `timestamp`: Unix timestamp of payment
 * - `userAccount`: Jazz account ID of user who paid
 */
export const PaymentEvent = co.map({
  amount: z.string(),
  app: z.string().describe("App for which the payment was done"),
  currency: z.string(),
  metadata: co.record(z.string(), z.string()),
  prefixedProviderEventUUID: z.string(),
  paymentStatus: z.enum(["pending", "completed", "failed", "cancelled"]),
  timestamp: z.number(),
  userAccount: z.string(),
});

/** Loaded PaymentEvent instance */
export type TPaymentEvent = co.loaded<typeof PaymentEvent>;

/**
 * Collection of payment transactions.
 *
 * Maintains complete payment history for a user.
 */
export const ListOfPaymentEvents = co.list(PaymentEvent);

/** Loaded ListOfPaymentEvents instance */
export type TListOfPaymentEvents = co.loaded<typeof ListOfPaymentEvents>;
