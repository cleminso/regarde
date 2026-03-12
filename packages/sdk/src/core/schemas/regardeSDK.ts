import { co, z } from "jazz-tools";

import { RefundSchema } from "./refund";
import { RegardeTokenAuth } from "./regardeTokenAuth";
import { RegardeApp } from "./regardeUserApp";
import { UserHandle } from "./regardeUserHandle";

/**
 * Payment records structure.
 *
 * Maps provider event UUIDs to PaymentEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID
 * - `byApp`: App-scoped lookup by App.id -> prefixedProviderEventUUID -> PaymentEvent.id
 */
export const PaymentSchema = co.map({
  all: co.record(z.string(), z.string()),
  byApp: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TPaymentSchema = co.loaded<typeof PaymentSchema>;

/**
 * Subscription records structure.
 *
 * Maps provider event UUIDs to SubscriptionEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID
 * - `byApp`: App-scoped lookup by App.id -> prefixedProviderEventUUID -> SubscriptionEvent.id
 * - `status`: Mutable subscription state by providerSubscriptionId -> Subscription.id
 */
export const SubscriptionSchema = co.map({
  all: co.record(z.string(), z.string()),
  byApp: co.record(z.string(), co.record(z.string(), z.string())),
  status: co.record(z.string(), z.string()),
});

export type TSubscriptionSchema = co.loaded<typeof SubscriptionSchema>;

/**
 * License records structure.
 *
 * Maps provider event UUIDs to LicenseEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID
 * - `byApp`: App-scoped lookup by App.id -> prefixedProviderEventUUID -> LicenseEvent.id
 */
export const LicenseSchema = co.map({
  all: co.record(z.string(), z.string()),
  byApp: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TLicenseSchema = co.loaded<typeof LicenseSchema>;

/**
 * Invoice records structure.
 *
 * Maps invoice IDs to Invoice CoMap IDs.
 * - `all`: Global lookup by invoiceId
 * - `byApp`: App-scoped lookup by App.id -> invoiceId -> Invoice.id
 */
export const InvoiceSchema = co.map({
  all: co.record(z.string(), z.string()),
  byApp: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TInvoiceSchema = co.loaded<typeof InvoiceSchema>;

/**
 * Regarde SDK container schema.
 *
 * Holds all SDK components for user account.
 *
 * @schema
 * - `auth`: Authentication token (RegardeTokenAuth)
 * - `myApps`: List of user's apps
 * - `myPayments`: Payment event records indexed by provider UUID and App ID
 * - `mySubscriptions`: Subscription event records + mutable subscription state
 * - `myLicenses`: License event records indexed by provider UUID and App ID
 * - `myInvoices`: Invoice records indexed by invoice ID and App ID
 * - `myRefunds`: Refund records indexed by refund ID and App ID
 * - `myUserHandle`: User profile and nickname
 * - `version`: Schema version for migration tracking
 */
export const RegardeSDK = co.map({
  // TODO: `auth` become semantically wrong here? Still convenient to write `auth.token`
  auth: RegardeTokenAuth,
  myApps: co.list(RegardeApp),
  myPayments: PaymentSchema,
  mySubscriptions: SubscriptionSchema,
  myLicenses: LicenseSchema,
  myInvoices: InvoiceSchema,
  myRefunds: RefundSchema,
  myUserHandle: UserHandle,
  version: z.number(),
});

/** Loaded RegardeSDK instance */
export type TRegardeSDK = co.loaded<typeof RegardeSDK>;
