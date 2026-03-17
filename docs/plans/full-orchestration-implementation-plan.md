# Regarde SDK: Full Orchestration Implementation Plan

**Status**: Ready for Implementation  
**Last Updated**: March 2026  
**Scope**: Complete payment orchestration with provider SDK wrapping

---

## Executive Summary

This plan implements **full payment orchestration** for Regarde, transforming it from a webhook receiver into a complete payment processing library. The SDK will wrap provider SDKs (Stripe, Polar, LemonSqueezy) while maintaining Regarde's unique Jazz-based real-time architecture.

### Key Architectural Decisions

| Decision                 | Choice                                   | Rationale                                               |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------- |
| **Package Structure**    | Internal modules (monorepo)              | Pre-launch simplicity, tree-shaking handles bundle size |
| **Package Names**        | `@regarde-dev/sdk`, `@regarde-dev/react` | Remove meaningless "core", clear naming                 |
| **Orchestration Model**  | Full SDK wrapping (Option A)             | Regarde handles entire payment lifecycle                |
| **API Keys**             | Developer provides to SDK                | Not stored by Regarde, secure                           |
| **Webhook Verification** | Both client (dev) + server (prod)        | Flexibility for development, security for production    |
| **Checkout Tracking**    | New CheckoutSession schema               | Track full checkout→payment flow                        |
| **Provider Init**        | Startup (eager)                          | Simpler, fail fast, matches PayKit                      |
| **Error Handling**       | Normalize to RegardeError                | Consistent UX across providers                          |

---

## 1. Target Architecture

### 1.1 Package Structure

```
packages/
├── sdk/                           # @regarde-dev/sdk (renamed from core)
│   ├── src/
│   │   ├── providers/            # Provider implementations
│   │   │   ├── stripe/
│   │   │   │   ├── index.ts      # Factory functions
│   │   │   │   ├── stripe-provider.ts
│   │   │   │   ├── stripe-checkout.ts
│   │   │   │   ├── stripe-customer.ts
│   │   │   │   ├── stripe-subscription.ts
│   │   │   │   └── lib/
│   │   │   │       ├── mapper.ts
│   │   │   │       └── errors.ts
│   │   │   │
│   │   │   ├── polar/            # Same structure as stripe
│   │   │   │   ├── index.ts
│   │   │   │   ├── polar-provider.ts
│   │   │   │   └── lib/
│   │   │   │       └── mapper.ts
│   │   │   │
│   │   │   └── lemonsqueezy/     # Refactor existing
│   │   │       ├── index.ts
│   │   │       ├── lemonsqueezy-provider.ts
│   │   │       └── lib/
│   │   │           └── mapper.ts
│   │   │
│   │   ├── core/
│   │   │   ├── providers/
│   │   │   │   ├── provider-interface.ts    # Unified interface
│   │   │   │   ├── provider-factory.ts      # Registry
│   │   │   │   └── types.ts                 # Shared types
│   │   │   │
│   │   │   ├── schemas/
│   │   │   │   ├── checkoutSession.ts       # NEW
│   │   │   │   ├── regardeUserApp.ts        # UPDATE
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── errors/
│   │   │       └── regarde-error.ts         # NEW
│   │   │
│   │   ├── frameworks/
│   │   │   └── react/
│   │   │       ├── providers/
│   │   │       │   ├── regarde-provider.tsx      # Context
│   │   │       │   ├── useRegarde.ts
│   │   │       │   ├── useStripeProvider.ts
│   │   │       │   └── usePolarProvider.ts
│   │   │       │
│   │   │       ├── checkout/
│   │   │       │   ├── useCheckout.ts
│   │   │       │   └── useCheckoutStatus.ts
│   │   │       │
│   │   │       ├── payments/
│   │   │       │   ├── usePaymentStatus.ts
│   │   │       │   └── usePaymentFlow.ts
│   │   │       │
│   │   │       ├── subscriptions/
│   │   │       │   └── useSubscriptionForUser.ts
│   │   │       │
│   │   │       └── licenses/
│   │   │           └── useLicenseCheck.ts
│   │   │
│   │   └── index.ts              # Main exports
│   │
│   ├── package.json              # Rename from @regarde-dev/core
│   └── tsconfig.json
│
└── dashboard.regarde.dev/        # Existing dashboard
```

