# Agent Guidelines

## Commands

- `pnpm build` - Build TypeScript
- `pnpm test` - Run tests (watch mode)
- `pnpm test:run` - Run tests once
- `pnpm test:ui` - Run tests with UI
- `pnpm dev` - Development mode with Bun watch
- `pnpm start` - Production build and start

### Running Single Tests

```bash
pnpm test src/routes/__tests__/register.test.ts
pnpm test -t "nickname registration"
```

## Code Style

- **Imports**: Use ES modules, import Node.js packages with `node:` prefix
- **Types**: Strict TypeScript, Zod schemas for validation, export types from schemas
- **Naming**: camelCase for variables/functions, PascalCase for types, kebab-case for files
- **Error Handling**: Proper HTTP status codes, consistent error schema, try-catch in route handlers
- **Formatting**: No comments unless necessary, self-documenting code preferred
- **Testing**: Vitest for unit tests, test files in `__tests__/` folders, setup in `src/test-utils/`

## Architecture

- Hono framework with OpenAPI integration
- Modular route structure in `src/routes/`
- Schema validation with Zod in `src/schemas/`
- Jazz Tools integration for sync and data persistence
- Rate limiting middleware implemented in `src/middleware/`
