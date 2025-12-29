# AGENTS.md - Repository Guidelines

## Table of Contents

- [Commands](#commands)
  - [Development](#development)
  - [Testing](#testing)
  - [Build & Lint](#build--lint)
- [Directory Structure](#directory-structure)
- [Code Style Guidelines](#code-style-guidelines)
  - [Code Readability](#code-readability)
  - [Imports (Prettier enforced)](#imports-prettier-enforced)
  - [Naming Conventions](#naming-conventions)
  - [Types & Error Handling](#types--error-handling)
  - [Testing Philosophy - Critical](#testing-philosophy---critical)
  - [Documentation Standards](#documentation-standards)
    - [JSDoc Guidelines](#jsdoc-guidelines)
  - [Output & Logging Standards](#output--logging-standards)
  - [Jazz Architecture Rules](#jazz-architecture-rules)

## Commands

### Development

```bash
pnpm dev                            # Start all packages in dev mode
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

## Tool Stack & Best Practices

### Core Tools

- **Vite 8**: Build tool and dev server (uses Rolldown bundler under the hood)
- **Oxlint**: Fast Rust-based linter (replaces ESLint)
- **Vitest**: Test runner (Vite-native)
- **Prettier**: Code formatter
- **TypeScript**: Type checking via Vite/Vitest

### Tool Usage Guidelines

#### Vite 8 + Rolldown

Vite 8 with Rolldown provides fast builds. All packages should use Vite for building:

```bash
# Library builds (SDK, schemas)
pnpm --filter @regarde-dev/sdk build        # Vite build with multiple entry points
pnpm --filter @regarde-dev/jazz-schemas build

# Application builds (frontend, APIs)
pnpm --filter @regarde-dev/frontend build
pnpm --filter @regarde-dev/api.regarde.bio build
```

**Vite config patterns:**

- Libraries: Use `build.lib` format with `formats: ["es", "cjs"]`
- Node.js APIs: Target `node22`, external dependencies
- Frontend: SPA mode with manual chunks for vendors
- CI/Node services: Use `vite build --watch` instead of `bun --watch`

#### Oxlint (Linting)

Oxlint provides instant feedback (10-100x faster than ESLint). Run before commits:

```bash
# Check all packages
pnpm format-and-lint

# Fix auto-fixable issues
pnpm format-and-lint:fix

# Run oxlint directly for specific files
oxlint packages/sdk/src --ext .ts
```

**Oxlint rules (configured in .oxlintrc.json):**

- `correctness`: Errors for bugs logic errors
- `suspicious`: Warnings for potential bugs
- `pedantic`, `style`, `restriction`: Off (use Prettier)

#### Vitest (Testing)

Vitest is Vite-native and fast. Use for business logic testing:

```bash
# Watch mode during development
pnpm test --watch

# Run once (CI)
pnpm test:run

# Run with UI
pnpm --filter <package> test:ui

# Run specific test file
vitest path/to/test.test.ts
```

#### Development Services

**Use Vite watch mode instead of Bun/Tsx:**

```bash
# Good - Vite watch (fast rebuilds, type-checks)
pnpm --filter @regarde-dev/api.regarde.bio dev
pnpm --filter @regarde-dev/api.regarde.bio build --watch

# Avoid - Bun watch (slower, non-standard)
bun --watch src/index.ts

# Avoid - Tsx (no Vite integration, slower)
tsx src/index.ts
```

**CLI execution:**

```bash
# Use Node for built CLI (fast, no rebuilds)
node packages/cli/dist/index.mjs

# Use Vite watch for development
pnpm --filter @regarde-dev/cli dev
```

### Package Build Patterns

#### Library Packages (SDK, schemas, admin CLI)

```typescript
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
      outDir: "dist",
      entryRoot: "src",
    }),
  ],
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["jazz-tools", "zod"], // Don't bundle dependencies
    },
  },
});
```

#### Node.js API Packages

```typescript
export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    target: "node22",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["hono", "jazz-tools", "zod", ...builtinModules],
    },
  },
});
```

#### Frontend Applications

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("react") || id.includes("react-dom")) {
            return "vendor-react";
          }
          if (id.includes("@radix-ui")) {
            return "vendor-ui";
          }
        },
      },
    },
  },
});
```

### Performance Tips

1. **Use Vite watch mode** instead of Bun watch for faster rebuilds
2. **Enable Rolldown** in Vite config for 2-5x build speedup
3. **Run oxlint before commits** - instant feedback
4. **Test with Vitest in watch mode** during development
5. **Parallel builds**: Use `pnpm -r build` for all packages
6. **Minimize external dependencies** in builds (use `external` in rollupOptions)

### Migration Checklist

When adding new packages or tools:

- [ ] Build with Vite (not tsup/tsdown/esbuild)
- [ ] Lint with Oxlint (not ESLint)
- [ ] Test with Vitest (not Jest)
- [ ] Format with Prettier
- [ ] Use Vite watch for development (not Bun/Tsx)
- [ ] Add build script to package.json scripts

## Directory Structure

```
regarde.dev/
├── app/
│   └── regarde.bio/
│       ├── frontend/          # Frontend application (previously regarde.bio package)
│       ├── api.regarde.bio/   # Profile API service
│       └── jazz-schemas/      # Jazz schemas shared across the app
└── packages/
    ├── sdk/                   # Regarde SDK for authentication and profile management
    ├── api.regarde.dev/       # Nickname registry API service
    └── admin/                 # Admin CLI tool
```

## Code Style Guidelines

### Code Readability

- Prefer maximally readable code over writing comments
- Avoid double-negative semantics
- Use descriptive variable and function names that explain intent
- Extract complex logic into well-named functions
- Only add comments for non-obvious business rules or external constraints
- Refactor unclear code rather than documenting it
- Keep JSDoc updated after changes

#### Explicit Boolean Naming Pattern

**Golden Rule:** "Want → Build → Check Wrong"

##### Three-Step Pattern

1. **WANT** - Name the positive condition you desire
2. **BUILD** - Use explicit comparisons (`!== null`, `=== true`)
3. **CHECK WRONG** - Check for negative with `=== false`

##### Examples

```typescript
// Anti-pattern: Direct negation with implicit truthiness
if (!account || !account.$isLoaded) {
  throw new Error("Account must be loaded");
}

// Pattern: Explicit boolean naming
const accountValid = account !== null && account.$isLoaded === true;
if (accountValid === false) {
  throw new Error("Account must be loaded");
}

// Anti-pattern: Compound OR of negatives
if (!hasToken || !hasExpiresAt) {
  throw new Error("missing fields");
}

// Pattern: Single negation with named boolean
const hasToken = regardeSDK.auth.$jazz.has("token") === true;
const hasExpiresAt = regardeSDK.auth.$jazz.has("expiresAt") === true;
const bothFieldsPresent = hasToken && hasExpiresAt;
if (bothFieldsPresent === false) {
  throw new Error("missing fields");
}

// Anti-pattern: Nested access with negation
if (!regardeSDK.auth?.$isLoaded) {
  throw new Error("auth not loaded");
}

// Pattern: Extract then check
const auth = regardeSDK.auth;
const authLoaded = auth !== null && auth.$isLoaded === true;
if (authLoaded === false) {
  throw new Error("auth not loaded");
}
```

##### Recognition Checklist

- [ ] Variable name describes WHAT you want to be true (`accountValid`, `sdkExists`, `authLoaded`)
- [ ] Use `!== null` instead of `!` for null/undefined checks
- [ ] Use `=== true` instead of relying on implicit truthiness
- [ ] Use `=== false` instead of `!` when checking negative condition
- [ ] Extract complex conditions to named booleans before checking

### Imports (Prettier enforced)

```typescript
// Order: builtins, third-party, absolute imports, relative imports
import { useAccount } from "jazz-tools/react"; // Framework first
import { RegardeAccount } from "@regarde-dev/shared-schemas"; // Workspace next
import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount"; // Aliased imports
import { MyComponent } from "./MyComponent"; // Relative last
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile`, `NicknameInput`)
- **Functions**: camelCase (`validateNickname`, `getProfileData`)
- **Types**: PascalCase with 'T' prefix optional (`TProfile`, `UserHandle`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_NICKNAME_LENGTH`, `API_ENDPOINT`)
- **Files**: camelCase for all files (`userProfile.tsx`, `validateNickname.ts`)
- **Folders**: kebab-case at all levels (`user-profile/`, `api-client/`) except `__tests__/`

### Types & Error Handling

- Use strict TypeScript with explicit return types for public functions
- Never use `any` type - use `unknown` or proper typing
- Handle errors at business logic boundaries with specific error types
- Use Zod for runtime validation, never skip validation

### Testing Philosophy - Critical

**"Test business logic, trust the framework"**

- DO test: validation rules, data transformation, error recovery
- DON'T test: Jazz sync, React rendering, framework behavior
- Use `__tests__/` folders next to implementation files
- Test naming: `should [outcome] when [condition]`

### Documentation Standards

#### JSDoc Guidelines

**"Write precise and detailed documentation that removes ambiguity"**

##### Core Principles

- **Be specific over general**: Use "generates and refreshes" instead of "manages"
- **Specify who performs actions**: "SDK generates" instead of "generates"
- **Explain purpose behind design choices**: Clarify why an approach was chosen
- **Add context for technical steps**: Explain "why" behind "what"

##### The Four-Question Framework

For any JSDoc section, ask:

1. **Who performs the action?** (user, worker, function, SDK)
2. **What exactly happens?** (specific operations, not general concepts)
3. **Where does it happen?** (exact schema locations, files)
4. **Why does it matter?** (purpose, trade-offs, consequences)

##### Error Handling Documentation

Use actionable error messages with numbered fix-checklists:

```typescript
// Don't do
console.error("Failed to authenticate");

// Do
console.error(
  "[ERROR] Authentication failed. Fix by: (1) Checking network connectivity, (2) Verifying Jazz account access, (3) Confirming token format validity",
);
```

##### Vocabulary Substitutions

| Instead of       | Use                                     |
| ---------------- | --------------------------------------- |
| manage/handle    | generate/store/load/refresh/verify      |
| actual/real      | specific action description             |
| automatically    | specify when/how trigger happens        |
| system/process   | specify which component performs action |
| data/information | exact data type/location                |

### Output & Logging Standards

- No emojis in code, logs, error messages, or AI responses
- Use standardized logger: `app/regarde.bio/frontend/src/lib/utils/logger.ts`
- Logger prefixes: `[ERROR]`, `[WARN]`, `[INFO]`, `[DEBUG]`, `[SUCCESS]`
- Example: `logger.error('Failed to validate nickname')`, `logger.info('User registered successfully')`

### Jazz Architecture Rules

- **Authentication**:
  - CLI authentication: Passphrase-based auth via `generateCredentialsFromPassphrase()`
  - Worker authentication: Each service uses its specific Account schema type
- **RegardeAccount** schema (user's complete account):
  - When a user authenticates and you need their complete account context
  - When a user edits their own profile and you need to verify ownership
  - When accessing a user's private data (registration keys)
  - When the worker needs to load a user's account using their account ID
- **RegardeProfile** schema (user's public profile):
  - When anyone views a user's public profile page
  - When displaying a user's name, bio, projects, or other public information
  - When a user is editing their profile fields (already have account context)
  - When the worker serves public profile data to anyone
- **Sync Safety Rules**
  - Write-Wait-Use: After any CoMap write operation, call `coMap.$jazz.waitForSync()` before reading/returning
  - Reference Chain Sync: For nested operations, sync leaf nodes first, then their containers
  - Create-Set-Sync: `create()` → `set()` → `waitForSync(specific)` → `waitForSync(container)` → safe return
  - Race Condition Detection: Any pattern of "create → set → return" or "modify → read" must have sync in between
- **Registration token authentication (acts as 2FA)**:
  - Always call `generateRegardeToken` before API call to get a fresh and valid token to forward to API header `x-Regarde-Token`
  - User generates token via `useRegardeAuth()` (stored in `account.root["api.regarde.dev"]`)
  - User sends token + token CoMap ID in headers (`X-Regarde-Token`, `X-Regarde-Token-Id`)
  - Worker loads RegardeAuth CoMap and verifies user owns it
  - Worker validates token matches and has not expired (24-hour lifetime)
  - Worker remains stateless - no session storage, each request independently verified
- **Worker account loading**:
  - Worker gets account ID from nickname registry or public profile
  - Worker loads account: `RegardeAccount.load(accountId, { resolve: ... })`
  - No `{ loadAs: worker }` needed - verifies ownership via registration key
- **Client data access**: Use `useMyRegardeAccount()` as single source of truth for user data
- **Variable naming**: `account` for RegardeAccount, `RegardeProfile` for RegardeProfile, `worker` for RegistryWorkerAccount, `RegardeAuth` for RegardeAuth

### Permission Structure Rules

#### User Data vs Registry Data Ownership

**User Data Ownership Pattern:**

- User-owned CoValues (App, PaymentEvent, ListOfPaymentEvents) MUST be owned by the user's personal group
- Access user group via: `userAccount.root["regarde-sdk"].$jazz.owner`
- Load user accounts with `{ loadAs: worker }` when accessing from worker context
- Never fall back to worker ownership for user data

**Registry Data Ownership Pattern:**

- Registry-owned CoValues (RegistryAppMetadata, registry lists) MUST be owned by the worker
- Registry data manages metadata, not the actual user CoValues
- References vs ownership: RegistryAppMetadata contains reference to App, but doesn't own it

#### Implementation Checklist

**Creating User CoValues:**
[ ] Load user account: `co.account().load(id, { loadAs: worker, resolve: { root: { ["regarde-sdk"]: true } } })`
[ ] Get user group: `account.root["regarde-sdk"].$jazz.owner`
[ ] Create with user group: `CoValue.create({...}, { owner: userGroup })`
[ ] Verify account loaded before accessing properties
[ ] Return proper error if account/RegardeSDK not initialized

**Creating Registry CoValues:**
[ ] Direct use: `RegistryCoValue.create({...}, { owner: worker })`
[ ] Used for registry metadata, not user data
[ ] Allows registry to search and manage metadata efficiently

#### Permission Flow

1. User personal group owns user's RegardeSDK and all their data
2. Worker is added to user's group with "writer" role in initRegardeSDK
3. Worker accesses user data through group membership, not ownership
4. account.root["regarde-sdk"] is a reference, not ownership

**Error Handling:**

- 400: Required fields missing or account not initialized
- 404: User account not found
- 500: Account loading failure

**Key Pattern:**

```typescript
// User data creation pattern
const userAccount = await co.account().load(userId, {
  loadAs: worker,
  resolve: { root: { ["regarde-sdk"]: true } },
});
const userGroup = userAccount.root["regarde-sdk"].$jazz.owner;
const userCoValue = UserCoValue.create(data, userGroup);
```

**Registry data creation pattern:**

```typescript
// Registry data creation pattern
const registryCoValue = RegistryCoValue.create(data, worker);
```

For UI development and Tailwind CSS rules, refer to [INTERFACE-GUIDELINES.md](./INTERFACE-GUIDELINES.md)