### 1.2 Dependency Graph

```
@regarde-dev/sdk
├── stripe (peer, optional)
├── @polar-sh/sdk (peer, optional)
└── jazz-tools

@regarde-dev/react
├── @regarde-dev/sdk (peer)
└── react
```

### 1.3 React Provider Hierarchy

RegardeProvider must be nested **inside** JazzReactProviderWithClerk (or JazzReactProvider) because it requires access to the Jazz account via `useAccount`.

**Required Provider Order**:

```
ThemeProvider
└── BrowserRouter
    └── ClerkProvider (or other auth provider)
        └── JazzProvider (custom wrapper around JazzReactProviderWithClerk)
            └── RegardeProvider (NEW - requires Jazz context)
                └── App Routes
```

**Implementation Detail**: RegardeProvider uses `useAccount(RegardeAccount)` internally to get the Jazz account ID for embedding in checkout metadata. This requires the provider tree structure above.

**Error Handling**: If RegardeProvider is used outside Jazz context, throw descriptive error:

```typescript
const isJazzContextAvailable = me !== null && me !== undefined;
if (isJazzContextAvailable === false) {
  throw new Error(
    'RegardeProvider must be rendered inside JazzReactProviderWithClerk. ' +
    'Ensure your provider hierarchy is: ClerkProvider -> JazzProvider -> RegardeProvider'
  );
}
```

**Compatibility**:
- ✅ Works with Clerk authentication
- ✅ Works with Jazz local-first sync
- ✅ Works with ThemeProvider, Router, and other context providers
- ✅ Can be nested (multiple RegardeProvider instances if needed)
- ⚠️ Must be inside Jazz provider (not compatible with non-Jazz apps)

---

## 2. Phase 1: Foundation & Infrastructure

### 2.1 Package Rename & Restructure

**Tasks**:

- [ ] Rename `packages/sdk/package.json` from `@regarde-dev/core` to `@regarde-dev/sdk`
- [ ] Update all internal imports and aliases
- [ ] Update build configuration
- [ ] Update README and documentation

**Files to Modify**:

- `packages/sdk/package.json`
- `packages/sdk/vite.config.ts`
- Root `package.json` workspace references
- All import statements using `@regarde-dev/core`

### 2.2 Core Provider Interface

**New File**: `packages/sdk/src/core/providers/provider-interface.ts`

```typescript
export interface RegardeProvider {
  readonly id: ProviderId;
  readonly name: string;
  configure(config: ProviderConfig): void;

  // Checkout
  createCheckout(data: CreateCheckoutData): Promise<Checkout>;
  retrieveCheckout(id: string): Promise<Checkout>;

  // Customer
  createCustomer(data: CreateCustomerData): Promise<Customer>;
  retrieveCustomer(id: string): Promise<Customer>;

  // Subscription
  createSubscription(data: CreateSubscriptionData): Promise<Subscription>;
  cancelSubscription(id: string): Promise<Subscription>;
  retrieveSubscription(id: string): Promise<Subscription>;

  // Payment
  retrievePayment(id: string): Promise<Payment>;

  // Webhook (client-side for dev)
  verifyWebhookLocally(payload: string, signature: string): Promise<unknown>;
  getRegardeWebhookUrl(appId: string): string;
}

export type ProviderId = "stripe" | "polar" | "lemonsqueezy";
```

### 2.3 Error System

**New File**: `packages/sdk/src/core/errors/regarde-error.ts`

```typescript
export class RegardeError extends Error {
  constructor(
    message: string,
    public code: RegardeErrorCode,
    public provider?: ProviderId,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = "RegardeError";
  }
}

export type RegardeErrorCode =
  | "PROVIDER_NOT_CONFIGURED"
  | "INVALID_API_KEY"
  | "CHECKOUT_CREATION_FAILED"
  | "CHECKOUT_EXPIRED"
  | "PAYMENT_DECLINED"
  | "INSUFFICIENT_FUNDS"
  | "SUBSCRIPTION_CREATION_FAILED"
  | "WEBHOOK_VERIFICATION_FAILED"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";
```

