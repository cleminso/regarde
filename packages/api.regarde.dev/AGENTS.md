# API Server Package

## Overview

**@regarde-dev/api.regarde.dev** is the registry API server for Regarde.dev SDK. Stateless Hono-based API with Jazz worker runtime, handling authentication verification, nickname registration, app registration, and payment webhook processing.

## Quick Commands

```bash
pnpm dev              # Vite watch mode (NOT Bun)
pnpm build            # Build to dist/index.js (target node22)
pnpm start            # Production run
pnpm test             # Vitest tests
pnpm test:run         # Run tests once
```

## Domain Structure

Domains in `src/domains/{domain}/`: auth, nickname, app, payments

## Full Specification

See [../../docs/specs/api-server.md](../../docs/specs/api-server.md) for complete API documentation including:
- Handler patterns (curried factories)
- Authentication flow
- Webhook processing
- HTTP endpoints reference
