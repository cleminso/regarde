# AGENTS.md - Repository Guidelines

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
pnpm --filter profile-app format-and-lint       # Check code style
pnpm --filter profile-app format-and-lint:fix   # Auto-fix code style
```

## Code Style Guidelines

### Code Readability

- Prefer maximally readable code over writing comments
- Use descriptive variable and function names that explain intent
- Extract complex logic into well-named functions
- Only add comments for non-obvious business rules or external constraints
- Refactor unclear code rather than documenting it

### Imports (Prettier enforced)

```typescript
// Order: builtins, third-party, absolute imports, relative imports
import { useAccount } from "jazz-tools/react"; // Framework first
import { RegardeAccount } from "@regarde-dev/shared-schemas"; // Workspace next
import { useMyJazz } from "#/lib/account/useMyJazz"; // Aliased imports
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

### Output & Logging Standards

- No emojis in code, logs, error messages, or AI responses
- Use standardized logger: `packages/profile-app/src/lib/utils/logger.ts`
- Logger prefixes: `[ERROR]`, `[WARN]`, `[INFO]`, `[DEBUG]`, `[SUCCESS]`
- Example: `logger.error('Failed to validate nickname')`, `logger.info('User registered successfully')`

### Jazz Architecture Rules

- **Authentication**: Jazz-tools retrieves credentials stored in Clerk via Clerk APIs
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
- **Namespace structure**:
  - `account.root["regarde.bio"]` = pre-loaded RegardeProfile (use this)
  - `account.profile["regarde.bio"]` = string ID reference to RegardeProfile CoMap
  - `account.root["api.regarde.dev"]` = private RegardeAuth CoMap (24-hour expiry)
- **Registration token authentication (acts as 2FA)**:
  - User generates token via `useRegardeAuth()` (stored in `account.root["api.regarde.dev"]`)
  - User sends token + token CoMap ID in headers (`X-Regarde-Token`, `X-Regarde-Token-Id`)
  - Worker loads RegardeAuth CoMap and verifies user owns it
  - Worker validates token matches and has not expired (24-hour lifetime)
  - Worker remains stateless - no session storage, each request independently verified
- **Worker account loading**:
  - Worker gets account ID from nickname registry or public profile
  - Worker loads account: `RegardeAccount.load(accountId, { resolve: ... })`
  - No `{ loadAs: worker }` needed - verifies ownership via registration key
- **Client data access**: Use `useMyJazz()` as single source of truth for user data
- **Variable naming**: `account` for RegardeAccount, `RegardeProfile` for RegardeProfile, `worker` for RegistryWorkerAccount, `RegardeAuth` for RegardeAuth