### 2.4 Checkout Session Schema

**New File**: `packages/sdk/src/core/schemas/checkoutSession.ts`

```typescript
export const CheckoutSession = co.map({
  provider: z.enum(["stripe", "polar", "lemonsqueezy"]),
  providerCheckoutId: z.string(),
  appId: z.string(),
  userId: z.string(),
  status: z.enum(["pending", "completed", "expired", "cancelled"]),
  amount: z.string(),
  currency: z.string(),
  mode: z.enum(["payment", "subscription"]),
  metadata: co.record(z.string(), z.string()),
  createdAt: z.number(),
  completedAt: z.optional(z.number()),
  expiresAt: z.optional(z.number()),
});

export type TCheckoutSession = co.loaded<typeof CheckoutSession>;
```

**Update**: `packages/sdk/src/core/schemas/regardeUserApp.ts`

Add to RegardeApp schema:

```typescript
export const RegardeApp = co.map({
  // ... existing fields
  checkoutSessions: co.record(z.string(), z.string()), // providerCheckoutId -> CheckoutSession.id
});
```

---

## 3. Phase 2: Stripe Provider Implementation

### 3.1 Stripe Provider Class

**New File**: `packages/sdk/src/providers/stripe/stripe-provider.ts`

**Implementation Requirements**:

- Wrap Stripe Node.js SDK
- Implement all RegardeProvider methods
- Normalize data to Regarde types
- Map Stripe errors to RegardeError

**Key Methods**:

```typescript
export class StripeProvider implements RegardeProvider {
  private stripe: Stripe | null = null;
  private config: StripeConfig | null = null;

  configure(config: StripeConfig): void {
    this.config = config;
    this.stripe = new Stripe(config.apiKey, {
      apiVersion: "2025-07-30.basil",
    });
  }

  async createCheckout(data: CreateCheckoutData): Promise<Checkout> {
    // 1. Create Stripe checkout session
    // 2. Store CheckoutSession in Jazz
    // 3. Return normalized checkout
  }

  async verifyWebhookLocally(
    payload: string,
    signature: string,
  ): Promise<Stripe.Event> {
    // Use stripe.webhooks.constructEvent
  }

  getRegardeWebhookUrl(appId: string): string {
    return `https://api.regarde.dev/webhooks/stripe/${appId}`;
  }
}
```

### 3.2 Stripe Factory Functions

**New File**: `packages/sdk/src/providers/stripe/index.ts`

```typescript
export function createStripe(config: StripeConfig): StripeProvider {
  const provider = new StripeProvider();
  provider.configure(config);
  return provider;
}

export function stripe(): StripeProvider {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!apiKey) {
    throw new RegardeError(
      "STRIPE_SECRET_KEY environment variable not set",
      "INVALID_API_KEY",
    );
  }

  return createStripe({ apiKey, webhookSecret });
}
```

### 3.3 Stripe Data Mappers

**New File**: `packages/sdk/src/providers/stripe/lib/mapper.ts`

**Requirements**:

- Zod schemas for all Stripe → Regarde transformations
- Status mapping functions
- Event normalization

```typescript
export const stripeCheckout$InboundSchema = z.object({
  id: z.string(),
  url: z.string(),
  status: z.enum(["open", "complete", "expired"]),
  mode: z.enum(["payment", "subscription"]),
  amount: z.number().nullable(),
  currency: z.string(),
  metadata: z.record(z.string()),
});

export function mapStripeStatus(status: string): CheckoutStatus {
  const map: Record<string, CheckoutStatus> = {
    open: "pending",
    complete: "completed",
    expired: "expired",
  };
  return map[status] || "pending";
}

