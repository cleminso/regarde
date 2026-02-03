# Jazz Regarde Patterns

Skill for Jazz local-first database patterns used in Regarde SDK.

## Overview

This skill helps you work with Jazz, a local-first database that syncs across devices and users.

## When to Use

- Defining Jazz schemas (CoMaps, CoLists, CoRecords)
- Working with real-time sync and loading states
- Implementing authentication (passphrase, tokens)
- Managing permissions and groups
- Creating React/Preact hooks for Jazz data
- Working with Regarde SDK specifically

## Core Principles

### Write-Wait-Use Pattern

```typescript
const coMap = CoMap.create({ ... });
await coMap.$jazz.waitForSync(); // REQUIRED
```

### Create-Set-Sync Pattern

```typescript
const newSDK = RegardeSDK.create({ ... });
root.$jazz.set("regarde-sdk", newSDK);
await newSDK.$jazz.waitForSync();
await root.$jazz.waitForSync();
```

### Loading/Validation with Explicit Boolean

```typescript
const isValid = account !== null && account.$isLoaded === true;
if (isValid === false) throw new Error("Account must be loaded");
```

## CoValue Types (Regarde-Used)

| Type              | Purpose             | Regarde Usage                                   |
| ----------------- | ------------------- | ----------------------------------------------- |
| `co.map({...})`   | Key-value objects   | RegardeSDK, RegardeTokenAuth, App, PaymentEvent |
| `co.list(T)`      | Ordered collections | myApps list                                     |
| `co.record(K, V)` | Dynamic key-value   | PaymentEvent maps                               |

## Import Structure

```typescript
import { co, z, Group, type ID } from "jazz-tools";
import { RegardeAccount } from "@regarde-dev/core";
import { useMyHook } from "#/lib/hooks";
import { Component } from "./Component";
```

## Examples

### Creating a CoMap

```typescript
const app = App.create({
  name: "My App",
  isEnabled: false,
  paymentProvider: "lemonsqueezy",
});
await app.$jazz.waitForSync();
```

### Loading with Validation

```typescript
const account = await MyAccount.load(id, { loadAs: me });
const isLoaded = account !== null && account.$isLoaded === true;
if (isLoaded === false) throw new Error("Account not loaded");
```

### React Hook with Explicit Validation

```typescript
function MyComponent() {
  const account = useAccount(RegardeAccount, {
    resolve: { root: { "regarde-sdk": true } }
  });

  const isLoaded = account !== null && account.$isLoaded === true;
  if (isLoaded === false) return <div>Loading...</div>;

  const isRootLoaded = account.root !== null && account.root.$isLoaded === true;
  if (isRootLoaded === false) return <div>Loading root...</div>;

  const sdk = account.root["regarde-sdk"];
  const isSdkLoaded = sdk !== null && sdk.$isLoaded === true;
  if (isSdkLoaded === false) return <div>Loading SDK...</div>;

  return <div>{sdk.version}</div>;
}
```

### Regarde Authentication

```typescript
const { token, tokenId, isExpired, refresh } = useRegardeTokenAuth(
  regardeSDK?.auth,
);

const hasToken = token !== null && token.length > 0;
const hasTokenId = tokenId !== null && tokenId.length > 0;
const canMakeRequest = hasToken && hasTokenId && isExpired === false;

const response = await fetch("/api/action", {
  headers: {
    "X-Regarde-Token": token,
    "X-Regarde-Token-Id": tokenId,
  },
});
```

## References

- **covalues/** - CoMap, CoList, CoRecord
- **schemas/** - Schema definitions, migrations
- **sync-safety/** - Write-Wait-Use patterns, loading states
- **authentication/** - Passphrase (CLI), Token auth (API)
- **groups-permissions/** - Group roles, access control
- **react-hooks/** - useAccount, useCoState, useRegardeTokenAuth
- **patterns/** - Common implementation patterns
- **gotchas/** - Common mistakes and how to avoid them

## Decision Tree

```
Working with Jazz?
├── Defining data structure?
│   ├── Fixed fields → co.map({ field: z.string() })
│   ├── Dynamic keys → co.record(z.string(), z.string())
│   └── Ordered list → co.list(Item)
├── Creating data?
│   ├── ALWAYS specify owner via Group
│   ├── ALWAYS call await coValue.$jazz.waitForSync()
│   └── Use Create-Set-Sync for nested CoValues
├── Reading data?
│   ├── Check $isLoaded === true before access
│   ├── Use ensureLoaded() for deep resolution
│   └── Use subscribe() for real-time updates
├── Authentication?
│   ├── Passphrase (CLI) → usePassphraseAuth()
│   └── Tokens (API) → RegardeTokenAuth (24h expiry)
└── Permissions?
    ├── Single user → owner: account
    ├── Multiple users → Group with addMember()
    ├── Public read → group.makePublic()
    └── Worker access → Group with worker as writer/admin
```
