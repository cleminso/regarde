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

### Imports (Prettier enforced)
```typescript
// Order: builtins, third-party, absolute imports, relative imports
import { useAccount } from "jazz-tools/react";  // Framework first
import { OnboardingAccount } from "@regarde/shared-schemas";  // Workspace next
import { useMyJazz } from "#/lib/account/useMyJazz";  // Aliased imports
import { MyComponent } from "./MyComponent";  // Relative last
```

### Naming Conventions
- **Components**: PascalCase (`UserProfile`, `NicknameInput`)
- **Functions**: camelCase (`validateNickname`, `getProfileData`)
- **Types**: PascalCase with 'T' prefix optional (`TProfile`, `UserHandle`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_NICKNAME_LENGTH`, `API_ENDPOINT`)

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

### Jazz Architecture Rules
- Use `OnboardingAccount` for authentication/permissions context
- Use `JazzAppProfile` for profile data access
- Workers: Always use `{ loadAs: worker }` for permission context
- Client: Use `useMyJazz()` hook for central data access