# SDK Public API Specification

## 1. Overview

**Package**: `@regarde-dev/core`

The Regarde SDK provides a client-side interface for managing payment infrastructure through Jazz-based collaborative data structures. It handles app lifecycle management, payment provider integration (Stripe, Polar), subscription tracking, and user authentication via time-limited registration tokens.

**Core Responsibilities**:
- Initialize and manage RegardeAccount with embedded RegardeSDK CoMap
- Generate and validate 24-hour registration tokens (16-character secure strings)
- Expose React hooks for framework integration
- Provide schemas for user-owned and registry-owned CoMaps
- Manage payment operations: checkout, subscriptions, invoices, refunds, and webhooks

## 2. Schema Hierarchy

### User-Owned Data

| Schema | Purpose | Parent |
|--------|---------|--------|
| `RegardeAccount` | Root account container | JazzAccount |
| `RegardeSDK` | Main SDK container (v4) | RegardeAccount.root["regarde-sdk"] |
| `App` | App definition (name, provider config, webhook URL) | RegardeSDK.myApps |
| `UserHandle` | Nickname registration data | RegardeSDK.myUserHandle |
| `CheckoutSession` | Active checkout session for payment flow | User group |

### Worker-Owned Data (User has READ access)

| Schema | Purpose | Access |
|--------|---------|--------|
| `PaymentEvent` | Individual payment transaction record | Worker writes, user reads |
| `SubscriptionEvent` | Subscription state change events | Worker writes, user reads |
| `Subscription` | Current mutable subscription state | Worker writes, user reads |
| `LicenseEvent` | License activation/deactivation events | Worker writes, user reads |
| `Invoice` | Invoice records from payment providers | Worker writes, user reads |
| `Refund` | Refund transaction records | Worker writes, user reads |
| `RegistryAppMetadata` | App verification status and flags | Registry worker (read-only) |

## 3. Managers

All managers located in `src/core/managers/`:

| Manager | Purpose | Key Functions |
|---------|---------|---------------|
| `app` | App lifecycle management | `createApp`, `loadApps`, `getAppsByAccount` |
| `auth` | Token generation and validation | `generateRegardeToken`, `refreshAuthToken`, `verifyRegardeAuthViaServer` |
| `checkout` | Checkout session management | `createCheckout`, validation |
| `invoice` | Invoice operations | `loadInvoices`, `getInvoiceById` |
| `refund` | Refund processing | `createRefund`, validation |
| `subscription` | Subscription CRUD | `createSubscription`, `validateSubscriptionOptions` |
| `webhook` | Webhook configuration | `createWebhook`, `updateWebhook`, `regenerateSecret`, `toggleStatus` |

## 4. Group Permissions

### User Group
- **Owner**: User account
- **Writers**: User + Regarde worker
- **Contents**: App CoMaps, UserHandle, CheckoutSession, Auth tokens

### AdminOtherReaders Group
- **Owner**: Regarde worker
- **Writers**: Regarde worker
- **Readers**: User (read-only access)
- **Contents**: PaymentEvent, Subscription, Invoice, Refund, SubscriptionEvent, LicenseEvent

### Registry Group
- **ID**: `co_zoppoxWWJaHYKPgSgUkuCCXQX21`
- **Owner**: Registry worker
- **Readers**: All verified users
- **Contents**: RegistryAppMetadata, nickname registries

## 5. Sync Safety

**Write-Wait-Use Pattern** (Mandatory)

```typescript
// Create CoMap and wait for sync before any read
const newCoMap = SomeCoMap.create({ ... }, { owner: someGroup });
await newCoMap.$jazz.waitForSync(); // REQUIRED

// Set reference and wait
root.$jazz.set("regarde-sdk", newSDK);
await newSDK.$jazz.waitForSync();
await account.$jazz.waitForSync();
```

**Loading Validation**

```typescript
const isValid = account !== null && account.$isLoaded === true;
if (isValid === false) throw new Error("Account must be loaded");

await account.$jazz.ensureLoaded({
  resolve: { root: { "regarde-sdk": true } },
});
```

## 6. MaybeLoaded Pattern

### Single-Item Hooks

Use `MaybeLoaded<T>` to preserve loading state:

```typescript
import type { MaybeLoaded } from "jazz-tools";

export interface TUseMyDataResult {
  data: MaybeLoaded<TMyData>;
  isLoading: boolean;
}

export function useMyData(options: TOptions): TUseMyDataResult {
  const data = useCoState(MyDataSchema, options.id);
  const isLoading = data === undefined;
  return { data, isLoading };
}
```

### Collection Hooks

Return filtered arrays (loaded items only):

```typescript
export interface TUsePaymentEventsResult {
  events: TPaymentEvent[];  // Only loaded events
  isLoading: boolean;
  totalCount: number;
}

const events = allEvents.filter(
  (event): event is TPaymentEvent =>
    event !== null && event !== undefined && event.$isLoaded === true
);
```

## 7. Manager Function Patterns

### When to Pass Account Parameter

**Pass account** when creating Jazz CoMaps:
```typescript
await createCheckout(account, apiKey, { ... });  // Creates CheckoutSession
await createRefund(account, apiKey, "stripe", { ... });  // Creates Refund CoMap
```

**Don't pass account** for provider-only operations:
```typescript
await pauseSubscription({ subscriptionId, provider, apiKey });
await cancelSubscription({ subscriptionId, provider, apiKey, cancelAtPeriodEnd });
await updateSubscription(apiKey, { subscriptionId, provider, priceId });
```

### Hook Operations Reference

| Hook | Jazz Operations | Provider Operations | Needs Account |
|------|----------------|---------------------|---------------|
| `useCreateCheckout` | Creates CheckoutSession CoMap | Calls checkout API | Yes |
| `useCreateRefund` | Creates Refund CoMap | Calls refund API | Yes |
| `useCreateSubscription` | Creates Subscription CoMap | Calls subscription API | Yes |
| `usePauseSubscription` | None | Calls pause API | No |
| `useResumeSubscription` | None | Calls resume API | No |
| `useCancelSubscription` | None | Calls cancel API | No |
| `useUpdateSubscription` | None | Calls update API | No |
| `useInvoices` | Reads Invoice CoMaps | None | Yes |

## 8. Module Aliases

| Alias | Path |
|-------|------|
| `#schemas` | `src/core/schemas` |
| `#managers` | `src/core/managers` |
| `#init` | `src/core/init` |
| `#core` | `src/core` |
| `#frameworks` | `src/frameworks` |

## 9. Package Exports

- **Main export** (`index.ts`): Core SDK functions, schemas, platform-agnostic utilities
- **React export** (`/react`): React-specific hooks and providers
- **Build outputs**: `dist/index.js`, `dist/react.js` with bundled types

## 10. Key Architectural Decisions

### Token Management
- Tokens generated client-side, stored in RegardeTokenAuth CoMap
- 24-hour lifetime enforced by expiresAt timestamp
- Worker verifies via RegardeTokenAuth.load() + ownership checks

### Data Ownership Model
- **User owns**: App, UserHandle, CheckoutSession (in user group)
- **Worker owns (user READ)**: PaymentEvent, Subscription, Invoice, Refund, events
- **Registry owns (read-only)**: RegistryAppMetadata, nickname registries
- Worker writes payment data via webhooks; user has read access via group membership

### Version 4 Schema
- `version` field enables migration support (migrated from v2/v3)
- PaymentEvent maps: `all[providerUUID]` and `byApp[appId][providerUUID]`
- Subscription lookups: `all`, `byApp`, and `status` indexes
- Separate groups for user data vs payment data
- Invoice, Refund, and License tracking added in v4
