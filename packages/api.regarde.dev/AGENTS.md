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
pnpm test src/domains/nickname/__tests__/register.test.ts
pnpm test -t "nickname registration"
```

## Code Style

- **Imports**: Use ES modules, import Node.js packages with `node:` prefix, use `#/` alias for internal imports
- **Types**: Strict TypeScript, Zod schemas for validation, export types from schemas
- **Naming**: camelCase for variables/functions, PascalCase for types, kebab-case for files
- **Error Handling**: Proper HTTP status codes, consistent error schema, try-catch in route handlers
- **Formatting**: No comments unless necessary, self-documenting code preferred
- **Testing**: Vitest for unit tests, test files in `src/domains/{domain}/__tests__/` folders, setup in `src/test-utils/`

## Architecture

- **Domain-Driven Design**: Business logic organized in `src/domains/{domain}/` (nickname, auth, etc.)
- **Thin Routing Layer**: Routes in `src/routes/` only wire handlers to HTTP endpoints
- **Domain Structure**: Each domain has `handlers/`, `schemas/`, and `__tests__/` subdirectories
- **Hono Framework**: OpenAPIHono with Swagger UI at `/ui` and OpenAPI spec at `/doc`
- **Schema Validation**: Zod schemas in domain-specific `schemas/` folders
- **Jazz Tools Integration**: For sync and data persistence
- **Rate Limiting**: Middleware implemented in `src/middleware/`
