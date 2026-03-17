# Code Style

Comprehensive style guide for all Regarde code. These rules are enforced by oxlint and must be followed without exception.

---

## 1. Boolean Pattern (Golden Rule)

ALWAYS use explicit `=== true` and `=== false` comparisons. NEVER use implicit truthiness checks.

### Why Explicit Checks Matter

1. **Type Safety**: TypeScript's type narrowing behaves predictably with explicit comparisons
2. **Clarity**: Code reads like English - "if is valid equals true"
3. **Bug Prevention**: Falsy values (`0`, `""`, `null`, `undefined`) do not trigger unexpected branches
4. **Discipline**: One implicit check normalizes sloppy patterns; explicit checks enforce rigor

### Correct Examples

```typescript
// Explicit null checks combined with boolean checks
const isLoaded = account !== null && account.$isLoaded === true;
if (isLoaded === false) {
  throw new Error("Account not loaded");
}

// Named constants for complex conditions
const isAccountValid =
  account !== null && 
  account !== undefined && 
  account.$isLoaded === true;
if (isAccountValid === false) {
  return null;
}

// Field existence checks
const hasField = root.$jazz.has("field") === true;
if (hasField === false) {
  createField();
}

// Loading checks with explicit boolean
const isRegistryLoaded =
  registry !== null && 
  registry !== undefined && 
  registry.$isLoaded === true;
if (isRegistryLoaded === false) {
  throw new Error("Registry not loaded");
}
```

### Incorrect Examples (Forbidden)

```typescript
// NEVER use implicit truthiness
if (!account.$isLoaded) {
  throw new Error("Not loaded");
}

// NEVER use implicit object checks
if (account) {
  process(account);
}

// NEVER use negation for existence
if (!root.$jazz.has("field")) {
  createField();
}

// NEVER rely on falsy values
if (count) {
  renderItems();
}

// NEVER use double negation
if (!!isEnabled) {
  enableFeature();
}
```

### Complex Condition Extraction

When conditions become complex, extract them into named constants:

```typescript
// CORRECT - Extract to named const
const canProcessPayment =
  account !== null &&
  account.$isLoaded === true &&
  account.paymentProvider !== null &&
  account.paymentProvider !== undefined;

if (canProcessPayment === true) {
  await processPayment(account);
}

// INCORRECT - Inline complexity
if (account && account.$isLoaded && account.paymentProvider) {
  await processPayment(account);
}
```

### Automated Enforcement

This rule is enforced by oxlint. Violations will fail CI.

---

## 2. MaybeLoaded Pattern

Hook return types follow distinct patterns based on what they return.

### Single-Item Hooks: MaybeLoaded<T>

Hooks returning a single CoValue MUST use `MaybeLoaded<T>` to preserve loading state information:

```typescript
import type { MaybeLoaded } from "jazz-tools";

// CORRECT - Returns MaybeLoaded for single items
export interface TUseRegardeAppResult {
  data: MaybeLoaded<TRegardeApp>;
  isLoading: boolean;
}

export function useRegardeApp(options: TOptions): TUseRegardeAppResult {
  const data = useCoState(RegardeAppSchema, options.id);
  const isLoading = data === undefined;
  return { data, isLoading };
}
```

### Collection Hooks: Filtered Arrays

Hooks returning collections use filtered arrays (only loaded items):

```typescript
// CORRECT - Returns filtered array for collections
export interface TUsePaymentEventsResult {
  events: TPaymentEvent[];  // Only loaded events
  isLoading: boolean;
  totalCount: number;
}

export function usePaymentEvents(): TUsePaymentEventsResult {
  const allEvents = useCoState(PaymentEventMap);
  
  // Filter to loaded items only
  const events = allEvents.filter(
    (event): event is TPaymentEvent =>
      event !== null && event !== undefined && event.$isLoaded === true
  );
  
  const isLoading = allEvents === undefined;
  const totalCount = events.length;
  
  return { events, isLoading, totalCount };
}
```

### Why This Distinction Matters

| Aspect | MaybeLoaded<T> | Filtered Array |
|--------|---------------|----------------|
| Use Case | Single CoValues | Collections |
| Loading State | Preserved in type | Derived from undefined |
| Access Pattern | Check if null | Direct array iteration |
| Mental Model | "This item may not exist" | "Here are the loaded items" |

