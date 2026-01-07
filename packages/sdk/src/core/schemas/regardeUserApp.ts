import { co, z } from "jazz-tools";
import { ListOfPaymentEvents } from "./paymentEvent";

export const App = co.map({
  name: z.string(),
  description: z.string(),
  ownerAccountId: z.string(),
  paymentProvider: z.enum(["lemonsqueezy", "stripe"]),
  // providerAppId: z.string(), verify if needed but we made it via metadat from webhook
  isEnabled: z.boolean(), // default false
  createdAt: z.number(),
  metadata: co.record(z.string(), z.string()),
  webhookSecret: z.string(),
  payments: co.map({
    all: ListOfPaymentEvents,
    byUser: co.record(z.string(), ListOfPaymentEvents),
  }),
});
export type TApp = co.loaded<typeof App>;

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
