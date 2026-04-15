import { co, z } from "jazz-tools";

import { SdkRefundIndex } from "./refund";
import { RegardeTokenAuth } from "./regardeTokenAuth";
import { RegardeApp } from "./regardeUserApp";
import { UserHandle } from "./regardeUserHandle";

/**
 * Payment index structure.
 *
 * Maps provider event UUIDs to PaymentEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID
 * - `byApp`: App-scoped lookup by App.id -> prefixedProviderEventUUID -> PaymentEvent.id
 */
export const SdkPaymentIndex = co.map({
  all: co.record(z.string(), z.string()),
  byApp: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TSdkPaymentIndex = co.loaded<typeof SdkPaymentIndex>;

/**
 * Subscription index structure.
 *
 * Maps provider event UUIDs to SubscriptionEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID
 * - `byApp`: App-scoped lookup by App.id -> prefixedProviderEventUUID -> SubscriptionEvent.id
 * - `status`: Mutable subscription state by providerSubscriptionId -> Subscription.id
 */
export const SdkSubscriptionIndex = co.map({
  all: co.record(z.string(), z.string()),
  byApp: co.record(z.string(), co.record(z.string(), z.string())),
  status: co.record(z.string(), z.string()),
});

export type TSdkSubscriptionIndex = co.loaded<typeof SdkSubscriptionIndex>;

/**
 * License index structure.
 *
 * Maps provider event UUIDs to LicenseEvent CoMap IDs.
 * - `all`: Global lookup by prefixedProviderEventUUID
 * - `byApp`: App-scoped lookup by App.id -> prefixedProviderEventUUID -> LicenseEvent.id
 */
export const SdkLicenseIndex = co.map({
  all: co.record(z.string(), z.string()),
  byApp: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TSdkLicenseIndex = co.loaded<typeof SdkLicenseIndex>;

/**
 * Invoice index structure.
 *
 * Maps invoice IDs to Invoice CoMap IDs.
 * - `all`: Global lookup by invoiceId
 * - `byApp`: App-scoped lookup by App.id -> invoiceId -> Invoice.id
 */
export const SdkInvoiceIndex = co.map({
  all: co.record(z.string(), z.string()),
  byApp: co.record(z.string(), co.record(z.string(), z.string())),
});

export type TSdkInvoiceIndex = co.loaded<typeof SdkInvoiceIndex>;

/** Shared list schema for the current user's apps */
export const MyAppsList = co.list(RegardeApp);

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
  myApps: MyAppsList,
  myPayments: SdkPaymentIndex,
  mySubscriptions: SdkSubscriptionIndex,
  myLicenses: SdkLicenseIndex,
  myInvoices: SdkInvoiceIndex,
  myRefunds: SdkRefundIndex,
  myUserHandle: UserHandle,
  version: z.number(),
});

/** Loaded RegardeSDK instance */
export type TRegardeSDK = co.loaded<typeof RegardeSDK>;
