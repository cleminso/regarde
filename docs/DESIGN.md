# DESIGN.md - Architecture and Invariants

This document captures the design principles and invariants that govern the Regarde.dev codebase. It serves as the single source of truth for architectural decisions, coding patterns, and verification mechanisms.

## Table of Contents

1. [Core Beliefs](#core-beliefs)
2. [Invariant Rules](#invariant-rules)
3. [Code Style Architecture](#code-style-architecture)
4. [Types & Error Handling](#types--error-handling)
5. [Jazz Architecture Principles](#jazz-architecture-principles)
6. [Verification Status](#verification-status)
7. [Recurring Cleanup Processes](#recurring-cleanup-processes)

## Core Beliefs

### 1. Longevity Over Convenience

**This codebase will outlive you.** Every shortcut becomes someone else's burden. Code written today will be maintained long after you have moved on. Optimize for the future maintainer, not for shipping quickly today.

### 2. Entropy Is the Enemy

**Every hack compounds into technical debt.** A single workaround multiplies into dozens. What starts as a quick fix becomes a pattern that slows the entire team. Fight entropy aggressively. Leave the codebase better than you found it.

### 3. Patterns Breed Patterns

**The patterns you establish will be copied.** The corners you cut will be cut again. Every decision sets a precedent. If you allow one sloppy abstraction, you are inviting ten more. If you demonstrate rigorous testing, others will follow.

### 4. You Shape the Future

**You are not just writing code.** You are shaping the future of this project. Your decisions today determine what is possible tomorrow. Be intentional. Be disciplined. Be professional.

## Invariant Rules

The following rules are non-negotiable. They are enforced through automated tooling, code review, and cultural norms.

### 1. Boolean Pattern - Explicit Checks Only

**ALWAYS use explicit `=== true` and `=== false` comparisons. NEVER use implicit truthiness checks (`!variable`, `variable` in conditions).**

See [code-style.md](code-style.md#boolean-pattern) for comprehensive examples and rationale.

**Invariant**: All boolean checks must be explicit. Enforced by Oxlint `strict-boolean-expressions` rule.

### 2. MaybeLoaded Pattern - Hook Return Types

**All data-reading hooks MUST return `MaybeLoaded<T>` to align with Jazz ecosystem patterns.** This enables consistent loading states across all data access.

**CORRECT:**

```typescript
import type { MaybeLoaded } from "jazz-tools";

// Returns MaybeLoaded
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

**INCORRECT:**

```typescript
// Returns non-MaybeLoaded
export interface TUseMyDataResult {
  data: TMyData | null; // Wrong! Should be MaybeLoaded<TMyData>
  isLoading: boolean;
}
```

### 3. Type Predicate Pattern - Filter Callbacks

**Use implicit parameter types with type predicates in filter callbacks.** This maintains clean, readable code while providing proper type narrowing.

**CORRECT:**

```typescript
// Implicit parameter type (matches codebase convention)
const loadedSubscriptions = subscriptions.filter(
  (sub): sub is TSubscription =>
    sub !== null && sub !== undefined && sub.$isLoaded === true,
);
```

**INCORRECT:**

```typescript
// Explicit 'unknown' parameter (too verbose, unnecessary)
const loadedSubscriptions = subscriptions.filter(
  (sub: unknown): sub is TSubscription =>
    sub !== null &&
    sub !== undefined &&
    (sub as { $isLoaded?: boolean }).$isLoaded === true,
);

// Missing type predicate (loses type narrowing)
const loadedSubscriptions = subscriptions.filter(
  (sub) => sub !== null && sub !== undefined && sub.$isLoaded === true,
);
```

### 4. Sync Safety - Write-Wait-Use Pattern

**After any CoMap write, you MUST wait for sync before reading.** Jazz CoValues are eventually consistent.

See [jazz-patterns.md](jazz-patterns.md#sync-safety) for comprehensive examples and patterns.

**Invariant**: All CoMap writes must be followed by `waitForSync()` before reads. Manual review required.

### 5. Naming Convention - T-Prefix for Types

**All type aliases MUST use PascalCase with a 'T' prefix.** This is enforced by Oxlint and provides immediate visual distinction between types and values.

**CORRECT:**

```typescript
// Types with T-prefix
export type TProfile = {
  name: string;
  bio: string;
};

export type TUserHandle = string;

export interface TAppConfig {
  name: string;
  paymentProvider: "stripe" | "paypal";
}
```

**INCORRECT:**

```typescript
// Missing T-prefix
export type Profile = {
  name: string;
};

export interface AppConfig {
  name: string;
}
```

## Code Style Architecture

### Explicit Over Implicit

Code should read like English. Intent should be immediately obvious. Prefer verbosity over cleverness.

**Examples:**

- Always use explicit boolean checks (`=== true`, `=== false`)
- Extract complex conditions to named constants
- Use full words, not abbreviations (`configuration` not `cfg`)
- Prefer `if/else` chains over ternary nesting beyond 2 levels

### Self-Documenting Code

Comments should explain the "why," not the "what." The code itself should explain the "what."

**CORRECT:**

```typescript
// Stripe requires idempotency keys for retry safety
const idempotencyKey = generateUUID();

const normalizedEmail = email.toLowerCase().trim();
```

**INCORRECT:**

```typescript
// Generate idempotency key
const key = generateUUID();

// Normalize email
const e = email.toLowerCase().trim();
```

## Types & Error Handling

This is a **strict TypeScript** codebase. Type safety is not optional. It is the foundation upon which all other quality is built.

### No `any` Type - EVER

**`any` is forbidden.** It defeats the entire purpose of TypeScript. It allows bugs to slip through. It makes refactoring dangerous. It turns compile-time errors into runtime errors.

**Use instead:**

- `unknown` when the type is truly unknown
- Proper typing with generics when the type varies
- Discriminated unions when the type depends on a discriminator
- `satisfies` operator when you want to check type compatibility without widening

**CORRECT:**

```typescript
// Use unknown for truly unknown data
function processUnknownData(data: unknown): string {
  if (typeof data === "string") {
    return data.toUpperCase();
  }
  throw new Error("Expected string");
}

// Use generics for varying types
function wrapInArray<T>(value: T): T[] {
  return [value];
}

// Use discriminated unions
export type TPaymentResult =
  | { success: true; paymentId: string }
  | { success: false; error: string };

// Use satisfies for type checking without widening
const config = {
  timeout: 5000,
  retries: 3,
} satisfies TConfig;
```

**INCORRECT:**

```typescript
// NEVER use any
function processData(data: any): any {
  return data.value;
}

// Avoid implicit any
function badFunction(x) {
  return x + 1;
}
```

### Strict TypeScript Configuration

All packages use strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Explicit Return Types for Public Functions

**Every exported function MUST declare its return type.** This serves as documentation, enables better IDE support, and catches errors at the function definition rather than at the call site.

**CORRECT:**

```typescript
// Public API - explicit return type
export function validateToken(token: string): TValidationResult {
  // implementation
}

// Complex logic - explicit return type helps catch errors
export function parsePaymentWebhook(payload: unknown): TPaymentEvent {
  // implementation
}
```

**INCORRECT:**

```typescript
// Missing return type - TypeScript infers, but intent is unclear
export function validateToken(token: string) {
  // implementation
}

// Return type inferred from implementation details
export async function fetchUser(id: string) {
  const response = await api.get(`/users/${id}`);
  return response.data;
}
```

### Zod for Runtime Validation

**All external data MUST be validated with Zod.** Never assume data from APIs, user input, or external systems matches your TypeScript types. TypeScript types are compile-time only. Runtime validation is required.

**CORRECT:**

```typescript
import { z } from "zod";

// Define schema
export const PaymentWebhookSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(["USD", "EUR", "GBP"]),
  status: z.enum(["succeeded", "failed", "pending"]),
  metadata: z.record(z.unknown()).optional(),
});

export type TPaymentWebhook = z.infer<typeof PaymentWebhookSchema>;

// Validate at boundary
export function parseWebhookPayload(payload: unknown): TPaymentWebhook {
  const result = PaymentWebhookSchema.safeParse(payload);

  if (result.success === false) {
    throw new WebhookValidationError("Invalid webhook payload", result.error);
  }

  return result.data;
}
```

**INCORRECT:**

```typescript
// No validation - trusting external data
function processWebhook(payload: unknown): TPaymentEvent {
  const data = payload as TPaymentEvent; // Dangerous cast!
  return data;
}

// Partial validation - missing required fields
function partialValidation(payload: unknown): TPaymentEvent {
  if (typeof payload === "object" && payload !== null) {
    return payload as TPaymentEvent;
  }
  throw new Error("Invalid");
}
```

### Error Handling at Boundaries

**Handle errors at business logic boundaries.** Define specific error types for different failure modes. Never throw generic `Error` instances in business logic.

**CORRECT:**

```typescript
// Specific error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class SyncError extends Error {
  constructor(
    message: string,
    public readonly coValueId: string,
  ) {
    super(message);
    this.name = "SyncError";
  }
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly tokenId?: string,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

// Use specific errors at boundaries
export async function verifyToken(
  tokenId: string,
  token: string,
): Promise<TTokenVerificationResult> {
  const tokenAuth = await RegardeTokenAuth.load(tokenId);

  if (tokenAuth === undefined || tokenAuth.$isLoaded === false) {
    throw new AuthenticationError("Token not found", tokenId);
  }

  if (tokenAuth.token !== token) {
    throw new AuthenticationError("Invalid token", tokenId);
  }

  if (tokenAuth.expiresAt < Date.now()) {
    throw new AuthenticationError("Token expired", tokenId);
  }

  return { tokenAuth, account: tokenAuth.$jazz.owner };
}
```

**INCORRECT:**

```typescript
// Generic errors lose context
if (tokenAuth === undefined) {
  throw new Error("Not found"); // What was not found?
}

// String-based error checking
if (error.message === "Token expired") {
  // Fragile - depends on exact string match
}
```

### Never Use `any` for Error Types

**Never use `any` in catch blocks or error handling.** Use `unknown` and type narrowing, or use specific error types.

**CORRECT:**

```typescript
// Narrow unknown errors
try {
  await operation();
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    // Handle validation error
    return { success: false, field: error.field };
  }

  if (error instanceof Error) {
    // Handle generic errors
    logger.error(error.message);
    return { success: false, error: error.message };
  }

  // Handle non-Error throws
  logger.error("Unknown error", error);
  return { success: false, error: "Unknown error" };
}

// Specific error union
export type TOperationError =
  | ValidationError
  | SyncError
  | AuthenticationError
  | NetworkError;

try {
  await operation();
} catch (error: TOperationError) {
  // Type-safe error handling
}
```

**INCORRECT:**

```typescript
// Using any - loses all type safety
try {
  await operation();
} catch (error: any) {
  console.log(error.message); // Could be undefined
  return error.code; // Could be undefined
}
```

## Jazz Architecture Principles

### Schema Ownership

Understand who owns each schema and how it is loaded:

| Schema | Owner | Created By | Loaded With |
|--------|-------|------------|-------------|
| `RegardeAccount` | User | SDK | `{ loadAs: account }` |
| `RegardeProfile` | User | SDK | `{ loadAs: account }` |
| `RegardeTokenAuth` | User | SDK | `{ loadAs: account }` |
| `App` / `RegardeUserApp` | User | SDK user | `{ loadAs: worker }` |
| `PaymentEvent` | User | API worker | `{ loadAs: worker }` |
| `RegistryAppMetadata` | Registry | SDK developer | `{ loadAs: worker }` |

### Authentication Flow

All API requests follow the same stateless verification pattern:

1. **Client:** Generates token via `generateRegardeToken()` → stored in `account.root["regarde-sdk"].auth`
2. **Client:** Sends headers: `X-Regarde-Token` and `X-Regarde-Token-Id`
3. **Worker:** Loads `RegardeTokenAuth` using `RegardeTokenAuth.load(tokenId)`
4. **Worker:** Loads user account: `co.account().load(jazzAccountId, { loadAs: worker })`
5. **Worker:** Verifies ownership: `userAccount.canAdmin(regardeAuth)`
6. **Worker:** Validates token matches and is not expired (24-hour lifetime)
7. **Worker:** Processes request - each request is independently verified

### Sync Safety in Practice

Every write operation must be followed by a wait:

```typescript
// Anti-pattern: Write without wait
app.name = newName;
return app; // May have stale data

// Correct pattern: Write with wait
app.name = newName;
await app.$jazz.waitForSync({ property: "name" });
return app; // Guaranteed fresh data
```

## Verification Status

### Automated Verification

The following invariants are automatically enforced via Oxlint:

| Rule | Enforcement | File |
|------|-------------|------|
| `eqeqeq` | `===` and `!==` required | `.oxlintrc.json` |
| `no-implicit-coercion` | No `!!value`, `+value` | `.oxlintrc.json` |
| `no-extra-boolean-cast` | No unnecessary boolean casts | `.oxlintrc.json` |
| `strict-boolean-expressions` | No implicit truthiness | `.oxlintrc.json` |
| `naming-convention` | T-prefix for types | `.oxlintrc.json` |

**Run:** `pnpm format-and-lint`

**Auto-fix:** `pnpm format-and-lint:fix`

### Manual Verification

The following invariants require code review and discipline:

- **Sync Safety**: All write operations followed by `waitForSync`
- **Zod Validation**: All external inputs validated
- **Explicit Returns**: Public functions declare return types
- **No `any`**: No `any` types anywhere
- **Error Types**: Specific error types, not generic `Error`

### Code Review Checklist

Before merging any PR, verify:

- [ ] No `any` types introduced
- [ ] All public functions have explicit return types
- [ ] All external data validated with Zod
- [ ] All CoValue writes followed by `waitForSync`
- [ ] Boolean checks use `=== true` / `=== false`
- [ ] Error handling uses specific error types
- [ ] Type aliases use T-prefix
- [ ] Oxlint passes (`pnpm format-and-lint`)

## Recurring Cleanup Processes

### Weekly Review

1. **Run Oxlint across all packages**
   ```bash
   pnpm format-and-lint
   ```

2. **Check for `any` types**
   ```bash
   grep -r "any" packages/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
   ```

3. **Review error handling**
   - Ensure no generic `throw new Error()` in business logic
   - Verify specific error types are used

4. **Validate sync safety**
   - Search for CoValue write patterns
   - Ensure `waitForSync` follows every write

### Monthly Refactor

1. **Type audit**
   - Review public API surface
   - Ensure all exports have explicit types

2. **Error taxonomy review**
   - Consolidate duplicate error types
   - Document new error patterns

3. **Pattern documentation**
   - Update this document with new patterns
   - Remove deprecated patterns

### Quarterly Review

1. **Philosophy alignment**
   - Review codebase against core beliefs
   - Identify entropy buildup
   - Plan refactoring sprints

2. **Invariant evolution**
   - Evaluate if new invariants are needed
   - Assess automated enforcement gaps
   - Update tooling if needed

---

**Remember:** This codebase will outlive you. Fight entropy. Leave it better than you found it.