export function normalizeStripeEvent(event: Stripe.Event): NormalizedEvent[] {
  // Map Stripe events to Regarde events
}
```

### 3.4 Stripe Error Mapping

**New File**: `packages/sdk/src/providers/stripe/lib/errors.ts`

```typescript
export function mapStripeError(error: Stripe.errors.StripeError): RegardeError {
  const codeMap: Record<string, RegardeErrorCode> = {
    card_declined: "PAYMENT_DECLINED",
    insufficient_funds: "INSUFFICIENT_FUNDS",
    expired_card: "CHECKOUT_CREATION_FAILED",
    incorrect_number: "CHECKOUT_CREATION_FAILED",
    processing_error: "UNKNOWN_ERROR",
  };

  return new RegardeError(
    error.message,
    codeMap[error.code] || "UNKNOWN_ERROR",
    "stripe",
    error,
  );
}
```

---

## 4. Phase 3: Polar Provider Implementation

### 4.1 Polar Provider Class

**New File**: `packages/sdk/src/providers/polar/polar-provider.ts`

**Implementation Requirements**:

- Use `@polar-sh/sdk` npm package
- Support both production and sandbox environments
- Implement Standard Webhooks signature verification

**Key Configuration**:

```typescript
export interface PolarConfig {
  accessToken: string;
  environment: "production" | "sandbox";
  webhookSecret?: string;
}
```

### 4.2 Polar Factory Functions

**New File**: `packages/sdk/src/providers/polar/index.ts`

```typescript
export function createPolar(config: PolarConfig): PolarProvider {
  const provider = new PolarProvider();
  provider.configure(config);
  return provider;
}

export function polar(): PolarProvider {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const environment = process.env.POLAR_ENVIRONMENT as "production" | "sandbox";

  if (!accessToken) {
    throw new RegardeError("POLAR_ACCESS_TOKEN not set", "INVALID_API_KEY");
  }

  return createPolar({
    accessToken,
    environment: environment || "sandbox",
  });
}
```

### 4.3 Polar Data Mappers

**New File**: `packages/sdk/src/providers/polar/lib/mapper.ts`

Similar structure to Stripe mappers but for Polar data types.

---

## 5. Phase 4: LemonSqueezy Refactor

### 5.1 Refactor Existing Implementation

**Current**: `useRegardeLemonSqueezyCheckoutLink.ts` hook

**New Structure**:

- `packages/sdk/src/providers/lemonsqueezy/lemonsqueezy-provider.ts`
- `packages/sdk/src/providers/lemonsqueezy/index.ts`
- `packages/sdk/src/providers/lemonsqueezy/lib/mapper.ts`

**Migration Strategy**:

1. Create new provider class
2. Move checkout logic from hook to provider
3. Keep hook as thin wrapper
4. Deprecate old hook gradually

### 5.2 LemonSqueezy Factory

```typescript
export function createLemonSqueezy(
  config: LemonSqueezyConfig,
): LemonSqueezyProvider;
export function lemonSqueezy(): LemonSqueezyProvider;
```

---

## 6. Phase 5: React Integration

### 6.1 RegardeProvider Context

**New File**: `packages/sdk/src/frameworks/react/providers/regarde-provider.tsx`

```typescript
interface RegardeContextValue {
  providers: Map<ProviderId, RegardeProvider>;
  registerProvider: (provider: RegardeProvider) => void;
  getProvider: (id: ProviderId) => RegardeProvider | undefined;
  account: RegardeAccount | null;
}

