# AGENTS.md - SDK Package Guidelines

## Overview

**@regarde-dev/core** is the client-side SDK for Regarde. Initializes Jazz-based CoMaps in user accounts, manages registration tokens (2FA), provides React/Preact hooks, and handles app/payment state.

## Core Responsibility

- Initialize Regarde SDK data structures (RegardeSDK CoMap, RegardeTokenAuth token, UserHandle, App lists, PaymentEvent maps)
- Generate/refresh registration tokens (24-hour lifetime, 16-char secure strings)
- Provide framework hooks (React/Preact) for SDK integration
- Expose schemas for user/registry CoMaps (App, PaymentEvent, RegistryAppMetadata, nickname registries)

## Commands

```bash
pnpm dev              # Watch mode with .env.local
pnpm build            # Production build
```

## Architecture

### Schema Hierarchy

**User-Owned Data**:

- `RegardeAccount` - Root account containing RegardeSDK
- `RegardeSDK` - Main SDK container (v3 structure)
  - `myUserHandle` - UserHandle CoMap (nickname registration data)
  - `auth` - RegardeTokenAuth CoMap (token + expiresAt)
  - `myApps` - List of App CoMaps
  - `myPayments` - PaymentEvent maps indexed by provider UUID and App ID
- `App` - User-app definition (name, payment provider config, webhook URL)
- `PaymentEvent` - Individual payment transaction (created by worker)

**Registry-Owned Data** (read-only from client):

- `RegistryAppMetadata` - App verification status and access flags
- `NicknameRegistryCoRecord` - Global nickname → JazzAccountID mapping
- `ReservedNicknamesRegistry` - Reserved nickname categories
- `RegistryWorkerAccount` - Worker account root

### Group Permissions

**User Group**: My Apps, My Payments (user + worker writers), UserHandle, Auth
**AdminOtherReaders Group**: Payments (worker admin, user reader), PaymentEvent CoMaps
Hardcoded registry group: `co_zoppoxWWJaHYKPgSgUkuCCXQX21`

### Sync Safety (Critical)

```typescript
// Write-Wait-Use pattern - ALWAYS wait for sync before reading
const newCoMap = SomeCoMap.create({ ... }, { owner: someGroup });
await newCoMap.$jazz.waitForSync(); // REQUIRED before any read

// Create-Set-Sync pattern
root.$jazz.set("regarde-sdk", newSDK);
await newSDK.$jazz.waitForSync();
await account.$jazz.waitForSync();
```

```typescript
// Loading/Validation Checks
const isValid = account !== null && account.$isLoaded === true;
if (isValid === false) throw new Error("Account must be loaded");

await account.$jazz.ensureLoaded({
  resolve: { root: { "regarde-sdk": true } },
});
```

### Boolean Pattern (Explicit Checks)

```typescript
const isAvailable = !existingNickname && !reservation;
const isTokenPresent = token !== null && token.length > 0;
if (isRequired === true) { ... }
```

## Code Style

### Imports

```typescript
// Order: external, workspace, aliased (#/), relative
import { co, z, type ID } from "jazz-tools";
import { RegardeAccount } from "@regarde-dev/core";
import { generateRegardeToken } from "#managers/auth/generateToken";
import { myHelper } from "./myHelper";
```

### Naming

**Types**: PascalCase with 'T' prefix (`TRegardeAccount`)
**Schemas/Functions**: PascalCase/camelCase (`RegardeAccount`, `initRegardeSDK`)
**Constants**: UPPER_SNAKE_CASE (`TOKEN_LIFETIME_SECONDS`)
**Files/Dirs**: camelCase files, kebab-case folders

### Logger

```typescript
import { useLogging } from "#core/logger";
const logger = useLogging({ module: import.meta.filename });
logger.info({ message: "SDK initialized", data: { accountID } });
```

### Testing

```typescript
// should [outcome] when [condition]
describe("generateRegardeToken", () => {
  it("should generate a key with correct length", () => {
    const key = generateRegardeToken();
    expect(key).toHaveLength(16);
  });
});
```

**DO test**: Token logic, validation rules, data transformations
**DON'T test**: Jazz sync, framework behavior

## Module Aliases

```typescript
"#schemas"      → src/core/schemas
"#managers"     → src/core/managers
"#init"         → src/core/init
"#core"         → src/core
"#frameworks"   → src/frameworks
```

## Package Exports

- Main export: User SDK functions, React hooks, schemas (ES module)
- `/react`: React-specific hooks
- `/preact`: Preact-specific hooks

Build outputs `dist/index.js`, `dist/react.js`, `dist/preact.js` with bundled types.

## Key Architectural Decisions

### Token Management

- Tokens are generated client-side and stored in RegardeTokenAuth CoMap
- 24-hour lifetime enforced by expiresAt timestamp
- Worker verifies token validity via RegardeTokenAuth.load() + ownership checks

### Data Ownership Model

- User data (App, PaymentEvent) owned by user's personal group
- Registry data (RegistryAppMetadata, registries) owned by worker
- Worker granted write access to user data for payment events
- User granted read access to registry data via group membership

### Version 3 Schema Structure

- RegardeSDK version field enables migration support
- PaymentEvent maps use nested structure: `all[providerUUID]` and `byApp[appId][providerUUID]`
- Separate groups for user data (userGroup) and payment data (regardeAdminOtherReadersGroup)
