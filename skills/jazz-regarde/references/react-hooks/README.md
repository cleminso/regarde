# React Hooks Reference

React integration for Jazz.

## Table of Contents

- [Overview](#overview)
- [Setup Prerequisites](#setup-prerequisites)
- [Provider Setup](#provider-setup)
- [Core Hooks](#core-hooks)
  - [useAccount](#useaccount)
  - [useCoState](#usecostate)
  - [useAgent](#useagent)
  - [useIsAuthenticated](#useisauthenticated)
- [Authentication Hooks](#authentication-hooks)
  - [usePassphraseAuth](#usepassphraseauth)
  - [useRegardeAuth](#useregardeauth)
- [Custom Hooks](#custom-hooks)
  - [useRegardeTokenAuth](#useregardetokenauth)
  - [useMyRegardeAccount](#usemyregardeaccount)
- [Hook Patterns](#hook-patterns)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [See Also](#see-also)

## Overview

Jazz provides hooks for reactive UI updates. Components re-render when relevant CoValues change.

## Setup Prerequisites

Before using Regarde SDK hooks, ensure your application meets these requirements:

### 1. React Version Alignment

Your app must use the same React version as the SDK to avoid hook errors:

```json
{
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  }
}
```

Ensure your monorepo catalog uses matching React version across all packages.

### 2. Required Dependencies

```json
{
  "dependencies": {
    "@regarde-dev/core": "workspace:*",
    "jazz-tools": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:"
  }
}
```

### 3. SDK Build

The SDK must be built before use in development:

```bash
pnpm --filter @regarde-dev/core build
```

## Provider Setup

All Regarde SDK hooks require `JazzReactProvider` to be mounted at the root of your application. This sets up the Jazz context including sync server connection.

### Basic Setup

```typescript
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { JazzReactProvider } from "jazz-tools/react";
import { RegardeAccount } from "@regarde-dev/core";
import { RouterProvider } from "@tanstack/react-router";

function App() {
  return (
    <StrictMode>
      <JazzReactProvider
        AccountSchema={RegardeAccount}
          sync={{
            peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
          }}
          >
          <RouterProvider router={router} />
        </JazzReactProvider>
    </StrictMode>
  );
}
```

### Provider Configuration

```typescript
<JazzReactProvider
  AccountSchema={RegardeAccount}
  sync="wss://your-jazz-server.com"
  apiKey="your-api-key"
>
  <App />
</JazzReactProvider>
```

**Required Props:**

- `AccountSchema`: `RegardeAccount` from `@regarde-dev/core`
- `sync`: Jazz sync server URL
- `apiKey`: API key for authentication

**Optional Props:**

- `guestMode`: Enable guest mode without authentication
- `authSecretStorageKey`: Custom storage key for auth secrets

## Core Hooks

### useAccount

Get current account with specified resolution.

```typescript
import { useAccount } from "jazz-tools/react";
import { MyAccount } from "./schema";

function MyComponent() {
  const account = useAccount(MyAccount, {
    resolve: {
      profile: true,
      root: { myData: { $each: true } }
    }
  });

  // Explicit boolean check
  const isLoaded = account !== null && account.$isLoaded === true;
  if (isLoaded === false) {
    return <div>Loading...</div>;
  }

  return <div>{account.profile.name}</div>;
}
```

Parameters:

- `accountSchema`: Account schema
- `resolve`: Resolution query (optional)

Returns: `Loaded<AccountSchema>`

### useCoState

Subscribe to any CoValue.

```typescript
import { useCoState } from "jazz-tools/react";

function TaskComponent({ taskId }: { taskId: string }) {
  const task = useCoState(Task, taskId, {
    resolve: { subtasks: { $each: true } }
  });

  // Explicit boolean check
  const isLoaded = task !== null && task.$isLoaded === true;
  if (isLoaded === false) {
    return <div>Loading...</div>;
  }

  return <div>{task.title}</div>;
}
```

Parameters:

- `schema`: CoValue schema
- `id`: CoValue ID
- `resolve`: Resolution query (optional)

Returns: `Loaded<CoValue>`

### useAgent

Get current agent (account or guest).

```typescript
import { useAgent } from "jazz-tools/react";

function Component() {
  const agent = useAgent();

  const isGuest = agent.$type$ !== "Account";
  const isAccount = agent.$type$ === "Account";

  return <div>{isGuest ? "Guest" : "User"}</div>;
}
```

Returns: `Account | Guest`

### useIsAuthenticated

Check if user is authenticated (not anonymous).

```typescript
import { useIsAuthenticated } from "jazz-tools/react";

function Component() {
  const isAuthenticated = useIsAuthenticated();

  return <div>{isAuthenticated ? "Authenticated" : "Anonymous"}</div>;
}
```

Returns: `boolean`

## Authentication Hooks

### usePassphraseAuth

Jazz native passphrase authentication. Used in Regarde CLI.

```typescript
import { usePassphraseAuth } from "jazz-tools/react";
import { wordlist } from "./wordlist";

function PassphraseComponent() {
  const auth = usePassphraseAuth({ wordlist });
  const [input, setInput] = useState("");

  const isSignedIn = auth.state === "signedIn";
  const isLoading = auth.state === "loading";
  const hasError = auth.state === "error";

  if (isSignedIn === true) {
    return <div>Welcome! Passphrase: {auth.passphrase}</div>;
  }

  if (isLoading === true) {
    return <div>Loading...</div>;
  }

  if (hasError === true) {
    return <div>Error: {auth.error}</div>;
  }

  return (
    <div>
      <textarea readOnly value={auth.passphrase} />
      <button onClick={() => auth.signUp()}>Sign Up</button>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={() => auth.logIn(input)}>Log In</button>
    </div>
  );
}
```

Returns:

- `passphrase`: Current passphrase
- `signUp()`: Sign up
- `logIn(passphrase)`: Log in
- `state`: "idle" | "loading" | "signedIn" | "error"
- `error`: Error message

### useRegardeAuth

Regarde SDK wrapper for passphrase authentication with BIP39 wordlist and automatic SDK initialization.

**Important**: This hook requires `JazzReactProvider` with `AccountSchema={RegardeAccount}` to be mounted at the root of your application. See [Provider Setup](#provider-setup) for details.

```typescript
import { useRegardeAuth } from "@regarde-dev/core/react";

function RegardeAuthComponent() {
  const { state, signUp, logIn, logOut, account, regardeSDK } = useRegardeAuth();
  const [input, setInput] = useState("");

  const isSignedIn = state === "signedIn";

  if (isSignedIn === true) {
    return (
      <div>
        <div>Welcome! Account loaded.</div>
        <div>SDK Version: {regardeSDK?.version}</div>
        <button onClick={logOut}>Log Out</button>
      </div>
    );
  }

  return (
    <div>
      <h3>Sign Up</h3>
      <button
        onClick={async () => {
          const passphrase = await signUp("my-username");
          alert(`SAVE THIS PASSPHRASE:\n${passphrase}`);
        }}
      >
        Create Account
      </button>

      <h3>Log In</h3>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your BIP39 passphrase"
        rows={5}
      />
      <button onClick={() => logIn(input)}>Log In</button>
    </div>
  );
}
```

Returns:

- `state`: "anonymous" | "signedIn"
- `signUp(userName)`: Create new account and return BIP39 passphrase
- `logIn(passphrase)`: Log in with existing BIP39 passphrase
- `logOut()`: Log out
- `account`: Loaded RegardeAccount or null
- `regardeSDK`: Loaded RegardeSDK or null

Key features:

- BIP39 wordlist built-in (english)
- RegardeSDK automatically initialized via RegardeAccount.withMigration
- Binary state (no loading state exposed)
- Returns passphrase on signUp for user ownership
- Deep resolution: account.root["regarde-sdk"] with auth, myApps, myUserHandle, myPayments

## Custom Hooks

### useRegardeTokenAuth

Regarde SDK authentication hook for API tokens.

```typescript
import { useRegardeTokenAuth } from "@regarde-dev/core/react";

function ApiComponent() {
  const { regardeSDK } = useMyRegardeAccount();
  const { token, tokenId, isExpired, refresh, isLoading, error } =
    useRegardeTokenAuth(regardeSDK?.auth);

  // Explicit boolean checks
  const hasToken = token !== null && token.length > 0;
  const hasTokenId = tokenId !== null && tokenId.length > 0;
  const canCallApi = hasToken && hasTokenId && isExpired === false;

  // Auto-refresh on expiration
  useEffect(() => {
    if (isExpired === true && isLoading === false) {
      refresh();
    }
  }, [isExpired, isLoading, refresh]);

  // Use token for API calls
  const makeCall = useCallback(async () => {
    if (canCallApi === false) return;

    const response = await fetch("/api/action", {
      headers: {
        "X-Regarde-Token": token,
        "X-Regarde-Token-Id": tokenId,
      },
    });
    return response.json();
  }, [token, tokenId, canCallApi]);

  // ...
}
```

Returns:

- `token`: string | null
- `tokenId`: string | null
- `expiresAt`: number | null
- `isExpired`: boolean
- `refresh()`: Promise<void>
- `isLoading`: boolean
- `error`: string | null

### useMyRegardeAccount

Custom hook for Regarde account.

```typescript
import { useAccount } from "jazz-tools/react";
import { RegardeAccount } from "@regarde-dev/core";

function useMyRegardeAccount() {
  const account = useAccount(RegardeAccount, {
    resolve: {
      root: {
        "regarde-sdk": {
          auth: true,
          myApps: true,
          myUserHandle: true,
        },
      },
    },
  });

  // Explicit boolean check
  const isAccountLoaded = account !== null && account.$isLoaded === true;
  if (isAccountLoaded === false) {
    return { account: null, regardeSDK: null, isLoaded: false };
  }

  const regardeSDK = account.root["regarde-sdk"];
  const isSdkLoaded = regardeSDK !== null && regardeSDK.$isLoaded === true;

  return {
    account,
    regardeSDK,
    isLoaded: isSdkLoaded,
  };
}
```

## Hook Patterns

### Pattern 1: Loading State with Explicit Check

```typescript
function Component() {
  const account = useAccount(MyAccount);

  // Explicit boolean check
  const isLoaded = account !== null && account.$isLoaded === true;
  if (isLoaded === false) {
    return <div>Loading...</div>;
  }

  return <div>{account.profile.name}</div>;
}
```

### Pattern 2: Nested Loading with Explicit Checks

```typescript
function Component() {
  const account = useAccount(MyAccount, {
    resolve: { root: { myList: { $each: true } } }
  });

  const isAccountLoaded = account !== null && account.$isLoaded === true;
  if (isAccountLoaded === false) {
    return <div>Loading account...</div>;
  }

  const isRootLoaded = account.root !== null && account.root.$isLoaded === true;
  if (isRootLoaded === false) {
    return <div>Loading root...</div>;
  }

  const isListLoaded = account.root.myList !== null &&
                       account.root.myList.$isLoaded === true;
  if (isListLoaded === false) {
    return <div>Loading list...</div>;
  }

  return (
    <div>
      {account.root.myList.map(item => {
        const isItemLoaded = item !== null && item.$isLoaded === true;
        return isItemLoaded === true ? (
          <div key={item.$jazz.id}>{item.name}</div>
        ) : null;
      })}
    </div>
  );
}
```

### Pattern 3: Error Handling

```typescript
function Component() {
  const [error, setError] = useState<string | null>(null);
  const account = useAccount(MyAccount);

  useEffect(() => {
    const isLoaded = account !== null && account.$isLoaded === true;
    if (isLoaded === false && error === null) {
      setError("Failed to load account");
    }
  }, [account, error]);

  if (error !== null) {
    return <div>Error: {error}</div>;
  }

  const isLoaded = account !== null && account.$isLoaded === true;
  if (isLoaded === false) {
    return <div>Loading...</div>;
  }

  return <div>{account.profile.name}</div>;
}
```

### Pattern 4: Multiple useAccount Calls

```typescript
// Jazz deduplicates loads, so this is efficient
function Parent() {
  const account = useAccount(MyAccount, {
    resolve: { profile: true }
  });

  return <Child />;
}

function Child() {
  // Same account, no extra network request
  const account = useAccount(MyAccount, {
    resolve: { root: { myData: true } }
  });

  const isLoaded = account !== null && account.$isLoaded === true;
  if (isLoaded === false) return null;

  return <div>{account.root.myData.length}</div>;
}
```

### Pattern 5: Dynamic Resolution

```typescript
function Component({ deep }: { deep: boolean }) {
  const account = useAccount(MyAccount, {
    resolve: deep
      ? { root: { myData: { $each: { nested: true } } } }
      : { root: { myData: true } },
  });

  const isLoaded = account !== null && account.$isLoaded === true;
  if (isLoaded === false) return null;

  // ...
}
```

### Pattern 6: useCoState for Individual Items

```typescript
function TaskList({ taskIds }: { taskIds: string[] }) {
  return (
    <div>
      {taskIds.map(id => <TaskItem key={id} taskId={id} />)}
    </div>
  );
}

function TaskItem({ taskId }: { taskId: string }) {
  const task = useCoState(Task, taskId);

  const isLoaded = task !== null && task.$isLoaded === true;
  if (isLoaded === false) {
    return <div>Loading...</div>;
  }

  return <div>{task.title}</div>;
}
```

## Best Practices

### 1. Always Use Explicit $isLoaded === true Check

```typescript
// ✓ Good - explicit boolean
const isLoaded = account !== null && account.$isLoaded === true;
if (isLoaded === false) {
  return <div>Loading...</div>;
}

// ✗ Bad - implicit truthiness
if (!account.$isLoaded) {
  return <div>Loading...</div>;
}

// ✗ Bad - no check
return <div>{account.profile.name}</div>;
```

### 2. Use Minimal Resolution

```typescript
// ✓ Good - only load what's needed
const account = useAccount(MyAccount, {
  resolve: { profile: { name: true } },
});

// ✗ Bad - over-fetching
const account = useAccount(MyAccount, {
  resolve: { profile: { name: true, bio: true, avatar: { original: true } } },
});
```

### 3. Memoize Callbacks

```typescript
// ✓ Good
const handleUpdate = useCallback(() => {
  account.root.$jazz.set("field", value);
}, [account, value]);

// ✗ Bad - creates new function each render
<button onClick={() => account.root.$jazz.set("field", value)}>
```

### 4. Handle Deep Loading with Explicit Checks

```typescript
// ✓ Good - check each level with explicit booleans
const isAccountLoaded = account !== null && account.$isLoaded === true;
if (isAccountLoaded === false) return null;

const isRootLoaded = account.root !== null && account.root.$isLoaded === true;
if (isRootLoaded === false) return null;

const isListLoaded = account.root.myList !== null &&
                     account.root.myList.$isLoaded === true;
if (isListLoaded === false) return null;

// ✗ Bad - might crash
account.root.myList.forEach(item => ...)
```

### 5. Use Select for Filtering

```typescript
import { useCoState } from "jazz-tools/react";

function FilteredTasks({ listId, filter }: { listId: string; filter: string }) {
  const tasks = useCoState(TaskList, listId, {
    resolve: { $each: true },
    select: (list) => {
      const isLoaded = list !== null && list.$isLoaded === true;
      if (isLoaded === false) return null;
      return list.filter(t => {
        const isTaskLoaded = t !== null && t.$isLoaded === true;
        return isTaskLoaded === true && t.title.includes(filter);
      });
    }
  });

  return <div>{tasks?.map(t => <div>{t.title}</div>)}</div>;
}
```

### 6. Clean Up Side Effects

```typescript
// ✓ Good
useEffect(() => {
  const unsub = CoMap.subscribe(id, {}, callback);
  return () => unsub();
}, [id]);

// ✗ Bad - memory leak
useEffect(() => {
  CoMap.subscribe(id, {}, callback);
}, [id]);
```

### 7. Use Type Safety

```typescript
// ✓ Good - explicit type
const account = useAccount(MyAccount);

// ✗ Bad - using generic Account
const account = useAccount();
```

## Troubleshooting

### Error: "Invalid hook call" or "dispatcher.useContext"

```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
Error: Cannot read properties of null (reading 'useContext')
```

**Cause**: `JazzReactProvider` is not mounted at the root of your application.

**Solution**: Wrap your application with `JazzReactProvider`:

```typescript
import { JazzReactProvider } from "jazz-tools/react";
import { RegardeAccount } from "@regarde-dev/core";

<JazzReactProvider
  AccountSchema={RegardeAccount}
    sync={{
      peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
    }}
    >
  <App />
</JazzReactProvider>
```

### Error: "Multiple copies of React"

```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Cause**: Different React versions between SDK and app.

**Solution**: Ensure all packages use the same React version via monorepo catalog:

```yaml
# pnpm-workspace.yaml
catalog:
  react: 19.2.4
  react-dom: 19.2.4
```

```json
{
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  }
}
```

After updating catalog, run `pnpm install` and rebuild SDK.

### Error: "$isLoaded is not a function"

```
TypeError: account.$isLoaded is not a function
```

**Cause**: Using incorrect account type or accessing properties on unloaded CoValue.

**Solution**: Always check if loaded before accessing:

```typescript
const account = useAccount(RegardeAccount);
const isLoaded = account !== null && account.$isLoaded === true;
if (isLoaded === false) {
  return <div>Loading...</div>;
}
```

## See Also

- [Sync Safety](../sync-safety/README.md) - Data consistency patterns
- [Patterns](../patterns/README.md) - Implementation patterns
- [Schemas](../schemas/README.md) - Defining data structures