export function RegardeProvider({ 
  children,
  providers = [],
}: { 
  children: React.ReactNode;
  providers?: RegardeProvider[];
}) {
  // Get Jazz account - requires being inside JazzReactProviderWithClerk
  const { me } = useAccount(RegardeAccount);
  
  // Golden Rule: Explicit validation
  const isJazzContextAvailable = me !== null && me !== undefined;
  if (isJazzContextAvailable === false) {
    throw new Error(
      'RegardeProvider must be rendered inside JazzReactProviderWithClerk. ' +
      'Ensure your provider hierarchy is: ClerkProvider -> JazzProvider -> RegardeProvider'
    );
  }
  
  const [providerMap] = useState(() => {
    const map = new Map<ProviderId, RegardeProvider>();
    providers.forEach(p => map.set(p.id, p));
    return map;
  });
  
  const isProvidersValid = providers !== null && providers !== undefined;
  const providerCount = isProvidersValid === true ? providers.length : 0;
  
  // Log warning if no providers registered
  const isProvidersEmpty = providerCount === 0;
  if (isProvidersEmpty === true) {
    console.warn('RegardeProvider initialized with no payment providers');
  }
  
  return (
    <RegardeContext.Provider value={{ providers: providerMap, account: me }}>
      {children}
    </RegardeContext.Provider>
  );
}

export function useRegarde(): RegardeContextValue;
```

### 6.2 Provider Hooks

**New File**: `packages/sdk/src/frameworks/react/providers/useStripeProvider.ts`

```typescript
export function useStripeProvider() {
  const { getProvider } = useRegarde();
  return getProvider("stripe") as StripeProvider | undefined;
}
```

### 6.3 Unified Checkout Hook

**New File**: `packages/sdk/src/frameworks/react/checkout/useCheckout.ts`

```typescript
interface UseCheckoutOptions {
  provider: ProviderId;
  appId: string;
}

interface UseCheckoutResult {
  createCheckout: (data: CheckoutData) => Promise<Checkout>;
  isLoading: boolean;
  error: RegardeError | null;
}

