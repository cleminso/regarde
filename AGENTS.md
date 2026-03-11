# AGENTS.md - Repository Guidelines

## Commands

### Development

```bash
pnpm --filter <package> dev         # Dev mode for specific package
```

### Testing

```bash
pnpm test --run                     # Run all tests once
pnpm test --watch                   # Watch mode for tests
vitest path/to/test.test.ts         # Run single test file
```

### Build & Lint

```bash
pnpm --filter <package> build       # Build specific package
pnpm format-and-lint                # Check code style (Oxlint)
pnpm format-and-lint:fix            # Auto-fix code style
```

## Tool Stack

- **Vite 8** (with Rolldown): Build tool for all packages
- **Oxlint**: Fast linter (10-100x faster than ESLint)
- **Vitest**: Test runner (Vite-native)
- **TypeScript**: Strict type checking

### Key Build Patterns

- Libraries: `build.lib` with `formats: ["es", "cjs"]`
- Node.js APIs: Target `node22`, externalize dependencies
- Always use Vite watch mode (not Bun/Tsx) for development

## Directory Structure

```
packages/
├── sdk/               # Core SDK (@regarde-dev/core)
├── api.regarde.dev/   # Registry API service for Regarde.dev SDK
├── cli/               # User CLI tool
└── admin/             # Admin CLI tool
apps/
└── regarde.bio/       # Regarde.bio application
```

## Philosophy

- This codebase will outlive you. Every shortcut becomes someone else's burden.
- Every hack compounds into technical debt that slows the whole team down. You are not just writing code. You are shaping the future of this project.
- The patterns you establish will be copied. The corners you cut will be cut again.
- Fight entropy. Leave the codebase better than you found it.

## Code Style Guidelines

### Golden Rule - Boolean Pattern (Explicit Checks) - MANDATORY

ALWAYS use explicit `=== true` and `=== false` comparisons. NEVER use implicit truthiness checks (`!variable`, `variable` in conditions).

**Why:**

- Prevents TypeScript type narrowing issues with literal types
- Makes code read like English - explicit intent
- Avoids bugs from falsy values (`0`, `""`, `undefined`)
- Ensures consistent patterns across the codebase

```typescript
// FORBIDDEN - Implicit truthiness
if (!account.$isLoaded) {
  throw new Error("Not loaded");
}
if (account) {
  process(account);
}
if (!root.$jazz.has("field")) {
  createField();
}

// REQUIRED - Explicit boolean comparisons
const isLoaded = account !== null && account.$isLoaded === true;
if (isLoaded === false) {
  throw new Error("Not loaded");
}

const hasField = root.$jazz.has("field") === true;
if (hasField === false) {
  createField();
}

// For combined conditions, extract to named const
const isAccountValid =
  account !== null && account !== undefined && account.$isLoaded === true;
if (isAccountValid === false) {
  throw new Error("Invalid");
}
```

### MaybeLoaded Pattern - Hook Return Types

All data-reading hooks MUST return `MaybeLoaded<T>` to align with Jazz ecosystem patterns. This enables consistent loading states across all data access.

```typescript
import type { MaybeLoaded } from "jazz-tools";

// CORRECT - Returns MaybeLoaded
export interface TUseMyDataResult {
  data: MaybeLoaded<TMyData>;
  isLoading: boolean;
}

export function useMyData(options: TOptions): TUseMyDataResult {
  const data = useCoState(MyDataSchema, options.id);
  const isLoading = data === undefined;
  return { data, isLoading };
}

// INCORRECT - Returns non-MaybeLoaded
export interface TUseMyDataResult {
  data: TMyData | null; // Wrong! Should be MaybeLoaded<TMyData>
  isLoading: boolean;
}
```

### Type Predicate Pattern - Filter Callbacks

Use implicit parameter types with type predicates in filter callbacks. This maintains clean, readable code while providing proper type narrowing.

```typescript
// CORRECT - Implicit parameter type (matches codebase convention)
const loadedSubscriptions = subscriptions.filter(
  (sub): sub is TSubscription =>
    sub !== null && sub !== undefined && sub.$isLoaded === true,
);

// INCORRECT - Explicit 'unknown' parameter (too verbose, unnecessary)
const loadedSubscriptions = subscriptions.filter(
  (sub: unknown): sub is TSubscription =>
    sub !== null &&
    sub !== undefined &&
    (sub as { $isLoaded?: boolean }).$isLoaded === true,
);

// INCORRECT - Missing type predicate (loses type narrowing)
const loadedSubscriptions = subscriptions.filter(
  (sub) => sub !== null && sub !== undefined && sub.$isLoaded === true,
);
```

### Automated Enforcement (Oxlint)

The following patterns are automatically enforced via Oxlint rules in `.oxlintrc.json`:

**Enabled Rules:**

- `eqeqeq` - Enforces `===` and `!==` over `==` and `!=`
- `no-implicit-coercion` - Prevents implicit boolean coercion (e.g., `!!value`, `+value`)
- `no-extra-boolean-cast` - Prevents unnecessary boolean casts
- `typescript/strict-boolean-expressions` - Enforces explicit boolean checks in conditions (catches `if (string)`, `!object`, etc.)
- `@typescript-eslint/naming-convention` - Enforces 'T' prefix on type aliases

