<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 1.1.0
Constitution Type: MINOR (New principle added, existing principles enhanced)

Modified Principles:
- NEW: VI. Output & Naming Standards
- ENHANCED: II. Jazz Architecture Discipline (added namespace structure, user scenarios, variable naming patterns)
- ENHANCED: IV. Monorepo Package Boundaries (added pnpm workspace catalog guidance)

Added Sections:
- Output & Naming Standards principle with logging, file naming, and code readability requirements
- Jazz namespace structure explanation (root vs profile)
- User scenario-based guidance for RegardeAccount vs RegardeProfile
- Variable naming patterns for Jazz objects
- Code readability principles favoring self-documenting code over comments
- pnpm workspace catalog dependency management

Templates Requiring Updates:
AGENTS.md - Runtime guidance synchronized with new naming conventions and logging standards
packages/profile-app/src/lib/utils/logger.ts - Added [SUCCESS] log level

Follow-up TODOs:
- None - all requirements specified

Rationale for Version 1.1.0:
- Added new principle for output formatting and file naming conventions
- Clarified Jazz architecture with namespace structure and real-world scenarios
- Standardized logger usage across codebase with complete log level set
- Established consistent file and folder naming patterns
- Added code readability preference for self-documenting code
- Integrated pnpm workspace catalog for dependency management
- Prohibits emoji usage in all code contexts
-->

# Regarde Constitution

## Core Principles

### I. Test Business Logic, Trust the Framework

**Rule**: Test business logic, not framework behavior. Focus testing efforts on validation rules, data transformation, error recovery, and integration between packages. Do not test Jazz sync, React rendering, Zod parsing, or other framework behaviors.

**Rationale**: Framework testing creates maintenance burden without value. Our business logic is what differentiates this application and requires verification.

**Requirements**:

- Tests must focus on: validation rules, data transformation, error recovery, package integration
- Tests must not cover: Jazz framework behavior, React hook lifecycle, Zod schema parsing, Jazz CoMap property assignments
- Test naming must follow: `should [business outcome] when [business condition]`
- Test files must be located in `__tests__/` folders next to implementation

### II. Jazz Architecture Discipline

**Rule**: Use `RegardeAccount` schema to represent a user's complete account structure including their identity and private data. Use `RegardeProfile` schema to represent a user's public profile information. Understand the namespace structure: `account.root["regarde.bio"]` contains the `RegardeProfile` data, while `account.profile["regarde.bio"]` contains the profile ID reference. Workers load `RegardeAccount` using the account's CoMap ID (found in public profile or nickname registry). Authentication uses Jazz-tools via Clerk APIs: Clerk stores Jazz account credentials, Jazz-tools retrieves these credentials via Clerk APIs to authenticate users. Custom registration key system provides stateless worker authorization by verifying ownership of a time-limited key stored in `account.root["auth.regarde.bio"]`. Client code must use `useMyJazz()` as the single source of truth for authenticated user data.

**Rationale**: Clear separation between account structure and profile data prevents permission bugs and reduces unnecessary data loading. The namespace structure (`root` vs `profile`) determines whether data is pre-loaded or requires additional loading. Jazz-tools handles authentication by retrieving credentials stored in Clerk, providing seamless integration between Clerk's user management and Jazz's distributed state system. Custom registration key system provides secure, stateless worker authorization using CoMap ownership verification to prove user identity. Registration keys act as time-limited 2FA tokens that users generate and present to authorize their actions with the worker.

**Requirements**:

- `RegardeAccount` usage scenarios (user perspective):
  - When a user authenticates (Jazz-tools retrieves credentials from Clerk) and you need their complete account context
  - When a user is editing their own profile and you need to verify ownership
  - When a user performs actions requiring permission verification
  - When accessing a user's private data like registration keys
  - When the worker needs to load a user's account using their account ID (from nickname registry or public profile)
- `RegardeProfile` usage scenarios (user perspective):
  - When anyone views a user's public profile page
  - When displaying a user's name, bio, projects, or other public information
  - When a user is editing their profile fields (useMyJazz already provides account context)
  - When the worker serves public profile data to anyone
  - When you only need profile data and not the full account structure
- Namespace structure understanding:
  - `account.root["regarde.bio"]` = pre-loaded `RegardeProfile` object (always use this for data access)
  - `account.profile["regarde.bio"]` = string ID reference to `RegardeProfile` CoMap (only used internally by Jazz, not for application code)
  - `account.root["auth.regarde.bio"]` = private `RegardeAuth` CoMap (24-hour expiry, user-owned)
