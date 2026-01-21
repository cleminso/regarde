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
pnpm format-and-lint                # Check code style (Prettier + Oxlint)
pnpm format-and-lint:fix            # Auto-fix code style
```

## Tool Stack

- **Vite 8** (with Rolldown): Build tool for all packages
- **Oxlint**: Fast linter (10-100x faster than ESLint)
- **Vitest**: Test runner (Vite-native)
- **Prettier**: Code formatter with import sorting
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
```

## Code Style Guidelines

### Naming Conventions

- **Components**: PascalCase (`UserProfile`, `NicknameInput`)
- **Functions**: camelCase (`validateNickname`, `getProfileData`)
- **Types**: PascalCase with 'T' prefix (`TProfile`, `UserHandle`) - enforced by oxlint
- **Constants**: UPPER_SNAKE_CASE (`MAX_NICKNAME_LENGTH`)
- **Files**: camelCase for all files (`userProfile.tsx`)
- **Folders**: kebab-case at all levels (`user-profile/`) except `__tests__/`

### Imports (Prettier auto-enforced)

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

### Boolean Pattern (Explicit Checks)

```typescript
// Prefer explicit comparisons over implicit truthiness
const accountValid = account !== null && account.$isLoaded === true;
if (accountValid === false) {
  throw new Error("Account must be loaded");
}
```

### Testing

- **DO test**: validation rules, data transformation, error recovery
- **DON'T test**: Jazz sync, framework behavior
- Use `__tests__/` folders next to implementation files
- Test naming: `should [outcome] when [condition]`

### Logging

- No emojis in code, logs, or error messages
- Logger prefixes: `[ERROR]`, `[WARN]`, `[INFO]`, `[DEBUG]`, `[SUCCESS]`
- Example: `logger.error('Failed to validate nickname')`

## Jazz Architecture Rules

### Schema Usage

- **RegardeAccount**: User's complete account context (auth, private data)
- **RegardeProfile**: Public profile (name, bio, projects)
- **RegardeAuth**: Registration token CoMap (2FA mechanism)
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
3. API worker loads RegardeAuth CoMap using `RegardeAuth.load(regardeAuthCoValueId)`
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
- `RegardeAuth`: Authentication token CoMap instance
- `worker`: RegistryWorkerAccount instance
- `App`: User's app CoMap instance
- `PaymentEvent`: Payment transaction CoMap instance
- `RegistryAppMetadata`: Registry metadata CoMap instance