**Type-Aware Linting:**

The `strict-boolean-expressions` rule requires type information and runs with the `--type-aware` flag. The `oxlint-tsgolint` package provides this capability.

Run `pnpm format-and-lint` to check your code against these rules.

### Naming Conventions

- **Components**: PascalCase (`UserProfile`, `NicknameInput`)
- **Functions**: camelCase (`validateNickname`, `getProfileData`)
- **Types**: PascalCase with 'T' prefix (`TProfile`, `UserHandle`) - enforced by oxlint
- **Constants**: UPPER_SNAKE_CASE (`MAX_NICKNAME_LENGTH`)
- **Files**: camelCase for all files (`userProfile.tsx`)
- **Folders**: kebab-case at all levels (`user-profile/`) except `__tests__/`

### Imports

```typescript
// Order: framework, workspace imports, aliased imports, relative imports
import { useAccount } from "jazz-tools/react";
import { RegardeAccount } from "@regarde-dev/shared-schemas";
import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";
import { MyComponent } from "./MyComponent";
```

### Types & Error Handling

- Use strict TypeScript with explicit return types for public functions
- Never use `any` type - use `unknown` or proper typing
- Handle errors at business logic boundaries with specific error types
- Use Zod for runtime validation, never skip validation

### API Public-Private Boundaries

- SDK exports are **public API** used by external developers
- Maintain semantic versioning - breaking changes require major version bump
- Document all exported functions with JSDoc
- Keep internal helper functions private (not exported)

### Code Readability

- Write self-documenting code over comments
- Avoid double-negative semantics
- Use descriptive variable and function names
- Extract complex logic into well-named functions
- Only comment non-obvious business rules or external constraints

### Tailwind CSS Guidelines

- **Use standard spacing scale**: Prefer `w-60` over `w-[15rem]`
  - Standard classes enable Tailwind CSS IntelliSense and optimizations
  - Arbitrary values (`[15rem]`) disable JIT optimizations and TS warnings
  - Available scales: `w-0` to `w-96` (0-24rem), then `w-px`, fractions
  - For custom values, extend theme in `tailwind.config.ts` rather than using arbitrary values
- **Responsive prefixes**: Use `md:`, `lg:` consistently
- **Avoid arbitrary values** when standard alternative exists

### Testing

- **DO test**: validation rules, data transformation, error recovery
- **DON'T test**: Jazz sync, framework behavior
- Use `__tests__/` folders next to implementation files
- Test naming: `should [outcome] when [condition]`

## Jazz Architecture Rules

### Schema Usage

- **RegardeAccount**: User's complete account context (auth, private data)
- **RegardeProfile**: Public profile (name, bio, projects)
- **RegardeTokenAuth**: Registration token CoMap (2FA mechanism)
- **App / RegardeUserApp**: User's app definitions (name, payment provider, webhook config) - created by SDK users
- **PaymentEvent**: Individual payment transaction record from webhook - created by worker
- **RegistryAppMetadata**: Registry-controlled metadata for apps (verification status, access flags) - created by SDK developers

### Sync Safety (Critical)

- **Write-Wait-Use**: After CoMap write, call `coMap.$jazz.waitForSync()` before reading
- **Create-Set-Sync**: `create()` → `set()` → `waitForSync(specific)` → safe return
- Any "modify → read" pattern must have sync in between

### Authentication Flow

1. User generates token via `generateRegardeToken` (stored in `account.root["regarde-sdk"].auth`)
2. User sends token + CoMap ID in headers (`X-Regarde-Token`, `X-Regarde-Token-Id`)
3. API worker loads RegardeTokenAuth CoMap using `RegardeTokenAuth.load(regardeAuthCoValueId)`
4. Worker loads user account to verify ownership: `co.account().load(jazzAccountId, { loadAs: worker })`
5. Worker verifies user owns the token via `userAccount.canAdmin(regardeAuth)`
6. Worker checks token matches and has not expired (24-hour lifetime)
7. Worker remains stateless - each request independently verified

### User vs Registry Data Ownership

- **User data** (App, PaymentEvent): Owned by user's personal group
  - Load with `{ loadAs: worker }` from worker context
  - Access user group via `userAccount.root["regarde-sdk"].$jazz.owner`
- **Registry data** (RegistryAppMetadata, registry lists): Owned by worker
  - Used for metadata management, not user CoValues
  - RegistryAppMetadata contains reference to App, but doesn't own it

### Variable Naming

- `account`: RegardeAccount instance
- `RegardeTokenAuth`: Authentication token CoMap instance
- `worker`: RegistryWorkerAccount instance
- `App`: User's app CoMap instance
- `PaymentEvent`: Payment transaction CoMap instance
- `RegistryAppMetadata`: Registry metadata CoMap instance

## Package-Specific Guidelines

For detailed package-specific guidelines, see:

- `packages/sdk/AGENTS.md` - Core SDK architecture and patterns
- `packages/api.regarde.dev/AGENTS.md` - API server architecture and patterns
- `packages/cli/AGENTS.md` - User CLI (public) for authentication and app registration
- `packages/admin/AGENTS.md` - Admin CLI (developer-only) for registry operations
