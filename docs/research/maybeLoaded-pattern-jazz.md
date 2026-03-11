# MaybeLoaded Pattern in Jazz - Research Findings

## Overview

This document captures our research and decision-making process regarding the `MaybeLoaded<T>` pattern in Jazz, specifically for the Regarde SDK's React hooks implementation.

## What is MaybeLoaded?

`MaybeLoaded<T>` is a union type defined in `jazz-tools` that represents the three possible states of a CoValue subscription:

```typescript
type MaybeLoaded<T> = T | NotLoaded<T> | undefined;
```

### State Breakdown

1. **`T` (Loaded)** - The CoValue has been successfully loaded and all requested data is available
2. **`NotLoaded<T>`** - A placeholder with `$isLoaded: false` and detailed loading state information
3. **`undefined`** - Initial state before subscription starts

### The NotLoaded State

The `NotLoaded<T>` variant includes important metadata:

```typescript
{
  $isLoaded: false;
  $jazz: {
    loadingState: "loading" | "unavailable" | "unauthorized";
    // ... other loading metadata
  }
}
```

This allows developers to distinguish between:
- `"loading"` - Data is still being fetched
- `"unavailable"` - Data couldn't be found or network error
- `"unauthorized"` - User doesn't have permission to access this CoValue

## Why MaybeLoaded Matters

### Without MaybeLoaded (Incorrect Pattern)

```typescript
// ❌ WRONG: Loses loading state information
export interface UseCoValueResult {
  value: TCoValue | null | undefined;
  isLoading: boolean;
}

// Usage - can't distinguish WHY it's not loaded
if (value === null) return <div>Loading...</div>;
// Is it loading? Not found? Unauthorized? Can't tell!
```

### With MaybeLoaded (Correct Pattern)

```typescript
// ✅ CORRECT: Preserves all loading state information
export interface UseCoValueResult {
  value: MaybeLoaded<TCoValue>;
  isLoading: boolean;
}

// Usage - can handle each case appropriately
if (!value.$isLoaded) {
  switch (value.$jazz.loadingState) {
    case "loading":
      return <div>Loading...</div>;
    case "unavailable":
      return <div>Data not found</div>;
    case "unauthorized":
      return <div>You don't have permission to view this</div>;
  }
}

// TypeScript narrows to TCoValue here
return <div>{value.name}</div>; // ✅ Works!
```

## Jazz Ecosystem Alignment

### Jazz-Tools Hooks Use MaybeLoaded

The official Jazz hooks follow this pattern:

- `useCoState()` returns `MaybeLoaded<T>`
- `useAccount()` returns `MaybeLoaded<TAccount>`
- `useCoStates()` returns `MaybeLoaded<T>[]`

