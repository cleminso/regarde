# RegardeSDK Payment Implementation Plan

## Overview

This document outlines the implementation plan for adding payment subscription management to RegardeSDK. The payment system extends RegardeSDK to provide subscription and payment management through Jazz CoValues, enabling SDK users to handle payments without writing backend services.

## Architecture Overview

### Integration with RegardeSDK

The payment system extends the existing `RegardeSDK` schema to maintain a single source of truth for all user data:

```typescript
// Current RegardeSDK (packages/sdk/src/auth/schemas/auth.ts)
export const RegardeSDK = co.map({
  userHandle: UserHandle,
  auth: RegardeAuth,
  version: z.number().default(0),
});

// Extended RegardeSDK with payments
export const RegardeSDK = co.map({
  userHandle: UserHandle,
  auth: RegardeAuth,
  payments: PaymentManager, // New payment field
  version: z.number().default(0),
});
```

### Account Structure

The extended account structure maintains the existing pattern with the addition of payment data:

```typescript
// Account root namespaces
account.root["regarde.bio"] → RegardeProfile (public profile)
account.root["regarde-sdk"] → RegardeSDK (private SDK data with payments)
account.root["api.regarde.dev"] → RegardeAuth (24hr tokens)
```

## Schema Definitions

### 1. Payment Schemas (packages/sdk/src/payments/schemas/payments.ts)

```typescript
/**
 * # Payment Module - Subscription and Payment Tracking
 *
 * ## Purpose
 * - Stores subscription status for users across different applications
 * - Tracks payment history and events
 * - Enables webhook updates from payment providers
 * - Provides payment status queries for SDK users
 */

/**
 * Container for all payment data in user's Jazz account
 */
export const PaymentManager = co.map({
  allMyPayments: ListOfPaymentEvents,
  paymentHistoryByApp: co.record(z.string(), ListOfPaymentEvents),
  version: z.number().default(1),
});

/**
 * Individual payment event record
 */
export const PaymentEvent = co.map({
  amount: z.string(),
  currency: z.string().default("USD"),
  timestamp: z.number(),
  paymentStatus: z.enum(["pending", "completed", "failed", "cancelled"]),
  app: App,
  userAccount: Account,
  metadata: co.record(z.string(), z.string()),
```

### 2. Registry Schema Extensions (packages/sdk/src/registry/schemas/registry.ts)

```typescript
/**
 * Extended registry root with app management
 */
export const RegistryWorkerAccountRoot = co.map({
  registry: NicknameRegistryCoRecord,
  reverseRegistry: ReverseNicknameRegistryCoRecord,
  auditLog: RegistryAuditLog,
  reservedNicknames: ReservedNicknamesRegistry,
  apps: AppRegistry,
});

/**
 * Registry of all registered applications
 */
export const AppRegistry = co.record(z.string(), App);

/**
 * Application registration and payment tracking
 */
export const App = co.map({
  name: z.string(),
  description: z.string(),
  ownerAccountId: z.string(),
  paymentProvider: z.enum(["lemonsqueezy", "stripe"]),
  isEnabled: z.boolean(), // default false
  createdAt: z.number(),
  metadata: co.record(z.string(), z.string()),
  payments: co.feed(PaymentEvent),
  paymentsByUser: co.record(z.string(), ListOfPaymentEvents),
});
```

## Implementation Flow

### 1. End User Account Flow

SDK developers will integrate the end user account flow as they want in their applications. The end user account is represented by their Jazz Account ID (`jazzAccountId`), which serves as their unique identifier across the payment system. The SDK provides the infrastructure and hooks, but the UI for account creation and management is left to the SDK user to implement.

### 2. App Registration Flow

```typescript
// CLI command: pnpx regarde register-app --name "My app" --providerName "lemon-squeezy" --ownerJazzAccountId "co_z"

// Implementation steps:
1. SDK user calls API to api.regarde.dev/register-app
2. Worker creates App CoMap:
   const app = App.create({
     name: "My app",
     ownerJazzAccountId: "co_z",
     paymentProvider: "lemonsqueezy"
   }, workerGroup);
3. Worker adds App to Registry, returns appId as CoMap ID
4. SDK user adds AppId to LemonSqueezy checkout + user JazzAccountId
```

### 3. Webhook Processing Flow

#### Pre-requisites

1. SDK User added `appId` and `jazzAccountId` to their payment provider's custom_data field when creating the payment session
2. User successfully completed payment

```typescript
// Webhook: POST /webhook/lemon-squeezy

1. Worker receives webhook with payment success event
2. Extract data from webhook:
   - custom_data: {appId: "co_x", userJazzAccountId: "co_y"}
   - payment_details: {...}
3. Worker creates PaymentEvent:
   const paymentEvent = PaymentEvent.create({
     appId: "co_x",
     userJazzAccountId: "co_y",
     // webhook response data
   }, workerGroup);
4. Worker updates user's PaymentManager:
5. Worker updates App in Registry:
   const registryApp = RegistryWorkerAccount.root.apps[appId];
   registryApp.payments.$jazz.push(paymentEvent);
   // Grant read access to owner
   paymentEvent.$jazz.owner.addMember(ownerAccount, "reader");
```