export function useCheckout(options: UseCheckoutOptions): UseCheckoutResult {
  const { getProvider, account } = useRegarde();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<RegardeError | null>(null);
  
  const createCheckout = useCallback(async (data: CheckoutData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = getProvider(options.provider);
      const isProviderAvailable = provider !== null && provider !== undefined;
      if (isProviderAvailable === false) {
        throw new RegardeError(
          `Provider ${options.provider} not registered`,
          'PROVIDER_NOT_CONFIGURED'
        );
      }
      
      // Golden Rule: Explicit boolean checks
      const isAccountLoaded = account !== null && account !== undefined && account.$isLoaded === true;
      if (isAccountLoaded === false) {
        throw new RegardeError('Jazz account must be loaded', 'PROVIDER_NOT_CONFIGURED');
      }
      
      const isRegardeSdkAvailable = account.root !== null && 
        account.root !== undefined && 
        account.root.$isLoaded === true &&
        account.root["regarde-sdk"] !== null &&
        account.root["regarde-sdk"] !== undefined &&
        account.root["regarde-sdk"].$isLoaded === true;
      
      if (isRegardeSdkAvailable === false) {
        throw new RegardeError('RegardeSDK not initialized', 'PROVIDER_NOT_CONFIGURED');
      }
      
      const enrichedData = {
        ...data,
        appId: options.appId,
        userId: account.$jazz.id,
        sdkId: account.root["regarde-sdk"].$jazz.id,
        metadata: {
          regarde_app_id: options.appId,
          regarde_user_id: account.$jazz.id,
          regarde_sdk_id: account.root["regarde-sdk"].$jazz.id,
          ...data.metadata,
        },
      };
      
      const checkout = await provider.createCheckout(enrichedData);
      return checkout;
    } catch (err) {
      const isRegardeError = err instanceof RegardeError;
      const regardeError = isRegardeError === true
        ? err 
        : new RegardeError(String(err), 'UNKNOWN_ERROR');
      setError(regardeError);
      throw regardeError;
    } finally {
      setIsLoading(false);
    }
  }, [getProvider, account, options]);
  
  return { createCheckout, isLoading, error };
}

        const enrichedData = {
          ...data,
          appId: options.appId,
          userId: account?.$jazz.id,
          sdkId: account?.root["regarde-sdk"]?.$jazz.id,
          metadata: {
            regarde_app_id: options.appId,
            regarde_user_id: account?.$jazz.id,
            regarde_sdk_id: account?.root["regarde-sdk"]?.$jazz.id,
            ...data.metadata,
          },
        };

        const checkout = await provider.createCheckout(enrichedData);
        return checkout;
      } catch (err) {
        const regardeError =
          err instanceof RegardeError
            ? err
            : new RegardeError(String(err), "UNKNOWN_ERROR");
        setError(regardeError);
        throw regardeError;
      } finally {
        setIsLoading(false);
      }
    },
    [getProvider, account, options],
  );

  return { createCheckout, isLoading, error };
}
```

### 6.4 Payment Lifecycle Hooks

**usePaymentStatus.ts**:

```typescript
export function usePaymentStatus(appId: string, paymentId: string) {
  // Subscribe to PaymentEvent CoMap
  // Return { payment, status, isLoading, error }
}
```

**useCheckoutStatus.ts**:

```typescript
export function useCheckoutStatus(appId: string, checkoutId: string) {
  // Subscribe to CheckoutSession CoMap
  // Track status: pending → completed/expired/cancelled
}
```

**useSubscriptionForUser.ts**:

```typescript
export function useSubscriptionForUser(appId: string, userId?: string) {
  // Subscribe to app.subscriptions
  // Filter by user
  // Return { subscription, isActive, willRenew, currentPeriodEnd }
}
```

**useLicenseCheck.ts**:

```typescript
export function useLicenseCheck(appId: string, userId?: string) {
  // Check app.licenses for valid license
  // Return { hasValidLicense, license, expiresAt }
}
```

**usePaymentFlow.ts**:

```typescript
export function usePaymentFlow(appId: string, checkoutSessionId: string) {
  // Track checkout → payment flow
  // Subscribe to both CheckoutSession and PaymentEvent
  // Return { status: 'pending' | 'succeeded' | 'failed', payment }
}
```

---

## 7. Phase 6: Webhook Infrastructure

### 7.1 Client-Side Verification (Development)

Already implemented in provider classes via `verifyWebhookLocally()`.

### 7.2 Server-Side Updates

**Update**: `packages/api.regarde.dev/src/domains/payments/adapters/`

**Requirements**:

- Ensure all adapters extract checkout session ID from metadata
- Link webhook events to CheckoutSession records
- Update CheckoutSession status on completion

**Stripe Adapter Update**:

```typescript
// In normalizeEvent, extract checkout session ID
if (parsed.type === "checkout.session.completed") {
  const checkoutSessionId = obj.id; // 'cs_test_...'

  // Update CheckoutSession in Jazz
  await updateCheckoutSession(checkoutSessionId, {
    status: "completed",
    completedAt: Date.now(),
  });

  // Create PaymentEvent
  // ...
}
```

---

## 8. Phase 7: Testing & Quality Assurance

### 8.1 Unit Tests

**Provider Tests**:

```typescript
describe("StripeProvider", () => {
  it("should create checkout with Regarde metadata", async () => {
    // Mock Stripe SDK
    // Verify metadata contains regarde_app_id, regarde_user_id, regarde_sdk_id
  });

  it("should map Stripe errors to RegardeError", async () => {
    // Test error normalization
  });
});
```

**Hook Tests**:

```typescript
describe("useCheckout", () => {
  it("should throw if provider not registered", async () => {
    // Test error handling
  });

  it("should enrich checkout data with Jazz IDs", async () => {
    // Test metadata embedding
  });
});
```

### 8.2 Integration Tests

**Stripe Test Mode**:

- Create test checkout sessions
- Verify webhooks processed correctly
- Confirm Jazz CoMaps updated

**Polar Sandbox**:

- Test sandbox environment
- Verify Standard Webhooks signature verification

**LemonSqueezy Test**:

- Test mode webhooks
- Verify existing functionality preserved

### 8.3 E2E Tests

**Complete Flow**:

1. Initialize provider
2. Create checkout
3. Complete payment (using provider test cards)
4. Verify webhook received
5. Confirm Jazz CoMaps updated
6. Verify React hooks receive updates

---

## 9. Phase 8: Documentation

### 9.1 API Documentation

**JSDoc Requirements**:

- All public methods documented
- @param, @returns, @throws tags
- @example usage for complex functions

**Type Exports**:

- All TypeScript types exported
- Separate type-only exports for tree-shaking

### 9.2 Usage Guides

**Quick Start**:

```typescript
// Installation
npm install @regarde-dev/sdk @regarde-dev/react stripe

