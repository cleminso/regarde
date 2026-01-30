---
name: jazz-regarde
description: Jazz local-first database patterns for Regarde SDK - CoValues, sync safety, authentication, and permissions
version: 1.0.0
references:
  - covalues/README.md
  - covalues/api.md
  - schemas/README.md
  - schemas/migrations.md
  - sync-safety/README.md
  - authentication/README.md
  - authentication/api.md
  - groups-permissions/README.md
  - react-hooks/README.md
  - patterns/README.md
---

# Jazz Regarde Patterns

Essential Jazz patterns for building with the Regarde SDK. Covers CoValues, sync safety, authentication, and permissions.

## When to Use This Skill

Use when:

- Defining new Jazz schemas (CoMaps, CoLists, CoRecords)
- Working with real-time sync and loading states
- Implementing authentication flows
- Managing permissions and groups
- Creating React/Preact hooks for Jazz data
- Working with the Regarde SDK specifically

## Core Principles

### Write-Wait-Use Pattern

ALWAYS wait for sync before reading after writes:

```typescript
const newCoMap = SomeCoMap.create({ ... }, { owner: someGroup });
await newCoMap.$jazz.waitForSync(); // REQUIRED
```

### Create-Set-Sync Pattern

For nested CoValues:

```typescript
root.$jazz.set("regarde-sdk", newSDK);
await newSDK.$jazz.waitForSync();
await account.$jazz.waitForSync();
```

### Loading/Validation

Always check $isLoaded with explicit boolean:

```typescript
const isValid = account !== null && account.$isLoaded === true;
if (isValid === false) throw new Error("Account must be loaded");
```

## Quick Reference

### CoValue Types (Regarde-Used)

| Type              | Purpose             | Regarde Usage                              |
| ----------------- | ------------------- | ------------------------------------------ |
| `co.map({...})`   | Key-value objects   | RegardeSDK, RegardeAuth, App, PaymentEvent |
| `co.list(T)`      | Ordered collections | myApps list                                |
| `co.record(K, V)` | Dynamic key-value   | PaymentEvent maps                          |

### Import Structure

```typescript
// Order: external, workspace, aliased, relative
import { co, z, Group, type ID } from "jazz-tools";
import { RegardeAccount } from "@regarde-dev/core";
import { useMyHook } from "#/lib/hooks/useMyHook";
import { Component } from "./Component";
```

### Loading Patterns with Validation

```typescript
// Basic load with explicit check
const account = await MyAccount.load(id, { loadAs: me });
const isLoaded = account !== null && account.$isLoaded === true;
if (isLoaded === false) throw new Error("Account not loaded");

// Deep resolve
const account = await MyAccount.load(id, {
  loadAs: me,
  resolve: {
    root: {
      myList: { $each: true },
    },
  },
});

// Subscription with validation
const unsubscribe = MyCoMap.subscribe(id, {}, (value) => {
  const isLoaded = value !== null && value.$isLoaded === true;
  if (isLoaded === true) {
    console.log(value);
  }
});
```

### Group Permissions

```typescript
const group = Group.create({ owner: account });
group.addMember(otherAccount, "writer"); // admin, manager, writer, writeOnly, reader
group.makePublic(); // Everyone can read
```

## Decision Tree

```
Working with Jazz?
├── Defining data structure?
│   ├── Fixed fields → co.map({ field: z.string() })
│   ├── Dynamic keys → co.record(z.string(), z.string())
│   └── Ordered list → co.list(Item)
├── Creating data?
│   ├── Always specify owner via Group
│   ├── ALWAYS call await coValue.$jazz.waitForSync()
│   └── Use Create-Set-Sync for nested CoValues
├── Reading data?
│   ├── Check $isLoaded === true before access
│   ├── Use ensureLoaded() for deep resolution
│   └── Use subscribe() for real-time updates
├── Authentication?
│   ├── Passphrase (CLI) → usePassphraseAuth()
│   └── Tokens (API) → RegardeAuth (24h expiry)
└── Permissions?
    ├── Single user → owner: account
    ├── Multiple users → Group with addMember()
    ├── Public read → group.makePublic()
    └── Worker access → Group with worker as writer/admin
```

## Examples

### Example 1: Creating a CoMap with Proper Sync