- Registration key authentication flow (acts as 2FA):
  - User generates registration key via `useRegardeAuth()` hook (stored in `account.root["auth.regarde.bio"]`)
  - User sends key and key CoMap ID in request headers (`X-Registration-Key`, `X-Registration-Key-Id`)
  - Worker loads `RegardeAuth` CoMap and verifies user owns it (checks CoMap owner matches account ID)
  - Worker validates key matches and has not expired (24-hour lifetime)
  - Worker remains stateless - no session storage, each request independently verified
  - This proves user identity without external auth provider
- Worker account loading pattern:
  - Worker obtains account ID from nickname registry or public profile
  - Worker loads `RegardeAccount` using account CoMap ID: `RegardeAccount.load(accountId, { resolve: ... })`
  - No `{ loadAs: worker }` needed - Regarde uses custom registration key authentication instead of Jazz's built-in `loadAs` permission system
  - Worker verifies user ownership via registration key validation (see Registration key authentication flow)
- Client data access must use `useMyJazz()` hook as single source of truth:
  - Returns pre-resolved `RegardeProfile` from `account.root["regarde.bio"]`
  - Provides `account` for the logged-in user's account context
  - Avoids redundant loads by resolving all data upfront
- Variable naming must follow established patterns:
  - `account` for `RegardeAccount` instances
  - `regardeProfile` or `profile` for `RegardeProfile` instances (prefer `regardeProfile` for clarity)
  - `worker` for `RegistryWorkerAccount` instances
  - `regardeAuth` for `RegardeAuth` instances
- Schema definitions must live in `packages/shared-schemas/` only

### III. Type Safety & Validation

**Rule**: Use strict TypeScript with explicit return types for public functions. Never use `any` type - use `unknown` or proper typing. Handle errors at business logic boundaries with specific error types. Use Zod for runtime validation and never skip validation.

**Rationale**: Type safety catches bugs at compile time. Runtime validation with Zod ensures data integrity at system boundaries. Explicit error types enable proper error handling and debugging.

**Requirements**:

- TypeScript strict mode must be enabled
- Public functions must have explicit return types
- `any` type is FORBIDDEN - use `unknown` or proper types
- All external data must be validated with Zod schemas
- Error handling must use specific error types at business logic boundaries (API route handlers, public package exports, data transformation functions)
- Specific error types means: custom Error classes or discriminated union types
- Validation errors must be caught and handled appropriately

### IV. Monorepo Package Boundaries

**Rule**: Maintain clear package boundaries in the pnpm workspace. Shared schemas live in `@regarde-dev/shared-schemas`. Client code in `@regarde-dev/profile-app`. api.regarde.bio server code in `@regarde-dev/api.regarde.bio`, api.regarde.dev server code in `@regarde-dev/api.regarde.dev`. Admin tooling in `@regarde-dev/admin`. Packages MUST declare dependencies explicitly. Use pnpm workspace catalog for shared dependency versions.

**Rationale**: Clear boundaries prevent circular dependencies and enable independent testing and deployment. Shared schemas as single source of truth prevents schema drift between client and worker. Centralized dependency management via workspace catalog ensures version consistency across packages.

**Requirements**:

- Schema definitions must only exist in `packages/shared-schemas/`
- Client code must not import from worker packages
- Worker code must not import from client packages
- All packages must use workspace protocol for internal dependencies: `workspace:*`
- Shared dependencies must be defined in `pnpm-workspace.yaml` catalog section
- Package-specific dependencies must be explicitly declared in `package.json`
- Packages MUST reference catalog versions using `catalog:` protocol for all dependencies listed in pnpm-workspace.yaml catalog
- Build order must respect dependency graph (schemas → app/worker) - automatically enforced by pnpm

### V. Code Style & Consistency

**Rule**: Follow Prettier-enforced import ordering: builtins, third-party, workspace imports, aliased imports, relative imports. Use PascalCase for component names and types, camelCase for functions and file names, UPPER_SNAKE_CASE for constants. Use Biome for linting and formatting checks.

**Rationale**: Consistent code style reduces cognitive load and merge conflicts. Automated formatting eliminates style debates. Clear naming conventions improve code readability. Prettier handles import ordering, while Biome enforces code quality and formatting standards.

**Requirements**:

- Import order must be: builtins → third-party → workspace → aliased → relative (enforced by Prettier plugin)
- Component names must use PascalCase (`UserProfile`, `NicknameInput`)
- Component file names must use camelCase (`userProfile.tsx`, `nicknameInput.tsx`)
- Functions must use camelCase
- Types must use PascalCase
- Constants must use UPPER_SNAKE_CASE
- Code must pass `biome check` before commit
- Auto-fix must be used: `pnpm --filter <package> format-and-lint:fix`

