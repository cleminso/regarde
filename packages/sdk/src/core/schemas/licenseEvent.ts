import { co, z } from "jazz-tools";

import { PAYMENT_PROVIDERS } from "./paymentEvent";

export const LICENSE_EVENT_TYPES = [
  "license.created",
  "license.updated",
  "license.revoked",
] as const;
export type TLicenseEventType = (typeof LICENSE_EVENT_TYPES)[number];

export const LICENSE_STATUSES = ["active", "inactive", "revoked"] as const;

/**
 * Immutable license/access event record.
 *
 * Created by worker from license-related webhook events.
 * Supports different provider concepts:
 * - LemonSqueezy: License keys (licenseKey, productId)
 * - Stripe: Entitlements (entitlementId)
 * - Polar: Benefit grants (benefitId, grantId)
 *
 * @schema
 * - `provider`: Payment provider source
 * - `mode`: Test or production mode
 * - `providerEventId`: Native provider event ID
 * - `prefixedProviderEventUUID`: Prefixed ID for deduplication
 * - `eventType`: Unified event type (license.created, .updated, .revoked)
 * - `app`: App CoMap ID
 * - `userAccount`: Jazz account ID
 * - `licenseKey`: LemonSqueezy license key (optional)
 * - `productId`: Product identifier (optional)
 * - `entitlementId`: Stripe entitlement ID (optional)
 * - `benefitId`: Polar benefit ID (optional)
 * - `grantId`: Polar grant ID (optional)
 * - `status`: License status (active, inactive, revoked)
 * - `providerMetadata`: Provider-specific extras
 * - `metadata`: Legacy metadata
 * - `timestamp`: Unix timestamp of event
 */
export const LicenseEvent = co.map({
  provider: z.enum(PAYMENT_PROVIDERS),
  mode: z.enum(["test", "production"]),

  providerEventId: z.string(),
  prefixedProviderEventUUID: z.string(),
  eventType: z.enum(LICENSE_EVENT_TYPES),

  app: z.string().describe("App CoMap ID for which the payment was done"),
  userAccount: z
    .string()
    .describe("JazzAccountId by which the payment was done"),

  licenseKey: z.optional(z.string()),
  productId: z.optional(z.string()),
  entitlementId: z.optional(z.string()),
  benefitId: z.optional(z.string()),
  grantId: z.optional(z.string()),
  status: z.enum(LICENSE_STATUSES),

  providerMetadata: co.record(z.string(), z.string()),
  metadata: co.record(z.string(), z.string()),
  timestamp: z.number(),
});

export type TLicenseEvent = co.loaded<typeof LicenseEvent>;
