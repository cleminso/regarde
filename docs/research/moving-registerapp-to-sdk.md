# Moving `registerApp` from Dashboard to SDK

## Context

Currently, the dashboard app has a local API client at `#lib/api/registerApp` that handles HTTP registration with `api.regarde.dev`. This creates a leaky abstraction where the consumer app knows about internal implementation details.

## Problem

1. **Code duplication**: Each consumer app (dashboard, regarde.bio) needs its own API client
2. **Leaky abstraction**: Apps need to know about API URLs, auth headers, error handling
3. **Maintenance burden**: API changes require updates in multiple places
4. **Inconsistency**: Different apps may handle registration differently

## Current Flow

```
dashboard → createApp() (SDK) → Jazz CoMap created locally
         → registerApp() (local) → HTTP call to api.regarde.dev
```

## Proposed Architecture

Move the API client into the SDK as `registerAppWithRegistry()`:

```
dashboard → createApp() (SDK) → Jazz CoMap
         → registerAppWithRegistry() (SDK) → HTTP call
```

## Benefits

1. **Single source of truth**: SDK encapsulates all Regarde operations
2. **Open-source ready**: Self-hosters can choose to register or not
3. **Configurable**: API endpoint can be customized for self-hosting
4. **Reusable**: All apps use the same implementation

## Implementation Plan

### Phase 1: Create SDK API Module

**Location**: `packages/sdk/src/core/api/app.ts`

```typescript
interface RegisterAppOptions {
  apiUrl: string;
}

export async function registerAppWithRegistry(
  appId: string,
  auth: TRegardeAuthLoaded,
  accountId: string,
  options: RegisterAppOptions
): Promise<RegisterAppResponse>
```

### Phase 2: Export from SDK

**Location**: `packages/sdk/src/core/index.ts`

```typescript
export { registerAppWithRegistry } from "./api/app";
```

### Phase 3: Update Dashboard

**File**: `apps/dashboard.regarde.dev/src/components/register-app/registerAppForm.tsx`

```typescript
// Remove local import
// import { registerApp } from "#lib/api/registerApp";

// Use SDK instead
import { createApp, registerAppWithRegistry } from "@regarde-dev/core";

// In submit handler
const app = await createApp(account, data);
await registerAppWithRegistry(app.$jazz.id, auth, account.$jazz.id, {
  apiUrl: import.meta.env.VITE_API_BASE_URL
});
```

### Phase 4: Delete Local API Client

**Remove**: `apps/dashboard.regarde.dev/src/lib/api/registerApp.ts`

## Design Decisions

### Why keep operations separate?

```typescript
// Option A: Two operations (chosen)
const app = await createApp(account, data);
await registerAppWithRegistry(app.$jazz.id, auth, { apiUrl });

// Option B: Auto-register
const app = await createApp(account, data, { register: true, apiUrl });
```

**Rationale for Option A**:
- Self-hosters may not want global registration
- Allows retrying registration separately from creation
- Clear separation of concerns
- Easier to test and mock

### Why configurable API URL?

For open-source/self-hosting scenario:
- Regarde.dev hosted: `https://api.regarde.dev`
- Self-hosted: `https://my-regarde-instance.com`
- Local-only: Skip registration entirely

## Files to Modify

1. **Create**: `packages/sdk/src/core/api/app.ts`
2. **Modify**: `packages/sdk/src/core/index.ts` (add export)
3. **Modify**: `apps/dashboard.regarde.dev/src/components/register-app/registerAppForm.tsx`
4. **Delete**: `apps/dashboard.regarde.dev/src/lib/api/registerApp.ts`
5. **Delete**: `apps/dashboard.regarde.dev/src/lib/api/` (if empty)

## Error Handling

The SDK function should:
- Throw typed errors matching current implementation
- Include retry logic for transient failures
- Provide clear error messages for auth failures

## Migration Notes

- No breaking changes to `createApp()`
- New function is additive
- Dashboard becomes simpler (less code)
- Other apps (regarde.bio) can adopt the same pattern

## Related Research

- [MaybeLoaded Pattern](./maybeLoaded-pattern-jazz.md) - Loading states for Jazz data
- SDK schema validation should be single source of truth for constraints