### VI. Output & Naming Standards

**Rule**: Never use emojis in code, logs, error messages. Use standardized logger with bracketed prefixes for all output. File names must use camelCase. Folder names must use kebab-case at all levels except `__tests__` folders. Prefer maximally readable code over writing comments.

**Rationale**: Emoji-free output ensures terminal compatibility, searchability, and professional appearance. Standardized logging enables consistent filtering and monitoring. Consistent file naming conventions improve code navigation and reduce cognitive overhead when locating files. Self-documenting code through clear naming and structure reduces maintenance burden and keeps code in sync with behavior.

**Requirements**:

- No emojis in: code comments, console output, error messages, log statements, AI-generated responses
- All logging must use logger utility with standard prefixes: `[ERROR]`, `[WARN]`, `[INFO]`, `[DEBUG]`, `[SUCCESS]`
- Logger utility location: `packages/profile-app/src/lib/utils/logger.ts`
- File names must use camelCase: `userProfile.tsx`, `validateNickname.ts`, `apiClient.ts`
- Component files must use camelCase: `userProfile.tsx` (component name is `UserProfile` in PascalCase, file name is camelCase)
- Folder names must use kebab-case: `user-profile/`, `api-client/`, `shared-utils/`
- Exception: Test folders must use `__tests__/` naming convention
- File and folder naming applies to all file types and all directory levels
- Code readability principles:
  - Use descriptive variable and function names that explain intent
  - Extract complex logic into well-named functions rather than adding comments
  - Structure code to be self-explanatory through clear flow and organization
  - Only add comments when explaining non-obvious business rules or external constraints
  - Prefer refactoring unclear code over documenting unclear code

## Development Standards

### Technology Stack

- **Runtime**: Node.js with pnpm package manager
- **Language**: TypeScript 5.9+ with strict mode
- **Framework**: Jazz.tools 0.18.15+, React 19.1.1
- **Validation**: Zod for all runtime validation
- **Testing**: Vitest with happy-dom/jsdom
- **Formatting**: Biome for linting and formatting
- **Build**: Vite for bundling, tsc for library builds

### Security Requirements

- All external data must be validated with Zod
- User authentication: Jazz-tools retrieves credentials stored in Clerk via Clerk APIs
- Worker authorization uses custom registration key system (not Jazz's `loadAs` pattern)
- Sensitive operations (nickname registration, profile editing) must verify user permissions via registration key validation
- Environment variables must not be committed to repository

## Quality Gates

### Pre-Commit Gates

- [ ] All tests pass: `pnpm test --run`
- [ ] Code style passes: `pnpm --filter <package> format-and-lint`
- [ ] TypeScript compiles without errors
- [ ] No `any` types introduced
- [ ] All Zod validations in place for external data
- [ ] No emojis in code, logs, or comments
- [ ] All logging uses standardized logger utility
- [ ] New files use camelCase naming
- [ ] New folders use kebab-case naming (except `__tests__/`)

### Pre-Merge Gates

- [ ] All package tests pass independently
- [ ] Build succeeds for all packages: `pnpm --filter <package> build`
- [ ] No new framework behavior tests added
- [ ] Schema changes reflected in all consuming packages
- [ ] Documentation updated for public API changes

### Architecture Review Gates

- [ ] RegardeAccount used for complete account context (not for pure profile data display)
- [ ] RegardeProfile used for all profile data display
- [ ] No circular dependencies between packages
- [ ] Shared schemas remain in `@regarde-dev/shared-schemas`
- [ ] Worker code uses custom registration key authentication (not `{ loadAs: worker }`)

## Governance

### Amendment Process

1. Proposed changes MUST be documented with rationale
2. Impact analysis MUST identify affected templates and code
3. Version bump MUST follow semantic versioning:
   - MAJOR: Backward incompatible governance changes or principle removals
   - MINOR: New principles added or materially expanded guidance
   - PATCH: Clarifications, wording fixes, non-semantic refinements
4. All dependent templates MUST be updated before ratification
5. Sync Impact Report MUST be generated and prepended to constitution

### Compliance Verification

- All feature specifications MUST pass constitution check gates
- Implementation plans MUST document any principle violations with justification
- Code reviews MUST verify adherence to core principles
- Complexity deviations MUST be documented in Complexity Tracking section
- Unjustified violations MUST be rejected with "Simplify approach first" error

### Living Document

- This constitution supersedes all other development practices
- Runtime development guidance lives in `AGENTS.md`
- Constitution version MUST be referenced in all plan templates

**Version**: 1.1.0 | **Ratified**: 2025-10-02 | **Last Amended**: 2025-10-03
