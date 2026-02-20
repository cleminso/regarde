# AGENTS.md - API Package Guidelines

## Overview

**@regarde-dev/api.regarde.dev** is the registry API server for Regarde.dev SDK. Stateless Hono-based API with Jazz worker runtime, handling authentication verification, nickname registration, app registration, and payment webhook processing.

## Core Responsibility

- Verify user registration tokens (2FA validation via RegardeTokenAuth CoMaps)
- Manage nickname registry operations (availability check, registration, lookup)
- Register user apps with system metadata (app verification, payment config)
- Process payment provider webhooks (LemonSqueezy, Stripe, Polar) and create PaymentEvent, SubscriptionEvent, LicenseEvent CoMaps
- Serve OpenAPI spec at `/doc` and Swagger UI at `/ui`

## Explicitly NOT Responsible For

- User data ownership (user owns App, PaymentEvent CoMaps)
- SDK initialization (handled by client SDK)
- Token generation (handled by client SDK)
- Payment provider integration beyond webhook processing

## Commands

```bash
pnpm dev              # Vite watch mode (NOT Bun)
pnpm build            # Build to dist/index.js (target node22)
pnpm start            # Production run
pnpm start:test       # Run with .env.test
pnpm test             # Vitest tests
pnpm test:run         # Run tests once
```

### Single Tests

```bash
pnpm test src/domains/nickname/__tests__/checkAvailability.test.ts
vitest -t "nickname registration"
```

## Architecture

### Domain-Driven Structure

```
src/
├── domains/{domain}/
│   ├── handlers/       # Business logic (curried handler factories)
│   ├── schemas/        # Zod validation schemas
│   └── __tests__/      # Unit tests
├── routes/             # HTTP route wiring (thin layer)
├── middleware/         # Hono middleware (rate limiting, auth)
└── test-utils/         # Test helpers and setup
```

**Domains**:

- `auth` - Token verification (`verify`, `verifyToken`)
- `nickname` - Registration operations (`checkAvailability`, `register`, `lookup`)
- `app` - App registration (`register`)
- `payments` - Webhook processing (`unified`) with provider adapters

### Worker Init Flow

1. `startWorker()` - Load RegistryWorkerAccount via Jazz
2. `ensureLoaded()` - Load registries (nickname, reverse, reserved, apps)
3. Hono app init with OpenAPI
4. Bind handlers to routes (safe error wrappers)
5. Start HTTP server via @hono/node-server

### Registry Data Ownership

**Worker-Owned** (loaded once at startup):

- `nicknameRegistry` (TNicknameRegistry) - CoRecord: nickname → JazzAccountID
- `reverseNicknameRegistry` - CoRecord: JazzAccountID → nickname
- `reservedNicknames` (TReservedNicknamesRegistry) - CoRecord: nickname → ReservationEntry
- `appRegistry` (TAppRegistry) - Contains apps (CoRecord) and appsByUser (CoRecord)

**User-Owned** (accessed via worker):

- `App` CoMap - Created by user, loaded with `{ loadAs: worker }`
- `PaymentEvent` CoMap - Created by worker, owned by user admin group

### Authentication Flow

```typescript
// Headers: X-API-Key, X-Regarde-Token, X-Regarde-Token-Id, X-Jazz-Account-Id
1. Load RegardeTokenAuth CoMap via RegardeTokenAuth.load(regardeAuthId)
2. Load user account via account.load(jazzAccountId, { loadAs: worker })
3. Verify user owns token: userAccount.canAdmin(regardeAuth)
4. Check token matches and not expired (24 hours)
5. Return isValid boolean
```

### Handler Pattern (Curried Factories)

```typescript
export const checkAvailabilityHandler =
  (
    nicknameRegistry: TNicknameRegistry,
    reservedNicknames: TReservedNicknamesRegistry,
  ) =>
  async (c: any) => {
    try {
      const { nickname } = c.req.valid("json");
      const isAvailable =
        !nicknameRegistry[nickname] && !reservedNicknames[nickname];
      return c.json({ nickname, available: isAvailable }, 200);
    } catch (error: unknown) {
      logger.error({
        message: "Failed",
        data: { errorMessage: error?.message },
      });
      return c.json({ error: error?.message || "Unknown error" }, 500);
    }
  };
```

### Loading Checks

```typescript
// Explicit null/undefined checks before accessing
const isRegistryLoaded =
  registry !== null && registry !== undefined && registry.$isLoaded === true;
if (isRegistryLoaded === false) {
  throw new Error("Registry not loaded");
}

// Deep loading nested structures
await appRegistry.$jazz.ensureLoaded({
  resolve: { apps: true, appsByUser: true },
});
```

## Code Style

### Imports

```typescript
import "dotenv/config";
import { serve } from "@hono/node-server";
import { RegistryWorkerAccount } from "@regarde-dev/core";
import { createMockRequest } from "#/test-utils/index.js";
import { helper } from "./helper.js"; // Always .js extension
```

### Naming

**Types**: PascalCase with 'T' prefix (`TNicknameRegistry`)
**Schemas**: PascalCase (`RegisterRequestSchema`)
**Handlers/Routes**: camelCase with suffix (`checkAvailabilityHandler`)
**Files/Dirs**: camelCase `.ts`, kebab-case folders

### Zod Schemas

```typescript
export const RequestSchema = z.object({ nickname: z.string().min(3).max(20) });
export type TRequest = z.input<typeof RequestSchema>;
```

### Testing

```typescript
describe("Nickname Logic", () => {
  it("should validate nickname format", () => {
    expect(validateNickname("user123").isValid).toBe(true);
  });
});
```

**DO test**: Validation rules, data transformations, business logic
**DON'T test**: Hono framework, Jazz sync, HTTP formatting

## Environment Variables

Required: `WORKER_ACCOUNT_ID`, `WORKER_ACCOUNT_SECRET`, `JAZZ_SYNC_SERVER_URL`
Optional: `JAZZ_API_KEY`, `APP_PUBLIC_HOSTNAME`, `PORT`

## Build Config

Target: `node22` (external Node.js builtins), ES modules, source maps enabled
External: Hono, Jazz, Zod, dotenv, @regarde-dev/core, all Node.js builtins
Dev: Vite watch mode (NOT Bun/Tsx)

## HTTP Endpoints

`GET /health`, `GET /ui`, `GET /doc`
`POST /verifyToken`, `POST /checkAvailability`, `POST /register`, `POST /lookup`, `POST /registerApp`, `POST /webhooks/{provider}/{appId}` (provider: lemonsqueezy, stripe, polar)
Middleware: Rate limiting (100 req/min), CORS, logger

## Key Architectural Decisions

### Stateless Design

- Every request independently verified via token validation
- No session state - token stored in CoMap, validated on each request
- Worker loads registries once at startup, then serves read-only

### Data Ownership Model

- Worker owns registries (nickname, apps) - loaded once, cached
- User owns App/PaymentEvent CoMaps - accessed via `{ loadAs: worker }`
- Worker creates PaymentEvent CoMaps but assigns ownership to user's group

### Handler Currying Pattern

- Handlers are curried functions that receive dependencies (registries) at init time
- Allows clean dependency injection at route binding time
- Eliminates global state and improves testability

### Webhook Processing

- Webhooks create PaymentEvent CoMaps owned by user's admin group
- PaymentEvent indexed by provider UUID for deduplication
- Worker has admin access to append to user's payment maps
