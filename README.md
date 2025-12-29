# Regarde.dev - Schema & Architecture

## Table of Contents

- [Overview](#overview)
- [Packages](#packages)
- [Schemas](#schemas)
  - [RegardeAccount](#regardeaccount)
  - [RegardeAuth](#regardeauth)
  - [RegardeSDK](#regardesdk)
  - [WorkerAccounts](#workeraccounts)
- [Note: RegardeProfile](#note-regardeprofile)
- [Actors](#actors)
- [Interaction Flows](#interaction-flows)
- [Authentication](#authentication)

## Overview

Regarde.dev is a distributed profile system built on Jazz. It provides stateless authentication, profile management, and registry services through a multi-actor architecture.

## Packages

### App Directory (app/regarde.bio/)

- `frontend` (formerly `regarde.bio`) - **Internal testing application** for SDK development. Will be moved outside this project in the future. When documenting "user profiles", refer to the SDK perspective unless specifically discussing regarde.bio.
- `api.regarde.bio` - API service for profile access and reading user data. Uses ProfileWorkerAccount with read-only access.
- `jazz-schemas` - Shared CoValue schemas for profiles and accounts. Loads SDK during migration to assign proper worker permissions.

### Packages Directory (packages/)

- `@regarde-dev/sdk` - Client SDK for authentication, profile management, and token generation. Interfaces with APIs and manages user permissions.
- `api.regarde.dev` - API service for nickname registry operations. Uses RegistryWorkerAccount with write access to nickname registries.
- `admin` - CLI tool for profile nickname registry admin operations.

## Schemas

### RegardeAccount

User's root account containing profile reference and SDK data.

```typescript
RegardeProfileMetadata = CoProfile<{
  "regarde.bio": string; // ID reference to RegardeProfile CoMap
}>;

RegardeRoot = CoMap<{
  "regarde.bio": RegardeProfile;
  "regarde-sdk": RegardeSDK;
}>;

RegardeAccount = CoAccount<{
  profile: RegardeProfileMetadata;
  root: RegardeRoot;
}>;
```

### RegardeAuth

Temporary authentication tokens for stateless API authentication.

```typescript
RegardeAuth = CoMap<{
  token: string; // 24-hour expiring token
  expiresAt: number; // Unix timestamp
}>;

// Stored in: account.root["api.regarde.dev"]
```

### RegardeSDK

SDK schema containing user handle and authentication data.

```typescript
UserHandle = CoMap<{
  nickname: string;
  registeredAt: number;
  lastModified: number;
  isActive: boolean;
}>;

RegardeSDK = CoMap<{
  userHandle: UserHandle;
  auth: RegardeAuth;
  version: number;
}>;

// Stored in: account.root["regarde-sdk"]
```

### WorkerAccounts

#### RegistryWorkerAccount (api.regarde.dev)

Manages nickname registries and has write access to user data.

**Implementation:** `packages/sdk/src/registry/schemas/registry.ts:61-65`
**Migration:** `packages/sdk/src/registry/schemas/registry.ts:66-165` - Ensures registries exist in worker root
**Startup:** `packages/api.regarde.dev/src/index.ts:92-93` - Starts via `startWorker()`

```typescript
RegistryWorkerAccountRoot = CoMap<{
  registry: NicknameRegistryCoRecord; // nickname → jazzAccountId
  reverseRegistry: ReverseNicknameRegistryCoRecord; // jazzAccountId → nickname
  auditLog: RegistryAuditLog; // Operation history
  reservedNicknames: ReservedNicknamesRegistry; // Reserved nicknames
}>;

RegistryWorkerAccount = CoAccount<{
  profile: CoProfile;
  root: RegistryWorkerAccountRoot;
}>;
```

#### ProfileWorkerAccount (api.regarde.bio)

Reads user profiles with no registry access.

**Implementation:** `app/regarde.bio/jazz-schemas/src/regarde.bio/profileWorker.ts:23-26`
**Startup:** `app/regarde.bio/api.regarde.bio/src/index.ts:79-80` - Starts via `startWorker()`

```typescript
ProfileWorkerAccountRoot = CoMap<{
  // Empty root - read-only access to user profiles
  // No registries, no audit logs
}>;

ProfileWorkerAccount = CoAccount<{
  profile: CoProfile;
  root: ProfileWorkerAccountRoot;
}>;
```

## Note: RegardeProfile

The detailed `RegardeProfile` schema with all fields (SocialLinks, Project, WorkExp, etc.) is part of the regarde.bio testing application and can be found in that repository's documentation. This README focuses on the core SDK architecture and schemas.

## Actors

### User

- Generates authentication tokens via SDK
- Manages profile data through RegardeAccount
- Sends tokens in API request headers

### SDK (@regarde-dev/sdk)

- Provides `useRegardeAuth()` hook for token generation
- Manages UserHandle registration and validation
- Handles token refresh and validation
- **Permission Management:** `packages/sdk/src/auth/schemas/auth.ts:44-94` - `initRegardeSDK()` adds worker permissions via group membership
- **Worker Access:** `packages/sdk/src/auth/schemas/auth.ts:96-124` - `addRegardePermissions()` grants worker write access to user data

### API (api.regarde.dev)

- Verifies authentication tokens
- Manages nickname registries
- Uses RegistryWorkerAccount for write operations
- Validates token ownership and expiration
- **State Loading:** `packages/api.regarde.dev/src/index.ts:111-119` - Loads registries via `ensureLoaded()`
- **Environment:** Requires `JAZZ_WORKER_ACCOUNT` and `JAZZ_WORKER_SECRET`

### Profiles API (api.regarde.bio)

- Reads user profile data
- Uses ProfileWorkerAccount for read operations
- No registry management capabilities
- **Environment:** Requires `PROFILE_WORKER_ACCOUNT` and `PROFILE_WORKER_SECRET`
- **Read-Only:** Empty worker root - only profile loading capabilities

### Worker Account

- Two types: RegistryWorkerAccount, ProfileWorkerAccount
- Stored in Jazz Cloud with specific permissions
- Enables stateless authentication verification
- **Hardcoded Worker ID:** `co_zoppoxWWJaHYKPgSgUkuCCXQX21` - Used for permission assignments in `packages/sdk/src/auth/schemas/auth.ts`

## Interaction Flows

### Token Generation Flow

```
User
  ↓
SDK.useRegardeAuth()
  ↓
Generate token (24-hour expiry)
  ↓
Store in RegardeAuth CoMap
  ↓
account.root["api.regarde.dev"] ← RegardeAuth
  ↓
Return token + token ID to user
```

### Token Verification Flow

```
User Request
  ↓
Headers: X-Regarde-Token, X-Regarde-Token-Id
  ↓
API receives request
  ↓
Load RegardeAuth using token ID
  ↓
Verify token matches and not expired
  ↓
Verify user owns the RegardeAuth CoMap
  ↓
Proceed with authenticated request
```

### Profile Access Flow (api.regarde.bio)

```
User Request for Profile
  ↓
Headers: X-Regarde-Token, X-Regarde-Token-Id
  ↓
api.regarde.bio receives request
  ↓
Verify token (same as above)
  ↓
Load user's RegardeAccount
  ↓
Navigate to account.root["regarde.bio"]
  ↓
Return RegardeProfile data
  ↓
ProfileWorkerAccount used for read access
```

### Registration Flow (api.regarde.dev)

```
User registers nickname
  ↓
SDK sends registration request
  ↓
api.regarde.dev verifies token
  ↓
RegistryWorkerAccount accesses registry
  ↓
Updates NicknameRegistry CoMap
  ↓
Updates UserHandle in user's account
  ↓
Confirms registration
```

## Authentication

### Stateless Authentication

- No server-side sessions
- Each request independently verified
- 24-hour token lifetime
- Token refresh via SDK

### Security Model

- Tokens stored in user's RegardeAuth CoMap (`packages/sdk/src/auth/schemas/auth.ts:21-34`)
- Worker account verifies token ownership via group membership
- Expiration checks prevent token reuse (24-hour lifetime)
- No sensitive data in token itself
- **Permission Assignment:** Worker ID hardcoded in SDK for consistent access control

### API Headers

```
X-Regarde-Token: <token-string>
X-Regarde-Token-Id: <co-map-id>
```

### Namespace Structure

```
account.root["regarde.bio"] → RegardeProfile (public profile data)
account.root["regarde-sdk"] → RegardeSDK (user handle + auth tokens)
account.root["api.regarde.dev"] → RegardeAuth (24-hour expiring tokens)
account.root["api.regarde.bio"] → (future use)
```

**Permission Flow:**

1. `app/regarde.bio/jazz-schemas` loads SDK during migration
2. SDK creates user group with worker as "writer" member
3. Worker gains access to validate tokens and read profiles
4. All permissions managed through Jazz group membership

## Jazz Cloud Sync

All CoValues sync through Jazz Cloud with eventual consistency:

- RegardeAccount (user's root account)
- RegardeProfile (public profile data)
- RegardeAuth (authentication tokens)
- NicknameRegistry (managed by worker)
- UserHandle (per-user handle data)

**Architecture Notes:**

- Services are stateless - all state lives in Jazz Cloud
- No worker account partitioning - all instances access same registries
- Scalability achieved through horizontal scaling of HTTP services
- Jazz Cloud provides built-in replication and CRDT-based conflict resolution
- Worker accounts enable server-side operations while maintaining Jazz's distributed architecture