### 4. Data Access Patterns

```typescript
// SDK user: View all payments for their app
const sdkUserAccount = await RegardeAccount.load(sdkUserAccountId);
const registry = await RegistryWorkerAccount.load(registryId);
const myApp = registry.root.apps[appId];
const allPayments = myApp.payments;

// End user: View their subscriptions
const userAccount = await RegardeAccount.load(userJazzAccountId);
const paymentManager = userAccount.root["regarde-sdk"].payments;
const mySubscriptions = paymentManager.mySubscriptions;
const myPaymentHistory = paymentManager.paymentHistory;
```

## Implementation Plan

### Phase 1: Schema and Infrastructure

1. **Update Core Schemas**
   - Extend `RegardeSDK` with payments field
   - Extend `RegistryWorkerAccount` with apps field
   - Add payment-related CoMap definitions

2. **Payment Module Structure**

```
packages/sdk/src/payments/
├── schemas/payments.ts     # Core payment schemas
├── hooks/usePayments.ts    # React hooks
├── registerApp.ts          # App registration functions
├── getPayments.ts          # Payment access functions
├── types.ts                # TypeScript definitions
└── index.ts                # Module exports
```

### Phase 2: API Implementation

1. **Registry Extensions**
   - Add app registration endpoint to api.regarde.dev
   - Implement app registry management
   - Add permission handling for app owners

2. **Webhook Handlers**
   - Implement LemonSqueezy webhook endpoint
   - Add payment event processing logic
   - Implement permission granting for users and owners

### Phase 3: Client Integration

1. **React Hooks**

```typescript
// packages/sdk/src/react/useRegardePayments.ts
export function usePaymentManager() {
  const sdk = useMyRegardeAccount().sdk;
  return sdk?.payments?.mySubscriptions;
}
```

2. **CLI Tool Enhancement**
   - Extend admin CLI with `register-app` command
   - Add app management capabilities

### Phase 4: Testing and Documentation

1. **Test Coverage**
   - Unit tests for payment schemas
   - Integration tests for webhook processing
   - E2E tests for complete payment flow

2. **Documentation**
   - SDK user guide for payment integration
   - API documentation for webhook endpoints
   - Migration guide for existing SDK users

## Key Implementation Details

### 1. Schema Initialization

```typescript
// packages/sdk/src/auth/schemas/auth.ts
export const initRegardeSDK = async (account: Account) => {
  // ... existing code ...
  return RegardeSDK.create({
    // ... existing fields ...
    payments: PaymentManager.create(
      {
        mySubscriptions: [],
        paymentHistory: [],
      },
      userGroup,
    ),
  });
};
```

### 2. Registry Migration

```typescript
// packages/sdk/src/registry/schemas/registry.ts
export const RegistryWorkerAccount = co
  .account({
    profile: EmptyProfile,
    root: RegistryWorkerAccountRoot,
  })
  .withMigration(async (account) => {
    // ... existing migration code...

    // Add apps registry in migration
    if (!account.root.apps) {
      const appRegistry = AppRegistry.create({});
      account.root.$jazz.set("apps", appRegistry);
    }
  });
```

### 3. Permission Management

```typescript
// When paymentEvent is created:
const paymentGroup = Group.create({ owner: workerAccount });

// Grant read access to:
paymentGroup.addMember(userAccount, "reader"); // User who paid
paymentGroup.addMember(ownerAccount, "reader"); // App owner
paymentGroup.addMember(regardeGroup, "writer"); // Regarde system

// Store references:
userPaymentManager.paymentHistory.$jazz.push(paymentEvent);
app.payments.$jazz.push(paymentEvent);
```

## Benefits

1. **For SDK Users**
   - No backend service required for payment management
   - Real-time payment status through Jazz sync
   - Automatic permission handling for payment data
   - Simple API through React hooks

2. **For End Users**
   - Centralized view of all subscriptions across apps
   - Transparent payment history
   - Privacy through Jazz permission system

3. **For Regarde Team**
   - Leveraging existing CoValue infrastructure
   - Maintaining architectural consistency
   - Stateless webhook processing
   - Scalable through Jazz Cloud

## Migration Strategy

1. **Existing SDK Users**
   - `RegardeSDK` schema extension is backward compatible
   - New `payments` field initialized as empty for existing accounts
   - No breaking changes to existing authentication flows

2. **Gradual Rollout**
   - Feature flags for payment functionality
   - Opt-in app registration process
   - Staged webhook provider support (LemonSqueezy first, expand later)

## Success Metrics

1. **Technical Metrics**
   - Successful webhook processing rate (>99.9%)
   - Payment event sync latency (<5 seconds)
   - CoValue permission access success rate (>99.5%)

2. **Adoption Metrics**
   - Number of registered applications
   - Percentage of SDK users enabling payments
   - User satisfaction metrics

3. **Error Handling**
   - Comprehensive error logging with actionable fix-checklists
   - Fallback mechanisms for webhook failures
   - Manual sync recovery processes
