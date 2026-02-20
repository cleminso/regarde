# Regarde Payment System Architecture

## Overview

This document captures all architectural decisions made for the Regarde payment system, including the rationale behind each choice and implementation details.

**Last Updated:** 2026-02-19  
**Status:** Approved for Implementation

---

## Table of Contents

1. [Mental Model](#mental-model)
2. [Provider Prefixes](#provider-prefixes)
3. [Event Normalization Strategy](#event-normalization-strategy)
4. [Event Types & CoMaps](#event-types--comaps)
5. [Data Model](#data-model)
6. [Idempotency Strategy](#idempotency-strategy)
7. [Event Flow Examples](#event-flow-examples)
8. [Schema Definitions](#schema-definitions)
9. [Key Decisions & Rationale](#key-decisions--rationale)
10. [Directory Structure](#directory-structure)

---

## Mental Model

### The Core Equation

```
SDK User's App <> Payment Provider Dashboard <> Regarde API <> Jazz CoValues
      │                  (test/prod mode)        (webhook)      (storage)
      │                      │                       │              │
      │                      │  1. Configure         │  2. Receive  │  3. Query
      │                      │     webhook URL       │     webhook  │     payments
      │                      │                       │              │
      ▼                      ▼                       ▼              ▼
   Uses SDK to          Sets test/prod          Validates sig    Displays in
   query payments        in provider UI          Stores event     dashboard
```

### Regarde's Role

**Regarde is a webhook receiver and normalizer**:

- Receives webhooks from payment providers
- Normalizes provider-specific payloads to unified formats
- Stores events in Jazz CoValues
- Provides SDK for querying payment data

**What Regarde does NOT do:**

- Create checkouts or charge customers (SDK User does this in provider dashboard)
- Store provider API keys (SDK User manages these in provider dashboard)
- Process payments (provider handles this)

---

## Provider Prefixes

To distinguish events from different providers, we use prefixed IDs:

| Provider     | Prefix | Native Format | Example                                   |
| ------------ | ------ | ------------- | ----------------------------------------- |
| LemonSqueezy | `LS_`  | UUID          | `LS_89b36d62-4f5c-4353-853f-0c769d0535c8` |
| Stripe       | `ST_`  | `evt_*`       | `ST_evt_1NG8Du2eZvKYlo2CUI79vXWy`         |
| Polar        | `PO_`  | UUID          | `PO_1dbfc517-0bbf-4301-9ba8-555ca42b9737` |

**Rationale:**

- **Format:** `{provider}_{providerEventId}` - We use the provider's native event ID as-is
- Prevents ID collisions across providers (while unlikely, UUID collisions are possible)
- Clear identification of event source
- No artificial modifications to provider IDs

**Provider Event ID Formats (from official docs):**

- **Stripe:** `evt_{random_string}` (e.g., `evt_1NG8Du2eZvKYlo2CUI79vXWy`)
- **Polar:** UUID v4 (e.g., `1dbfc517-0bbf-4301-9ba8-555ca42b9737`)
- **LemonSqueezy:** UUID (e.g., `89b36d62-4f5c-4353-853f-0c769d0535c8`)

---

## Event Normalization Strategy

### Overview

Our normalization approach is inspired by [PayKit](https://www.usepaykit.dev/)'s unified payment API pattern. We map provider-specific webhook events to standardized event types, enabling consistent handling across LemonSqueezy, Stripe, and Polar.

### Normalization Location

**Location:** `/packages/api.regarde.dev/src/domains/payments/adapters/`

**Rationale:**

- Webhook signature validation is HTTP/API-specific
- SDK users query already-normalized events from Jazz CoValues
- Keeps SDK lean (no webhook parsing logic needed)
- Follows separation of concerns: API handles ingestion, SDK handles querying

### Unified Event Types

We adopt PayKit-inspired naming conventions for consistency across providers:

#### Payment Events

| Unified Type       | Description        | Provider Mappings                                                                           |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------- |
| `payment.created`  | Successful payment | LS: `order_created`<br>ST: `checkout.session.completed`, `invoice.paid`<br>PO: `order.paid` |
| `payment.failed`   | Failed payment     | LS: `subscription_payment_failed`<br>ST: `invoice.payment_failed`                           |
| `payment.refunded` | Refunded payment   | LS: `order_refunded`                                                                        |

#### Subscription Events

| Unified Type            | Description              | Provider Mappings                                                                                  |
| ----------------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| `subscription.created`  | New subscription created | LS: `subscription_created`<br>ST: `customer.subscription.created`<br>PO: `subscription.created`    |
| `subscription.canceled` | Subscription canceled    | LS: `subscription_cancelled`<br>ST: `customer.subscription.deleted`<br>PO: `subscription.canceled` |
| `subscription.updated`  | Subscription updated     | LS: `subscription_updated`<br>ST: `customer.subscription.updated`                                  |

#### License Events

Each provider has a different concept for granting/revoking access to products:

| Unified Type      | Description    | Provider Mappings                                                                                                                                            |
| ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `license.created` | Access granted | LS: `license_key_created`<br>ST: `entitlements.active_entitlement_summary.updated` (when new entitlements added)<br>PO: `benefit_grant.created`              |
| `license.updated` | Access updated | LS: `license_key_updated`<br>ST: `entitlements.active_entitlement_summary.updated` (when entitlements change)<br>PO: `benefit_grant.updated`                 |
| `license.revoked` | Access revoked | LS: `license_key_revoked` (if available)<br>ST: `entitlements.active_entitlement_summary.updated` (when entitlements removed)<br>PO: `benefit_grant.revoked` |

### Adapter Interface

Each provider implements a standard adapter interface:

```typescript
interface PaymentProviderAdapter {
  validateSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean;
  extractMode(payload: unknown): "test" | "production";
  extractEventType(payload: unknown): string;
  normalizeEvent(payload: unknown): NormalizedEvent;
}
```

### NormalizedEvent Structure

```typescript
interface NormalizedEvent {
  // Identification
  provider: "lemonsqueezy" | "stripe" | "polar";
  providerEventId: string; // Native provider ID (UUID or evt_*)
  prefixedProviderEventUUID: string; // LS_, ST_, PO_ prefix
  eventType:
    | "payment.created"
    | "payment.failed"
    | "payment.refunded"
    | "subscription.created"
    | "subscription.canceled"
    | "subscription.updated"
    | "license.created"
    | "license.updated"
    | "license.revoked";

  // Context
  mode: "test" | "production";
  timestamp: number;
  app: string; // Jazz CoMap ID
  userAccount: string; // Jazz Account ID

  // Provider-specific extras (PayKit pattern)
  providerMetadata: Record<string, string>;

  // Event-specific data
  data: PaymentData | SubscriptionData | LicenseData;
}
```

### Mode Extraction by Provider

| Provider     | Field            | Logic                         |
| ------------ | ---------------- | ----------------------------- |
| LemonSqueezy | `meta.test_mode` | `test_mode === true` → "test" |
| Stripe       | `livemode`       | `livemode === false` → "test" |
| Polar        | Environment      | Sandbox endpoint → "test"     |

---

## Event Types & CoMaps

### Three Types of Events

| Event Type            | When Created                                                | Mutable State        |
| --------------------- | ----------------------------------------------------------- | -------------------- |
| **PaymentEvent**      | Any transaction (one-time or subscription payment)          | None (immutable log) |
| **SubscriptionEvent** | Subscription lifecycle changes (created, canceled, updated) | Subscription CoMap   |
| **LicenseEvent**      | License/benefit/entitlement events (access management)      | None (immutable log) |

### Decision Matrix

| Webhook Event         | Creates                                | Updates            | Example                 |
| --------------------- | -------------------------------------- | ------------------ | ----------------------- |
| One-time order        | PaymentEvent                           | —                  | `order_created`         |
| Subscription created  | SubscriptionEvent + Subscription CoMap | —                  | `subscription.created`  |
| Subscription renewed  | PaymentEvent                           | Subscription CoMap | `invoice.paid`          |
| Subscription canceled | SubscriptionEvent                      | Subscription CoMap | `subscription.canceled` |
| License created       | LicenseEvent                           | —                  | `license_key_created`   |

---

## Data Model

### RegardeSDK Schema

```typescript
export const RegardeSDK = co.map({
  auth: RegardeTokenAuth,
  myApps: co.list(App),

  // Payment events (immutable log)
  myPayments: PaymentSchema,

  // Subscription events (immutable log) + current status (mutable state)
  mySubscriptions: SubscriptionSchema,

  // License events (immutable log)
  myLicenses: LicenseSchema,

  myUserHandle: UserHandle,
  version: z.number(),
});
```

### Schema Pattern (Consistent Across All Types)

Each event type follows the same nested CoRecord pattern:

```typescript
export const PaymentSchema = co.map({
  all: co.record(z.string(), z.string()),
  // Key: prefixedProviderEventUUID (e.g., "LS_evt123")
  // Value: PaymentEvent CoMap ID

  byApp: co.record(z.string(), co.record(z.string(), z.string())),
  // Key: App.id
  // Value: { prefixedProviderEventUUID -> PaymentEvent.id }
});

export const SubscriptionSchema = co.map({
  all: co.record(z.string(), z.string()),
  // Key: prefixedProviderEventUUID (e.g., "ST_sub123")
  // Value: SubscriptionEvent CoMap ID

  byApp: co.record(z.string(), co.record(z.string(), z.string())),
  // Key: App.id
  // Value: { prefixedProviderEventUUID -> SubscriptionEvent.id }

  status: co.record(z.string(), z.string()),
  // Key: providerSubscriptionId (e.g., "sub_123")
  // Value: Subscription CoMap ID (mutable current state)
});

export const LicenseSchema = co.map({
  all: co.record(z.string(), z.string()),
  // Key: prefixedProviderEventUUID (e.g., "LS_lic123")
  // Value: LicenseEvent CoMap ID

  byApp: co.record(z.string(), co.record(z.string(), z.string())),
  // Key: App.id
  // Value: { prefixedProviderEventUUID -> LicenseEvent.id }
});
```

**Rationale for CoRecord pattern:**

- O(1) lookup by provider event ID
- Efficient app-scoped queries
- Consistent with existing PaymentSchema
- Jazz-optimized for ID-based access
- **Dashboard-optimized:** Nested `status` allows loading events + state together

---

## Idempotency Strategy

### Single Index for All Events

We reuse the existing `ProcessedProviderEvents` from the worker schema:

```typescript
export const ProcessedProviderEvents = co.record(z.string(), z.string());
// Key: "{provider}_{providerEventId}"
// Value: Event CoMap ID (PaymentEvent, SubscriptionEvent, or LicenseEvent)
```

**Examples:**

- `"LS_89b36d62-4f5c-4353-853f-0c769d0535c8"` → PaymentEvent ID
- `"ST_evt_1NG8Du2eZvKYlo2CUI79vXWy"` → SubscriptionEvent ID
- `"PO_1dbfc517-0bbf-4301-9ba8-555ca42b9737"` → PaymentEvent ID

**Rationale:**

- Provider event IDs are unique across all event types
- Single index is simpler than multiple indexes
- Memory efficient

### Deduplication Flow

```typescript
const compositeKey = `${provider}_${providerEventId}`;

if (worker.root.processedProviderEvents[compositeKey]) {
  // Already processed - skip
  return { success: true, duplicate: true };
}

// Process event...
// Store in index
worker.root.processedProviderEvents.$jazz.set(compositeKey, event.$jazz.id);
```

---

## Event Flow Examples

### Example 1: One-Time Purchase (LemonSqueezy)

**Webhook:** `order_created`

```
1. Receive webhook
   ↓
2. Validate signature
   ↓
3. Check idempotency: processedProviderEvents["LS_evt123"] exists?
   ↓ No
4. Normalize event
   ↓
5. Create PaymentEvent:
    {
      provider: "lemonsqueezy",
      mode: "production",
      providerEventId: "89b36d62...",
      prefixedProviderEventUUID: "LS_89b36d62...",
      eventType: "payment.created",
      amount: "29.00",
      currency: "USD",
      status: "succeeded",
      app: "co_zApp456",
      userAccount: "co_zUser789",
      providerSubscriptionId: undefined,
      providerLicenseId: undefined,
      providerMetadata: { orderNumber: "123" },
      metadata: { orderNumber: "123" },
      timestamp: 1704067200000
    }
   ↓
6. Update indexes:
   - myPayments.all["LS_89b36d62..."] = PaymentEvent.id
   - myPayments.byApp[appId]["LS_89b36d62..."] = PaymentEvent.id
   ↓
7. Mark as processed:
   - processedProviderEvents["LS_89b36d62..."] = PaymentEvent.id
   ↓
8. Return 200 OK
```

### Example 2: New Subscription (Stripe)

**Webhook:** `customer.subscription.created`

```
1. Receive webhook
   ↓
2. Validate signature
   ↓
3. Check idempotency: processedProviderEvents["ST_evt456"] exists?
   ↓ No
4. Normalize event
   ↓
5. Create SubscriptionEvent (immutable log):
    {
      provider: "stripe",
      mode: "production",
      providerEventId: "evt_stripe123",
      prefixedProviderEventUUID: "ST_evt_stripe123",
      eventType: "subscription.created",
      providerSubscriptionId: "sub_stripe456",
      status: "active",
      currentPeriodStart: 1704067200000,
      currentPeriodEnd: 1706745600000,
      planId: "price_monthly",
      app: "co_zApp456",
      userAccount: "co_zUser789",
      providerMetadata: {},
      metadata: {},
      timestamp: 1704067200000
    }
   ↓
6. Create Subscription CoMap (mutable state):
   {
     app: "co_zApp456",
     userAccount: "co_zUser789",
     provider: "stripe",
     providerSubscriptionId: "sub_stripe456",
     createdByEventId: "co_zSubEvent001",
     lastSubscriptionEventId: "co_zSubEvent001",
     status: "active",
     currentPeriodStart: 1704067200000,
     currentPeriodEnd: 1706745600000,
     planId: "price_monthly",
     createdAt: 1704067200000,
     updatedAt: 1704067200000
   }
   ↓
7. Update indexes:
   - mySubscriptions.all["ST_evt_stripe123"] = SubscriptionEvent.id
   - mySubscriptions.byApp[appId]["ST_evt_stripe123"] = SubscriptionEvent.id
   - mySubscriptions.status["sub_stripe456"] = Subscription.id
   ↓
8. Mark as processed:
   - processedProviderEvents["ST_evt_stripe123"] = SubscriptionEvent.id
   ↓
9. Return 200 OK
```

### Example 3: Subscription Renewal (Stripe)

**Webhook:** `invoice.paid` (recurring)

```
1. Receive webhook
   ↓
2. Validate signature
   ↓
3. Check idempotency: processedProviderEvents["ST_evt789"] exists?
   ↓ No
4. Normalize event
   ↓
5. Create PaymentEvent:
    {
      provider: "stripe",
      mode: "production",
      providerEventId: "evt_stripe789",
      prefixedProviderEventUUID: "ST_evt_stripe789",
      eventType: "payment.created",
      amount: "29.00",
      currency: "USD",
      status: "succeeded",
      app: "co_zApp456",
      userAccount: "co_zUser789",
      providerSubscriptionId: "sub_stripe456",  // Links to subscription
      providerMetadata: { invoiceId: "in_invoice123" },
      metadata: { invoiceId: "in_invoice123" },
      timestamp: 1706745600000
    }
   ↓
6. Find existing Subscription:
   - Lookup: mySubscriptions.status["sub_stripe456"]
   - Result: "co_zSubscription001"
   ↓
7. Update Subscription CoMap:
   - lastPaymentEventId: "co_zPayment124"
   - currentPeriodStart: 1706745600000
   - currentPeriodEnd: 1709424000000
   - updatedAt: 1706745600000
   ↓
8. Update indexes:
   - myPayments.all["ST_evt_stripe789"] = PaymentEvent.id
   - myPayments.byApp[appId]["ST_evt_stripe789"] = PaymentEvent.id
   ↓
9. Mark as processed:
   - processedProviderEvents["ST_evt_stripe789"] = PaymentEvent.id
   ↓
10. Return 200 OK
```

---

## Schema Definitions

### PaymentEvent

```typescript
export const PaymentEvent = co.map({
  // Provider identification
  provider: z.enum(["lemonsqueezy", "stripe", "polar"]),
  mode: z.enum(["test", "production"]),

  // Event identification
  providerEventId: z.string(), // Native provider ID
  prefixedProviderEventUUID: z.string(), // LS_evt123, ST_evt456, PO_evt789
  eventType: z.enum(["payment.created", "payment.failed", "payment.refunded"]),

  // App/User context
  app: z.string(),
  userAccount: z.string(),

  // Payment details
  amount: z.string(),
  currency: z.string(),
  status: z.enum(["succeeded", "failed", "refunded", "pending"]),

  // Optional references to other entities
  providerSubscriptionId: z.string().optional(),
  providerLicenseId: z.string().optional(),

  // Provider-specific metadata (PayKit pattern)
  providerMetadata: co.record(z.string(), z.string()),

  // Legacy metadata (deprecated, use providerMetadata)
  metadata: co.record(z.string(), z.string()),
  timestamp: z.number(),
});
```

### SubscriptionEvent

```typescript
export const SubscriptionEvent = co.map({
  // Provider identification
  provider: z.enum(["lemonsqueezy", "stripe", "polar"]),
  mode: z.enum(["test", "production"]),

  // Event identification
  providerEventId: z.string(), // Native provider ID
  prefixedProviderEventUUID: z.string(), // LS_sub123, ST_sub456, PO_sub789
  eventType: z.enum([
    "subscription.created",
    "subscription.canceled",
    "subscription.updated",
  ]),

  // App/User context
  app: z.string(),
  userAccount: z.string(),

  // Subscription details
  providerSubscriptionId: z.string(),
  status: z.enum(["trialing", "active", "past_due", "canceled", "expired"]),
  currentPeriodStart: z.number().optional(),
  currentPeriodEnd: z.number().optional(),
  planId: z.string().optional(),

  // Provider-specific metadata (PayKit pattern)
  providerMetadata: co.record(z.string(), z.string()),

  // Legacy metadata (deprecated, use providerMetadata)
  metadata: co.record(z.string(), z.string()),
  timestamp: z.number(),
});
```

### Subscription (Mutable State)

```typescript
export const Subscription = co.map({
  // IDs
  app: z.string(),
  userAccount: z.string(),
  provider: z.enum(["lemonsqueezy", "stripe", "polar"]),
  providerSubscriptionId: z.string(), // Lookup key

  // References to events
  createdByEventId: z.string(),
  lastSubscriptionEventId: z.string(),
  lastPaymentEventId: z.string().optional(),
  canceledByEventId: z.string().optional(),

  // Current state
  status: z.enum(["trialing", "active", "past_due", "canceled", "expired"]),
  currentPeriodStart: z.number(),
  currentPeriodEnd: z.number(),
  planId: z.string(),
  cancelAtPeriodEnd: z.boolean().default(false),

  // Timestamps
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

### LicenseEvent

```typescript
export const LicenseEvent = co.map({
  // Provider identification
  provider: z.enum(["lemonsqueezy", "stripe", "polar"]),
  mode: z.enum(["test", "production"]),

  // Event identification
  providerEventId: z.string(), // Native provider ID
  prefixedProviderEventUUID: z.string(), // LS_lic123, ST_evt456, PO_evt789
  eventType: z.enum(["license.created", "license.updated", "license.revoked"]),

  // App/User context
  app: z.string(),
  userAccount: z.string(),

  // License/Access details (provider-specific)
  // LemonSqueezy: licenseKey, productId
  // Stripe: entitlementId, featureId (from entitlements)
  // Polar: benefitId, grantId (from benefit grants)
  licenseKey: z.string().optional(), // LemonSqueezy license key
  productId: z.string().optional(), // Product identifier
  entitlementId: z.string().optional(), // Stripe entitlement ID
  benefitId: z.string().optional(), // Polar benefit ID
  grantId: z.string().optional(), // Polar grant ID
  status: z.enum(["active", "inactive", "revoked"]),

  // Provider-specific metadata (PayKit pattern)
  providerMetadata: co.record(z.string(), z.string()),

  // Legacy metadata (deprecated, use providerMetadata)
  metadata: co.record(z.string(), z.string()),
  timestamp: z.number(),
});
```

---

## Key Decisions & Rationale

### 1. Separate CoMaps for Each Event Type

**Decision:** Use `PaymentEvent`, `SubscriptionEvent`, and `LicenseEvent` as separate CoMap types.

**Rationale:**

- Type safety: Each event has different fields
- Clear separation of concerns
- Easier to query specific event types
- Avoids many optional fields in a single type

**Alternative considered:** Single `Event` CoMap with discriminated union

- Rejected: Harder to query, type narrowing complexity

### 2. CoRecord Pattern for Indexes

**Decision:** Use nested CoRecords (`all` and `byApp`) instead of CoLists

**Rationale:**

- O(1) lookup by provider event ID
- Efficient app-scoped queries
- Consistent with existing `PaymentSchema`
- Jazz-optimized for ID-based access

**Alternative considered:** CoLists

- Rejected: O(n) scan required for lookups, inconsistent with existing code

### 3. Immutable Events + Mutable State

**Decision:**

- Events (PaymentEvent, SubscriptionEvent, LicenseEvent) are immutable
- Subscription CoMap is mutable and updated by events

**Rationale:**

- Events provide audit trail
- Mutable state provides current status
- Separates "what happened" from "current state"

### 4. Provider Prefixes

**Decision:** Use `LS_`, `ST_`, `PO_` prefixes for provider event IDs

**Rationale:**

- Prevents ID collisions across providers
- Clear identification of event source
- Consistent lookup key format

### 5. Test/Production Mode Extraction

**Decision:** Extract mode from webhook payload metadata, not separate endpoints

**Rationale:**

- Simpler configuration (one webhook URL per app)
- Provider already includes mode in payload
- No need for SDK User to configure mode in Regarde

**Mode extraction by provider:**

- LemonSqueezy: `meta.test_mode` (boolean)
- Stripe: `livemode` (boolean, inverted)
- Polar: Sandbox environment (separate API endpoint)

### 6. Single Idempotency Index

**Decision:** Reuse `ProcessedProviderEvents` for all event types

**Rationale:**

- Provider event IDs are unique across all event types
- Simpler than multiple indexes
- Memory efficient

### 7. No Private Key Storage

**Decision:** Regarde only stores webhook secrets, not provider API keys

**Rationale:**

- SDK User manages API keys in provider dashboard
- Regarde only receives webhooks, doesn't make API calls
- Reduces security surface area

### 8. Adapter Pattern for Providers

**Decision:** Each provider implements a standard adapter interface

**Rationale:**

- Easy to add new providers
- Consistent normalization logic
- Testable and maintainable
- Inspired by PayKit's provider abstraction

**Adapter interface:**

```typescript
interface PaymentProviderAdapter {
  validateSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean;
  extractMode(payload: unknown): "test" | "production";
  extractEventType(payload: unknown): string;
  normalizeEvent(payload: unknown): NormalizedEvent;
}
```

**Directory Structure:**

```
/packages/api.regarde.dev/src/domains/payments/
├── adapters/
│   ├── types.ts              # Adapter interface + NormalizedEvent types
│   ├── lemonsqueezy.ts       # LemonSqueezy adapter
│   ├── stripe.ts             # Stripe adapter
│   └── polar.ts              # Polar adapter
├── handlers/
│   └── unifiedWebhook.ts     # Generic webhook handler using adapters
└── schemas/
    └── providerPayloads.ts   # Zod schemas for provider webhooks
```

---

## References

- [PayKit SDK](https://github.com/usepaykit/paykit-sdk) - Inspiration for data model normalization
- [Stripe Webhooks](https://docs.stripe.com/webhooks) - Webhook best practices
- [LemonSqueezy Webhooks](https://docs.lemonsqueezy.com/help/webhooks) - Event types and payloads
- [Polar Webhooks](https://polar.sh/docs/integrate/webhooks) - Event types and payloads
- [Jazz Documentation](https://jazz.tools/docs) - CoValues and schema patterns

---

## Phase 1 Events to Track

### Event Mapping Table

| Provider         | Provider Event                                    | Unified Event Type                                        | Creates/Updates                          |
| ---------------- | ------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------- |
| **LemonSqueezy** | `order_created`                                   | `payment.created`                                         | PaymentEvent                             |
|                  | `subscription_created`                            | `subscription.created`                                    | SubscriptionEvent + Subscription         |
|                  | `subscription_cancelled`                          | `subscription.canceled`                                   | SubscriptionEvent + updates Subscription |
|                  | `subscription_payment_success`                    | `payment.created`                                         | PaymentEvent + updates Subscription      |
|                  | `subscription_payment_failed`                     | `payment.failed`                                          | PaymentEvent                             |
|                  | `license_key_created`                             | `license.created`                                         | LicenseEvent                             |
|                  | `license_key_updated`                             | `license.updated`                                         | LicenseEvent                             |
| **Stripe**       | `checkout.session.completed`                      | `payment.created`                                         | PaymentEvent                             |
|                  | `invoice.paid`                                    | `payment.created`                                         | PaymentEvent + updates Subscription      |
|                  | `invoice.payment_failed`                          | `payment.failed`                                          | PaymentEvent                             |
|                  | `customer.subscription.created`                   | `subscription.created`                                    | SubscriptionEvent + Subscription         |
|                  | `customer.subscription.deleted`                   | `subscription.canceled`                                   | SubscriptionEvent + updates Subscription |
|                  | `customer.subscription.updated`                   | `subscription.updated`                                    | SubscriptionEvent + updates Subscription |
|                  | `entitlements.active_entitlement_summary.updated` | `license.created` / `license.updated` / `license.revoked` | LicenseEvent                             |
| **Polar**        | `order.paid`                                      | `payment.created`                                         | PaymentEvent                             |
|                  | `subscription.created`                            | `subscription.created`                                    | SubscriptionEvent + Subscription         |
|                  | `subscription.canceled`                           | `subscription.canceled`                                   | SubscriptionEvent + updates Subscription |
|                  | `benefit_grant.created`                           | `license.created`                                         | LicenseEvent                             |
|                  | `benefit_grant.updated`                           | `license.updated`                                         | LicenseEvent                             |
|                  | `benefit_grant.revoked`                           | `license.revoked`                                         | LicenseEvent                             |

**Rationale:** These cover 95% of use cases. Additional events can be added in future phases without breaking changes.

**Notes:**

- LemonSqueezy uses British spelling (`cancelled`) but we normalize to American spelling (`canceled`)
- Subscription payments create both a PaymentEvent and update the Subscription CoMap
- One-time purchases only create PaymentEvent
- License events map to different provider concepts:
  - **LemonSqueezy**: Native license keys (`license_key_*` events)
  - **Stripe**: Entitlements (`entitlements.active_entitlement_summary.updated` when access changes)
  - **Polar**: Benefit grants (`benefit_grant.*` events)

## Implementation Checklist

### Phase 1: Foundation

- [x] Update `PaymentEvent` schema with new fields (provider, mode, eventType, providerEventId, providerMetadata)
- [x] Create `SubscriptionEvent` + `Subscription` (mutable state) schemas at `packages/sdk/src/core/schemas/subscriptionEvent.ts`
- [x] Create `LicenseEvent` schema at `packages/sdk/src/core/schemas/licenseEvent.ts`
- [x] Update `RegardeSDK` schema with `mySubscriptions` and `myLicenses`
- [x] Update `App` schema with `subscriptions` and `licenses` fields

### Phase 2: Provider Adapters

- [x] Create adapter interface in `/adapters/types.ts`
- [x] Create LemonSqueezy adapter
- [x] Create Stripe adapter
- [x] Create Polar adapter
- [x] Create adapter registry/factory in `/adapters/index.ts`

### Phase 3: Webhook Handler

- [x] Create unified webhook handler in `/handlers/unifiedWebhook.ts`
- [x] Implement event routing logic with provider adapters
- [x] Add Subscription/License state management
- [x] Update route registration to use unified handler
- [x] Remove legacy LemonSqueezy handler

### Phase 4: SDK Hooks

- [ ] Create `useSubscription(appId)` hook
- [ ] Create `usePaymentHistory(appId)` hook
- [ ] Create `useHasActivePayment(appId)` hook
- [ ] Create `useLicense(appId)` hook (LemonSqueezy)

---

## Directory Structure

```
/packages/api.regarde.dev/src/domains/payments/
├── adapters/
│   ├── types.ts              # PaymentProviderAdapter interface, NormalizedEvent types
│   ├── lemonsqueezy.ts       # LemonSqueezy adapter implementation
│   ├── stripe.ts             # Stripe adapter implementation
│   ├── polar.ts              # Polar adapter implementation
│   └── index.ts              # Adapter registry/factory
├── handlers/
│   └── unifiedWebhook.ts     # Unified webhook handler using provider adapters
├── schemas/
│   └── providerPayloads.ts   # Zod schemas for provider webhook payloads
└── __tests__/
    ├── adapters/
    │   ├── lemonsqueezy.test.ts
    │   ├── stripe.test.ts
    │   └── polar.test.ts
    └── handlers/
        └── unifiedWebhook.test.ts
```

**Key Files:**

- `adapters/types.ts` - Core interfaces and types for normalization
- `adapters/{provider}.ts` - Provider-specific normalization logic
- `handlers/unifiedWebhook.ts` - Generic handler that routes to appropriate adapter
- `schemas/providerPayloads.ts` - Zod validation schemas for webhook payloads

---

## Questions & Answers

**Q: Why not use a single Event CoMap with a type discriminator?**  
A: While possible, separate types provide better type safety and avoid many optional fields. It also makes queries clearer.

**Q: Why CoRecords instead of CoLists for indexes?**  
A: CoRecords provide O(1) lookup by ID, which is essential for finding existing subscriptions. CoLists would require O(n) scanning.

**Q: Do we need to store the provider's API keys?**  
A: No. Regarde only receives webhooks and validates signatures using webhook secrets. SDK Users manage API keys in their provider dashboards.

**Q: How do we handle duplicate webhooks?**  
A: We use the `ProcessedProviderEvents` index to track processed event IDs. If an event ID is already in the index, we skip processing.

**Q: What's the difference between SubscriptionEvent and Subscription?**  
A: SubscriptionEvent is an immutable log entry (like a row in a history table). Subscription is mutable state that tracks the current subscription status (like a row in a status table).

**Q: Why extract mode from webhook instead of separate endpoints?**  
A: It's simpler for SDK Users (one webhook URL) and providers already include mode in the payload. No additional configuration needed.

**Q: Why `payment.created` instead of `payment.succeeded`?**  
A: We follow PayKit's naming convention for consistency. "Created" is more generic and works across providers (Stripe, Polar, LemonSqueezy all use slightly different terminology for successful payments).

---

**End of Document**
