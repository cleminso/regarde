import { co, z } from "jazz-tools";
import { App } from "./regardeUserApp";
import { UserHandle } from "./regardeUserHandle";
import { RegardeAuth } from "./regardeAuth";

export const PaymentSchema = co.map({
  all: co.record(z.string(), z.string()), // prefixedProviderEventUUID -> PaymentEvent.id
  byApp: co.record(z.string(), co.record(z.string(), z.string())), // App.id -> prefixedProviderEventUUID -> PaymentEvent.id
});

export type TPaymentSchema = co.loaded<typeof PaymentSchema>;

/**
 * Container schema for all Regarde SDK components
 * - userHandle - User's profile and nickname data
 * - auth - Authentication token for API requests
 * - payments - Payment manager for subscriptions and transactions
 * - version - Schema version for migration tracking
 */
export const RegardeSDK = co.map({
  auth: RegardeAuth,
  myApps: co.list(App),
  myPayments: PaymentSchema,
  myUserHandle: UserHandle,
  version: z.number(),
});
