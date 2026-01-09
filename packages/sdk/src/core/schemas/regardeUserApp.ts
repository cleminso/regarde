import { co, z } from "jazz-tools";

export const AppPaymentsSchema = co.map({
  all: co.record(z.string(), z.string()), // prefixedProviderEventUUID -> PaymentEvent.id
  byUser: co.record(z.string(), co.record(z.string(), z.string())), // JazzAccount.id -> prefixedProviderEventUUID -> PaymentEvent.id
});

export type TAppPaymentsSchema = co.loaded<typeof AppPaymentsSchema>;

export const App = co.map({
  name: z.string(),
  description: z.string(),
  ownerAccountId: z.string(),
  paymentProvider: z.enum(["lemonsqueezy", "stripe"]),
  isEnabled: z.boolean(), // default false
  createdAt: z.number(),
  metadata: co.record(z.string(), z.string()),
  webhookSecret: z.string(),
  payments: AppPaymentsSchema,
  // providerAppId: z.string(), verify if needed but we made it via metadat from webhook
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
