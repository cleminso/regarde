# Regarde Architecture

High-level architecture of the Regarde payment infrastructure platform.

## Table of Contents

- [System Overview](#system-overview)
- [Key Components](#key-components)
- [Codemap](#codemap)
- [Package Layering & Dependencies](#package-layering--dependencies)
- [Domain Quality Assessment](#domain-quality-assessment)
- [Shared Infrastructure](#shared-infrastructure)
- [Data Ownership Model](#data-ownership-model)
- [Config System](#config-system)
- [Key Architectural Invariants](#key-architectural-invariants)
- [Cross-Domain Communication](#cross-domain-communication)
- [Glossary](#glossary)

---

## System Overview

Regarde is a payment infrastructure platform built on Jazz (local-first sync). It provides SDKs, APIs, and tooling for developers to integrate payment providers (Stripe, Polar) into their applications.

### Core Principles

1. **Local-First Architecture**: Data lives in CoValues (Jazz), synced across clients
2. **Stateless APIs**: API workers validate each request independently via token auth
3. **Explicit Ownership**: Clear boundaries between user-owned and worker-owned data
4. **Type Safety**: Strict TypeScript with explicit boolean checks and MaybeLoaded patterns
5. **Sync Safety**: Write → Wait → Use pattern mandatory for all CoMap operations

---

## Key Components

| Component     | Location                      | Responsibility                                                                                      |
| ------------- | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| **SDK**       | `packages/sdk/`               | Client-side SDK (@regarde-dev/core). Initializes Jazz schemas, manages tokens, provides React hooks |
| **API**       | `packages/api.regarde.dev/`   | Stateless Hono API. Token verification, nickname registry, webhooks                                 |
| **Admin**     | `packages/admin/`             | Registry admin CLI (@regarde-dev/admin). Direct registry management                                 |
| **Dashboard** | `apps/dashboard.regarde.dev/` | Web dashboard for managing apps and viewing analytics                                               |
| **Registry**  | Jazz sync server              | Source of truth for nicknames, app metadata, reserved names                                         |

---

## Codemap

### Repository Structure

```
/Users/clem/projects/regarde/regarde.dev/
├── packages/
│   ├── sdk/                    # Core SDK (public API)
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── managers/   # Business logic (app, auth, checkout, etc.)
│   │   │   │   └── schemas/    # Jazz CoValue schemas
│   │   │   └── frameworks/
│   │   │       └── react/      # React hooks
│   │   └── package.json        # @regarde-dev/core
│   ├── api.regarde.dev/        # Registry API server
│   │   ├── src/
│   │   │   ├── domains/        # Domain-driven handlers
│   │   │   │   ├── auth/       # Token verification
│   │   │   │   ├── nickname/   # Nickname registry ops
│   │   │   │   ├── app/        # App registration
│   │   │   │   └── payments/   # Webhook processing
│   │   │   ├── routes/         # Hono route wiring
│   │   │   └── middleware/     # Rate limiting, auth
│   │   └── deploy/             # Cloudflare Workers deployment
│   └── admin/                  # Admin CLI tool
│       └── src/
│           ├── commands/       # Subcommand handlers
│           └── services/       # Nickname, audit, backup services
├── apps/
│   ├── dashboard.regarde.dev/  # Web dashboard (React + TanStack Router)
│   └── regarde.bio/            # Example app implementation
│       ├── frontend/
│       └── api.regarde.bio/
└── docs/                       # Research, plans, references
    ├── research/
    └── plans/
```

### Where to Find Things

| What              | Where                                                     |
| ----------------- | --------------------------------------------------------- |
| Jazz schemas      | `packages/sdk/src/core/schemas/`                          |
| React hooks       | `packages/sdk/src/frameworks/react/`                      |
| Manager functions | `packages/sdk/src/core/managers/{name}/`                  |
| API handlers      | `packages/api.regarde.dev/src/domains/{domain}/handlers/` |
| Admin services    | `packages/admin/src/services/`                            |
| Shared types      | `packages/sdk/src/core/types/`                            |

---

## Package Layering & Dependencies

### Dependency Graph

```
                    apps/
        ┌───────────┼───────────┐
        │           │           │
   dashboard   regarde.bio    (future apps)
        │           │
        └───────────┴───────────┘
                  │
              packages/
        ┌───────┼──────────────┐
        │       │              │
       sdk     api           admin
        │       │
        └───────┴──────────────┘
                  │
            External Dependencies
        (jazz-tools, hono, zod, etc.)
```

### Dependency Rules

1. **SDK is the foundation**: All packages depend on `@regarde-dev/core`
2. **No circular dependencies**: `api` cannot import from or `admin`
3. **Apps consume packages**: Dashboard and example apps use the SDK
4. **External deps**: Jazz ecosystem, Hono, Zod, TanStack (dashboard)

---

## Domain Quality Assessment

Current grade assessment of each domain's implementation quality:

| Domain        | Grade | Rationale                                                                     |
| ------------- | ----- | ----------------------------------------------------------------------------- |
| **SDK**       | B+    | Solid schemas, good hook patterns, needs more edge case handling              |
| **API**       | B     | Clean domain structure, stateless design, webhook adapters need consolidation |
| **Admin**     | B+    | Service architecture is clean, backup/audit systems are robust                |
| **Dashboard** | C+    | Basic functionality working, needs polish and feature completeness            |

---

## Shared Infrastructure

### Tool Stack

| Tool                  | Purpose                              |
| --------------------- | ------------------------------------ |
| **Vite 8** (Rolldown) | Build tool for all packages          |
| **Oxlint**            | Linting (10-100x faster than ESLint) |
| **Vitest**            | Test runner (Vite-native)            |
| **TypeScript**        | Strict type checking                 |
| **Zod**               | Runtime validation                   |
| **Hono**              | Web framework (API)                  |
| **Jazz**              | Local-first sync platform            |

### Shared Patterns

1. **Boolean Explicitness**: Always use `=== true` / `=== false`
2. **MaybeLoaded Pattern**: Hooks return `MaybeLoaded<T>` for loading states
3. **Sync Safety**: Write → `waitForSync()` → Read
4. **Type Predicates**: Filter callbacks use `(item): item is T => ...`

---

## Data Ownership Model

Clear ownership boundaries between user and worker data.

### User-Owned Data

These CoValues are owned by the user's personal group:

| CoValue              | Owner | Description                                             |
| -------------------- | ----- | ------------------------------------------------------- |
| **RegardeAccount**   | User  | Root account with RegardeSDK reference                  |
| **RegardeSDK**       | User  | Main SDK container (v4 structure)                       |
| **RegardeApp** (App) | User  | User's app definitions (name, payment config, webhooks) |
| **UserHandle**       | User  | Nickname registration data                              |
| **CheckoutSession**  | User  | Active checkout sessions                                |
| **RegardeTokenAuth** | User  | 24-hour registration token (2FA mechanism)              |

### Worker-Owned Data (User READ Access)

These CoValues are owned by the worker but user has READ access:

| CoValue               | Owner  | User Access | Description                                 |
| --------------------- | ------ | ----------- | ------------------------------------------- |
| **PaymentEvent**      | Worker | READ        | Individual payment transaction from webhook |
| **SubscriptionEvent** | Worker | READ        | Subscription state change event             |
| **Subscription**      | Worker | READ        | Current mutable subscription state          |
| **LicenseEvent**      | Worker | READ        | License activation/deactivation event       |
| **Invoice**           | Worker | READ        | Invoice record from provider                |
| **Refund**            | Worker | READ        | Refund record for a payment                 |

**Pattern**: Worker creates these CoMaps and references them to the user's Account. User can read but not modify. This ensures data integrity for financial records.

### Registry-Owned Data (Worker Only)

These are owned by the worker/registry and managed directly:

| CoValue                       | Owner  | Description                              |
| ----------------------------- | ------ | ---------------------------------------- |
| **NicknameRegistry**          | Worker | Global nickname → JazzAccountID mapping  |
| **ReverseNicknameRegistry**   | Worker | JazzAccountID → nickname mapping         |
| **ReservedNicknamesRegistry** | Worker | Reserved nickname categories             |
| **RegistryAppMetadata**       | Worker | App verification status and access flags |
| **AuditLog**                  | Worker | Registry operation audit trail           |

---

## Config System

### Environment Variables by Package

#### SDK (`packages/sdk/`)

| Variable               | Required | Description             |
| ---------------------- | -------- | ----------------------- |
| `JAZZ_SYNC_SERVER_URL` | Yes      | Jazz sync server URL    |
| `JAZZ_API_KEY`         | No       | API key for sync server |

#### API (`packages/api.regarde.dev/`)

| Variable                | Required | Description                  |
| ----------------------- | -------- | ---------------------------- |
| `WORKER_ACCOUNT_ID`     | Yes      | Registry worker account ID   |
| `WORKER_ACCOUNT_SECRET` | Yes      | Registry worker secret       |
| `JAZZ_SYNC_SERVER_URL`  | Yes      | Jazz sync server URL         |
| `JAZZ_API_KEY`          | No       | API key                      |
| `APP_PUBLIC_HOSTNAME`   | No       | Public hostname for webhooks |
| `PORT`                  | No       | HTTP port (default: 3000)    |

#### Admin (`packages/admin/`)

| Variable               | Required | Description                         |
| ---------------------- | -------- | ----------------------------------- |
| `JAZZ_WORKER_ACCOUNT`  | Yes      | Registry worker account ID          |
| `JAZZ_WORKER_SECRET`   | Yes      | Registry worker secret              |
| `JAZZ_SYNC_SERVER_URL` | Yes      | Jazz sync server URL                |
| `JAZZ_API_KEY`         | No       | API key                             |
| `DEBUG`                | No       | Enables stack traces in JSON output |

---

## Key Architectural Invariants

Six invariants that must be maintained across all code:

### 1. Sync Safety (Write-Wait-Use)

```typescript
// After any CoMap write, wait for sync before reading
const newCoMap = SomeCoMap.create({ ... }, { owner: group });
await newCoMap.$jazz.waitForSync(); // REQUIRED
```

### 2. Boolean Explicitness

```typescript
// ALWAYS use explicit boolean comparisons
const isLoaded = account !== null && account.$isLoaded === true;
if (isLoaded === false) {
  throw new Error("Not loaded");
}
```

### 3. MaybeLoaded Pattern for Hooks

```typescript
// Single items: MaybeLoaded<T>
export interface TUseDataResult {
  data: MaybeLoaded<TMyData>;
  isLoading: boolean;
}

// Collections: filtered arrays (loaded items only)
const loadedItems = items.filter(
  (item): item is TItem =>
    item !== null && item !== undefined && item.$isLoaded === true,
);
```

### 4. Type Predicate Pattern

```typescript
// Filter callbacks use type predicates with implicit params
const valid = items.filter(
  (item): item is TItem =>
    item !== null && item !== undefined && item.$isLoaded === true,
);
```

### 5. Stateless API Design

```typescript
// Every request independently verified via token headers
// No session state - token validated from RegardeTokenAuth CoMap
```

### 6. Data Ownership Boundaries

```typescript
// User-owned: App, CheckoutSession, RegardeTokenAuth
// Worker-owned (user READ): PaymentEvent, Subscription, Invoice, Refund
// Worker-owned only: NicknameRegistry, AuditLog
```

---

## Cross-Domain Communication

### SDK → API

```
SDK generates RegardeTokenAuth token (24h lifetime)
         ↓
SDK sends HTTP request with headers:
  X-Regarde-Token, X-Regarde-Token-Id, X-Jazz-Account-Id
         ↓
API loads RegardeTokenAuth CoMap, verifies ownership
         ↓
API performs operation (nickname check, app registration)
```

### API → User (Webhooks)

```
Payment provider sends webhook → API
         ↓
API verifies signature (provider-specific)
         ↓
API loads user's RegardeAccount
         ↓
API creates PaymentEvent CoMap (worker-owned, user READ access)
         ↓
Reference added to user's payment lists
         ↓
User sees event via SDK hooks (synced via Jazz)
```

### Admin → Registry

```
Admin CLI loads worker credentials from env
         ↓
Connects directly to Jazz as RegistryWorkerAccount
         ↓
Full read/write access to all registries
         ↓
All operations logged to AuditLog
```

### Dashboard → SDK

```
Dashboard web app imports @regarde-dev/core
         ↓
Uses React hooks (useRegardeAccount, usePaymentEvents)
         ↓
Data synced via Jazz to local state
         ↓
UI renders from local-first data
```

---

## Glossary

| Term                 | Definition                                                       |
| -------------------- | ---------------------------------------------------------------- |
| **CoMap**            | A Jazz collaborative map - key/value data structure with sync    |
| **CoValue**          | Any Jazz collaborative value (CoMap, CoList, etc.)               |
| **CoRecord**         | A Jazz CoMap used as a record/dictionary                         |
| **Jazz**             | Local-first sync platform (jazz.tools)                           |
| **MaybeLoaded**      | Type representing `T \| undefined` - value may not be loaded yet |
| **Manager**          | Business logic module in SDK (app, auth, checkout managers)      |
| **RegardeAccount**   | User's Jazz account with RegardeSDK extension                    |
| **RegardeApp**       | User's app definition (name, payment provider, webhooks)         |
| **RegardeTokenAuth** | 24-hour registration token for API authentication                |
| **Worker**           | RegistryWorkerAccount - API/admin CLI's Jazz identity            |
| **Sync Safety**      | Pattern: Write → waitForSync → Read                              |
| **PaymentEvent**     | Record of payment from webhook (worker-owned)                    |
| **Subscription**     | Current subscription state (worker-owned)                        |
| **UserHandle**       | Nickname registration data (user-owned)                          |
| **Registry**         | Global Jazz data owned by worker (nicknames, metadata)           |
| **CoList**           | Jazz collaborative list - ordered collection with sync           |
| **Group**            | Jazz permission group controlling read/write access              |
| **Local-First**      | Architecture where data lives on client, synced to server        |
| **Stateless**        | API design where each request contains all auth info             |
| **2FA**              | Two-factor auth via RegardeTokenAuth tokens                      |

---

## Further Reading

- `AGENTS.md` - Repository-wide guidelines
- `packages/sdk/AGENTS.md` - SDK-specific patterns
- `packages/api.regarde.dev/AGENTS.md` - API architecture
- `packages/admin/AGENTS.md` - Admin CLI patterns