- Users want "7 payments" not "7 of 10 loaded"
- Simpler mental model - arrays are data, individual CoValues use MaybeLoaded
- If individual loading states are needed, use `useCoStates` directly

---

## 3. Type Predicate Pattern

Use implicit parameter types with type predicates in filter callbacks.

### Correct: Implicit Parameter Types

```typescript
// CORRECT - Implicit parameter type with type predicate
const loadedEvents = events.filter(
  (event): event is TPaymentEvent =>
    event !== null && event !== undefined && event.$isLoaded === true
);

// CORRECT - Multiple filters
const activeSubscriptions = subscriptions.filter(
  (sub): sub is TSubscription =>
    sub !== null && sub !== undefined && sub.$isLoaded === true
).filter(
  (sub) => sub.status === "active"
);
```

### Incorrect: Explicit 'unknown' (Too Verbose)

```typescript
// INCORRECT - Explicit 'unknown' is too verbose
const loadedEvents = events.filter(
  (event: unknown): event is TPaymentEvent =>
    event !== null && 
    event !== undefined && 
    (event as { $isLoaded?: boolean }).$isLoaded === true
);
```

### Incorrect: Missing Type Predicate

```typescript
// INCORRECT - Missing type predicate loses narrowing
const loadedEvents = events.filter(
  (event) =>
    event !== null && event !== undefined && event.$isLoaded === true
);
// Result is not narrowed - still (TPaymentEvent | null | undefined)[]
```

---

## 4. Naming Conventions

Complete reference for all naming patterns.

### Components: PascalCase

```typescript
// PascalCase for React components
function PaymentCard({ payment }: TPaymentCardProps) {
  return <div>{payment.amount}</div>;
}

function UserProfile() {
  return <ProfileLayout />;
}
```

### Functions: camelCase

```typescript
// camelCase for functions
function generateRegardeToken(): string {
  return crypto.randomUUID().slice(0, 16);
}

async function validateUserInput(input: TUserInput): Promise<boolean> {
  return inputSchema.safeParse(input).success;
}
```

### Types: PascalCase with 'T' Prefix

```typescript
// PascalCase with 'T' prefix for types
interface TRegardeAccount {
  id: string;
  nickname: string;
}

type TPaymentStatus = "pending" | "completed" | "failed";

interface TUseMyDataResult {
  data: MaybeLoaded<TMyData>;
  isLoading: boolean;
}
```

### Constants: UPPER_SNAKE_CASE

```typescript
// UPPER_SNAKE_CASE for constants
const TOKEN_LIFETIME_SECONDS = 86400;  // 24 hours
const MAX_NICKNAME_LENGTH = 20;
const DEFAULT_PAGE_SIZE = 50;

// Enum-style constants
const PAYMENT_PROVIDERS = {
  STRIPE: "stripe",
  POLAR: "polar",
  LEMONSQUEEZY: "lemonsqueezy",
} as const;
```

### Files: camelCase

```typescript
// File names use camelCase
// useMyRegardeAccount.ts
// generateRegardeToken.ts
// paymentCard.tsx
// nicknameRegistry.ts
```

### Folders: kebab-case

```typescript
// Folders use kebab-case
// src/
//   payment-events/
//   subscription-manager/
//   core-beliefs/
//   __tests__/  (exception - double underscore allowed)
```

### Automated Enforcement

- Types with 'T' prefix enforced by oxlint
- Variable naming conventions enforced by oxlint
- File naming checked in CI

---

## 5. Import Order

Standardized import ordering for consistency.

```typescript
// 1. External dependencies (node: and npm)
import "dotenv/config";
import { serve } from "@hono/node-server";
import { co, z, type ID } from "jazz-tools";
import { useState } from "react";

// 2. Workspace dependencies (@regarde-dev/*)
import { RegardeAccount } from "@regarde-dev/core";
import { someUtil } from "@regarde-dev/admin";

// 3. Aliased imports (#/)
import { generateRegardeToken } from "#managers/auth/generateToken";
import { useLogging } from "#core/logger";
import { createMockRequest } from "#/test-utils/index.js";

// 4. Relative imports (./, ../)
import { myHelper } from "./myHelper";
import { constants } from "../constants";
import { siblingUtil } from "../utils/helpers";
```

### Import Guidelines

- Group imports by category with blank lines between
- Use explicit `.js` extensions for relative imports
- Prefer aliased imports over deep relative paths
- Import types with `type` keyword for clarity