// Setup
import { RegardeProvider, createStripe } from '@regarde-dev/react';

const stripe = createStripe({
  apiKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
});

function App() {
  return (
    <RegardeProvider providers={[stripe]}>
      <YourApp />
    </RegardeProvider>
  );
}

// app.tsx - Provider Setup
import { RegardeProvider } from '@regarde-dev/react';
import { createStripe, createPolar } from '@regarde-dev/sdk/providers';

const stripe = createStripe({
  apiKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
});

const polar = createPolar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  environment: 'sandbox',
});

function App() {
  return (
    <RegardeProvider providers={[stripe, polar]}>
      <YourApp />
    </RegardeProvider>
  );
}

// main.tsx - Complete Provider Hierarchy
import { ClerkProvider } from '@clerk/clerk-react';
import { JazzReactProviderWithClerk } from 'jazz-tools/react';
import { RegardeProvider } from '@regarde-dev/react';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
          <JazzReactProviderWithClerk
            sync={{ peer: `wss://cloud.jazz.tools/?key=${apiKey}` }}
            AccountSchema={RegardeAccount}
          >
            {/* RegardeProvider requires Jazz context */}
            <RegardeProvider providers={[stripe, polar]}>
              <App />
            </RegardeProvider>
          </JazzReactProviderWithClerk>
        </ClerkProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);

// Usage in component
import { useCheckout } from '@regarde-dev/react';

function SubscribeButton({ appId }) {
  const { createCheckout, isLoading } = useCheckout({ provider: 'stripe', appId });
  
  const handleClick = async () => {
    const checkout = await createCheckout({
      mode: 'subscription',
      lineItems: [{ price: 'price_123', quantity: 1 }],
      successUrl: '/success',
      cancelUrl: '/cancel',
    });
    window.location.href = checkout.url;
  };
  
  return <button onClick={handleClick} disabled={isLoading}>Subscribe</button>;
}
```

### 9.3 Migration Guide

**From Old Hook to New SDK**:

```typescript
// Before
const { generateLemonSqueezyCheckoutLink } = useRegardeLemonSqueezyCheckoutLink(
  appId,
  storeName,
);

// After
const { createCheckout } = useCheckout({ provider: "lemonsqueezy", appId });
const checkout = await createCheckout({
  mode: "payment",
  variantId: 123,
  storeName: "my-store",
});
```

---

## 10. Phase 9: Release Preparation

### 10.1 Versioning Strategy

**Initial Release**: `v0.1.0-alpha`

- Mark as pre-release
- Document breaking changes from old `@regarde-dev/core`

**Breaking Changes**:

- Package rename: `@regarde-dev/core` → `@regarde-dev/sdk`
- New provider initialization pattern
- Deprecated old hooks (keep for migration period)

### 10.2 Release Checklist

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Examples working
- [ ] Type definitions generated
- [ ] CHANGELOG.md updated
- [ ] npm publish dry-run successful

---

## 11. Success Criteria

- [ ] All three providers (Stripe, Polar, LemonSqueezy) working
- [ ] Full checkout lifecycle implemented (create → complete → webhook → CoMap)
- [ ] React hooks for all payment lifecycle stages
- [ ] Error normalization across all providers
- [ ] Client-side webhook verification for development
- [ ] Documentation with working examples
- [ ] > 90% test coverage for provider logic
- [ ] Package successfully published as `@regarde-dev/sdk`

---

## 12. Open Questions

1. **Should we support payment method attachment?** (Out of scope for MVP?)
2. **Should we support refunds through SDK?** (Or just webhooks?)
3. **What's the story for customer management?** (Create/retrieve customers)
4. **Should we provide UI components?** (Or leave to developers?)

---

**Next Step**: Review this plan, then begin Phase 1 implementation.
