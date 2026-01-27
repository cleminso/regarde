import { co, z } from "jazz-tools";

import { RegardeAuth } from "./regardeAuth";
import { App } from "./regardeUserApp";
import { UserHandle } from "./regardeUserHandle";

/**
 * Payment records structure.
 *
 * Maps provider event UUIDs to PaymentEvent CoMap IDs.
 */
export const PaymentSchema = co.map({
  all: co.record(z.string(), z.string()), // prefixedProviderEventUUID -> PaymentEvent.id
  byApp: co.record(z.string(), co.record(z.string(), z.string())), // App.id -> prefixedProviderEventUUID -> PaymentEvent.id
});

/** Loaded PaymentSchema instance */
export type TPaymentSchema = co.loaded<typeof PaymentSchema>;

/**
 * Regarde SDK container schema.
 *
 * Holds all SDK components for user account.
 *
 * @schema
 * - `auth`: Authentication token (RegardeAuth)
 * - `myApps`: List of user's apps
 * - `myPayments`: Payment records indexed by app
 * - `myUserHandle`: User profile and nickname
 * - `version`: Schema version for migration tracking
 */
export const RegardeSDK = co.map({
  auth: RegardeAuth,
  myApps: co.list(App),
  myPayments: PaymentSchema,
  myUserHandle: UserHandle,
  version: z.number(),
});