---

## 6. Tailwind CSS Guidelines

Styling conventions for maintainable CSS.

### Standard Spacing Scale Preferred

```tsx
// CORRECT - Use standard spacing scale
<div className="p-4 m-2 gap-3">
<div className="px-6 py-4">
<div className="space-y-4">

// INCORRECT - Arbitrary values
<div className="p-[17px] m-[9px]">
<div className="px-[25px] py-[18px]">
```

### Avoid Arbitrary Values

```tsx
// CORRECT - Use nearest standard value
<div className="w-64">      // Instead of w-[250px]
<div className="h-32">      // Instead of h-[128px]
<div className="text-sm">   // Instead of text-[14px]

// INCORRECT - Arbitrary values
<div className="w-[250px]">
<div className="h-[128px]">
<div className="text-[14px]">
```

### Responsive Prefixes Consistently

```tsx
// CORRECT - Order: base → sm → md → lg → xl
<div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4">

// CORRECT - Mobile-first approach
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// INCORRECT - Inconsistent ordering
<div className="lg:w-1/4 w-full sm:w-1/2">
```

### Why Standard Classes Matter

1. **JIT Optimization**: Tailwind's JIT engine optimizes standard classes better
2. **Consistency**: Standard scale ensures spacing alignment across UI
3. **Maintainability**: Standard values are easier to adjust globally
4. **Readability**: `p-4` is immediately recognizable as 1rem/16px

---

## 7. Comments

When to comment and when to let code speak for itself.

### Self-Documenting Code Preferred

```typescript
// CORRECT - Code explains itself
function calculateProratedRefund(
  originalAmount: number,
  daysUsed: number,
  totalDays: number
): number {
  const dailyRate = originalAmount / totalDays;
  const unusedDays = totalDays - daysUsed;
  return dailyRate * unusedDays;
}

// INCORRECT - Comment explains obvious logic
function calcRefund(amount: number, used: number, total: number): number {
  // Calculate daily rate
  const rate = amount / total;
  // Calculate unused days
  const unused = total - used;
  // Return refund amount
  return rate * unused;
}
```

### Comment the "Why", Not the "What"

```typescript
// CORRECT - Explains business reason
// Stripe requires amount in cents, not dollars
const amountInCents = dollarAmount * 100;

// CORRECT - Explains constraint
// Jazz requires waitForSync() after write before read
await newCoMap.$jazz.waitForSync();

// INCORRECT - States the obvious
// Multiply amount by 100
const amount = dollars * 100;
```

### Non-Obvious Business Rules

```typescript
// CORRECT - Explain complex business logic
// Tokens expire after 24 hours per security requirements.
// User must re-authenticate with passphrase after expiry.
const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

// CORRECT - Document edge case handling
// Empty nicknames are reserved to prevent confusion
// with unset profile fields in UI
if (nickname.length === 0) {
  throw new Error("Nickname cannot be empty");
}
```

### External Constraints

```typescript
// CORRECT - Document external API quirks
// Jazz CoMaps require explicit null checks before access
// due to lazy loading behavior
const isLoaded = coMap !== null && coMap.$isLoaded === true;

// CORRECT - Document workaround
// Hono's type inference fails with async handler factories,
// so we use explicit return type annotation
export const handler = (): Handler => async (c) => { ... };
```

### When NOT to Comment

```typescript
// DON'T comment obvious initialization
// Initialize counter  
let count = 0;

// DON'T comment standard patterns
// Check if array is empty
if (items.length === 0) { ... }

// DON'T comment what functions do (use JSDoc for public APIs)
// This function validates the input
function validateInput(input: string): boolean { ... }
```

---

## Summary Checklist

Before committing code, verify:

- [ ] Boolean checks use `=== true/false`, never implicit truthiness
- [ ] Single-item hooks return `MaybeLoaded<T>`
- [ ] Collection hooks return filtered arrays
- [ ] Filter callbacks use implicit parameter types with type predicates
- [ ] Types use 'T' prefix (PascalCase)
- [ ] Functions use camelCase, constants use UPPER_SNAKE_CASE
- [ ] Import order: external → workspace → aliased → relative
- [ ] Standard Tailwind classes preferred over arbitrary values
- [ ] Comments explain "why", not "what"
- [ ] No `any` types used
- [ ] Explicit return types on public functions
- [ ] Zod validation for all external inputs