Source: [packages/jazz-tools/dist/react-core/hooks.d.ts](https://github.com/garden-co/jazz/blob/main/packages/jazz-tools/src/react-core/hooks.ts)

### Jazz Documentation Pattern

From the official Jazz docs (jazz.tools/docs/react/using-covalues/subscription-and-loading):

> "When you load or subscribe to a CoValue through a hook (or directly), it can be either:
> - Loaded → The CoValue has been successfully loaded and all its data is available
> - Not Loaded → The CoValue is not yet available
>
> You can use the $isLoaded field to check whether a CoValue is loaded. For more detailed information about why a CoValue is not loaded, you can check $jazz.loadingState."

### Best Practices from Jazz

1. **Always check $isLoaded** before accessing CoValue data
2. **Use $jazz.loadingState** for detailed error handling
3. **Never rely on data being present** unless explicitly included in resolve query
4. **Use selectors and equalityFn** to prevent unnecessary re-renders

## Implementation in Regarde SDK

### Hooks Migrated to MaybeLoaded

The following hooks have been migrated to use `MaybeLoaded<T>`:

| Hook | Return Type |
|------|-------------|
| `useCheckout` | `MaybeLoaded<TCheckoutSession>` |
| `usePaymentStatus` | `MaybeLoaded<TPaymentEvent>` |
| `useSubscriptionForUser` | `MaybeLoaded<TSubscription>` |
| `usePaymentFlow` | `MaybeLoaded<TCheckoutSession>`, `MaybeLoaded<TPaymentEvent> \| null` |
| `useLicenseCheck` | `MaybeLoaded<TLicenseEvent>` |
| `useRegardeApp` | `MaybeLoaded<TRegardeApp>` |
| `useMyRegardeAccount` | `MaybeLoaded<TRegardeAccount>` |
| `useRegardeAuth` | `MaybeLoaded<TRegardeAccount>` |

### Pattern for Optional References

When a CoValue reference might not exist (e.g., `paymentEventId` might be undefined if checkout is still pending):

```typescript
export interface TUsePaymentFlowResult {
  checkout: MaybeLoaded<TCheckoutSession>;
  payment: MaybeLoaded<TPaymentEvent> | null;  // null = no payment yet
  status: TCheckoutSessionStatus | null;
  isLoading: boolean;
}
```

**Rationale**: Using `null` instead of `MaybeLoaded` when the ID doesn't exist provides clearer semantics:
- `null` → "There is no payment event yet" (expected state)
- `NotLoaded` → "We tried to load a payment but couldn't" (error state)

## Array Hooks Pattern

For hooks that return arrays of CoValues (like `usePaymentEvents`), we use a **filtered array pattern**:

```typescript
export interface UsePaymentEventsResult {
  events: TPaymentEvent[];           // Only loaded events (filtered)
  isLoading: boolean;
  totalCount: number;                // Total events including unloaded
  errorCount: number;                // How many failed to load
}
```

**Rationale**: 
- For lists, individual item loading states are rarely needed
- Users typically want to display "7 payments" vs "7 of 10 loaded"
- Simpler mental model - arrays are data, individual CoValues use MaybeLoaded
- If users need individual loading states, they can use `useCoStates` directly

## Migration Recommendations

### Tier 1: Simple Migrations (High Priority)

Hooks that return single CoValues from `useCoState`:

- `useRegardeApp` - Returns `TRegardeApp | null` → `MaybeLoaded<TRegardeApp>`
- `useMyRegardeAccount` - Returns `TRegardeAccount | null` → `MaybeLoaded<TRegardeAccount>`
- `useRegardeAuth` - Returns `co.loaded<typeof RegardeAccount> | null` → `MaybeLoaded<TRegardeAccount>`

### Tier 2: Array Hooks

Hooks that return arrays from `useCoStates`:

- `usePaymentEvents` - Returns `TPaymentEvent[]` (filtered to loaded only)
- `useSubscriptionEvents` - Returns `TSubscriptionEvent[]` (filtered to loaded only)
- `useLicenseEvents` - Returns `TLicenseEvent[]` (filtered to loaded only)

Each includes:
- `isLoading: boolean` - True if any loading in progress
- `totalCount: number` - Total items (loaded + unloaded)
- `errorCount: number` - Items that failed to load

### Tier 3: Complex Hooks

- `useActiveSubscriptions` - Stub implementation to be completed

### Tier 4: Action Hooks (No Change)

Mutation/action hooks don't need MaybeLoaded:

- `useCreateCheckout` - Creates checkout, returns result
- `usePauseSubscription` - Performs action, returns void/error
- `useRegardeStripeCheckoutLink` - Generates URL

## Type Imports

When implementing MaybeLoaded in hooks:

```typescript
import { useCoState } from "jazz-tools/react";
import type { MaybeLoaded } from "jazz-tools";

export interface TUseMyHookResult {
  value: MaybeLoaded<TMyCoValue>;
  isLoading: boolean;
}
```

## Consumer Usage Pattern

SDK users should follow this pattern:

```tsx
function MyComponent({ coValueId }: { coValueId: string }) {
  const { value, isLoading } = useMyHook({ coValueId });

  if (isLoading) {
    return <div>Initializing...</div>;
  }

  if (!value.$isLoaded) {
    switch (value.$jazz.loadingState) {
      case "loading":
        return <div>Loading data...</div>;
      case "unavailable":
        return <div>Data not found</div>;
      case "unauthorized":
        return <div>Access denied</div>;
    }
  }

  // TypeScript narrows to TMyCoValue here
  return <div>{value.someProperty}</div>;
}
```

## Breaking Changes

This migration is a **breaking change** for existing SDK users. Hooks that previously returned `T | null` now return `MaybeLoaded<T>`.

**Migration guide for users:**

```typescript
// BEFORE
const { value } = useOldHook();
if (value === null) return <div>Loading...</div>;
return <div>{value.name}</div>;

// AFTER
const { value } = useNewHook();
if (!value.$isLoaded) return <div>Loading...</div>;
return <div>{value.name}</div>;
```

## References

- [Jazz Subscription & Loading Docs](https://jazz.tools/docs/react/using-covalues/subscription-and-loading)
- [Jazz Source - react-core/hooks.ts](https://github.com/garden-co/jazz/blob/main/packages/jazz-tools/src/react-core/hooks.ts)
- [Type definition - MaybeLoaded](https://github.com/garden-co/jazz/blob/main/packages/jazz-tools/src/types.ts)

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-03-10 | Adopt MaybeLoaded pattern for all data-reading hooks | Aligns with Jazz ecosystem, provides better error handling, type-safe loading states |
| 2025-03-10 | Use `MaybeLoaded<T> \| null` for optional references | Distinguishes between "doesn't exist yet" (null) and "failed to load" (NotLoaded) |
| 2025-03-10 | Keep array hooks simple (filtered arrays) | Individual item errors less important than overall collection for lists |

---

*This document serves as long-term trace of our MaybeLoaded pattern decision for future reference and onboarding.*