```typescript
import { co, z, Group } from "jazz-tools";

const App = co.map({
  name: z.string(),
  isEnabled: z.boolean(),
  paymentProvider: z.enum(["lemonsqueezy", "stripe"]),
});

// Create with group ownership
const group = Group.create({ owner: account });
const app = App.create(
  { name: "My App", isEnabled: false, paymentProvider: "lemonsqueezy" },
  { owner: group },
);
await app.$jazz.waitForSync(); // REQUIRED

const appId = app.$jazz.id; // Now safe
```

### Example 2: Loading with Deep Resolution and Validation

```typescript
const account = await RegardeAccount.load(accountId, {
  loadAs: me,
  resolve: {
    root: {
      "regarde-sdk": {
        myApps: { $each: true },
        auth: true,
      },
    },
  },
});

// Check loaded state with explicit boolean
const isAccountLoaded = account !== null && account.$isLoaded === true;
if (isAccountLoaded === false) {
  throw new Error("Account not loaded");
}

const isRootLoaded = account.root !== null && account.root.$isLoaded === true;
if (isRootLoaded === true) {
  const regardeSDK = account.root["regarde-sdk"];
  const isSdkLoaded = regardeSDK !== null && regardeSDK.$isLoaded === true;

  if (isSdkLoaded === true && regardeSDK.myApps) {
    regardeSDK.myApps.forEach((app) => {
      const isAppLoaded = app !== null && app.$isLoaded === true;
      if (isAppLoaded === true) {
        console.log(app.name);
      }
    });
  }
}
```

### Example 3: React Hook with Explicit Validation

```typescript
import { useAccount } from "jazz-tools/react";
import { RegardeAccount } from "@regarde-dev/core";

function MyComponent() {
  const account = useAccount(RegardeAccount, {
    resolve: { root: { "regarde-sdk": true } }
  });

  // Explicit boolean check
  const isLoaded = account !== null && account.$isLoaded === true;
  if (isLoaded === false) {
    return <div>Loading...</div>;
  }

  const isRootLoaded = account.root !== null && account.root.$isLoaded === true;
  if (isRootLoaded === false) {
    return <div>Loading root...</div>;
  }

  const regardeSDK = account.root["regarde-sdk"];
  const isSdkLoaded = regardeSDK !== null && regardeSDK.$isLoaded === true;
  if (isSdkLoaded === false) {
    return <div>Loading SDK...</div>;
  }

  return <div>SDK Version: {regardeSDK.version}</div>;
}
```

### Example 4: Regarde Authentication Token with Validation

```typescript
import { RegardeAuth } from "@regarde-dev/core";
import { useRegardeAuth } from "@regarde-dev/core/react";

function ApiComponent() {
  const { regardeSDK } = useMyRegardeAccount();
  const { token, tokenId, isExpired, refresh, isLoading } = useRegardeAuth(
    regardeSDK?.auth
  );

  // Check with explicit booleans
  const hasToken = token !== null && token.length > 0;
  const hasTokenId = tokenId !== null && tokenId.length > 0;
  const canMakeRequest = hasToken && hasTokenId && isExpired === false;

  const makeApiCall = useCallback(async () => {
    if (canMakeRequest === false) return;

    const response = await fetch("/api/verify", {
      headers: {
        "X-Regarde-Token": token,
        "X-Regarde-Token-Id": tokenId,
      },
    });

    return response.json();
  }, [token, tokenId, canMakeRequest]);

  if (isExpired === true && isLoading === false) {
    refresh();
  }

  return <button onClick={makeApiCall} disabled={canMakeRequest === false}>
    Call API
  </button>;
}
```

### Example 5: Migration Pattern with Explicit Checks

```typescript
const RegardeAccount = co
  .account({
    root: RegardeRoot,
    profile: co.profile(),
  })
  .withMigration(async (account) => {
    // Check with explicit boolean
    const hasRoot = account.$jazz.has("root") === true;

    if (hasRoot === false) {
      account.$jazz.set("root", {
        "regarde-sdk": await initRegardeSDK(account, "create"),
      });
    }

    // Check for new fields with ensureLoaded
    const { root } = await account.$jazz.ensureLoaded({
      resolve: { root: true },
    });

    const isRootLoaded = root !== null && root.$isLoaded === true;
    if (isRootLoaded === true) {
      const hasNewField = root.$jazz.has("newField") === true;
      if (hasNewField === false) {
        root.$jazz.set("newField", []);
      }
    }

    await account.$jazz.waitForAllCoValuesSync();
  });
```
