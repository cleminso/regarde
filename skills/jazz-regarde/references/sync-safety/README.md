# Sync Safety Reference

Critical patterns for correct Jazz synchronization.

## Overview

Sync safety ensures data consistency across devices. Jazz is local-first - changes happen locally first, then sync. You must wait for sync before depending on new data.

**Key principle**: Always use explicit boolean checks (`$isLoaded === true`, `!== null`) rather than implicit truthiness.

## Table of Contents

- [Overview](#overview)
- [The Write-Wait-Use Pattern](#the-write-wait-use-pattern)
- [The Create-Set-Sync Pattern](#the-create-set-sync-pattern)
- [Loading State Checks](#loading-state-checks)
- [Loading CoValues](#loading-covalues)
- [Subscriptions](#subscriptions)
- [Timeout Configuration](#timeout-configuration)
- [Common Patterns](#common-patterns)
- [Regarde-Specific Patterns](#regarde-specific-patterns)
- [Common Mistakes](#common-mistakes)
- [Best Practices](#best-practices)
- [See Also](#see-also)

## The Write-Wait-Use Pattern

**Always wait for sync after creating or modifying CoValues.**

### Creating CoValues

```typescript
// ✓ CORRECT
const task = Task.create({ title: "New Task", completed: false });
await task.$jazz.waitForSync(); // REQUIRED
const id = task.$jazz.id; // Now safe

// ✗ WRONG - ID might be undefined
const task = Task.create({ title: "New Task", completed: false });
const id = task.$jazz.id; // May be undefined!
```

### Modifying CoValues

```typescript
// ✓ CORRECT
root.$jazz.set("myList", newList);
await newList.$jazz.waitForSync();
await root.$jazz.waitForSync();

// ✗ WRONG - Data might not be persisted
root.$jazz.set("myList", newList);
const list = root.myList; // Might not exist yet
```

## The Create-Set-Sync Pattern

For nested CoValues, chain the sync waits:

```typescript
// ✓ CORRECT - Complete pattern
const newSDK = RegardeSDK.create({ ... }, { owner: group });
root.$jazz.set("regarde-sdk", newSDK);
await newSDK.$jazz.waitForSync();
await root.$jazz.waitForSync();

// ✓ CORRECT - Full initialization
const userGroup = Group.create({ owner: account });
await userGroup.$jazz.waitForSync();

const regardeAuth = RegardeTokenAuth.create({ ... }, { owner: userGroup });
await regardeAuth.$jazz.waitForSync();

const myApps = co.list(App).create([], { owner: userGroup });
await myApps.$jazz.waitForSync();

const regardeSDK = RegardeSDK.create({
  auth: regardeAuth,
  myApps: myApps,
  // ...
}, { owner: userGroup });

root.$jazz.set("regarde-sdk", regardeSDK);
await regardeSDK.$jazz.waitForSync();
await root.$jazz.waitForSync();
```

## Loading State Checks

### Always Check $isLoaded

```typescript
// ✓ CORRECT - Explicit check
const isValid = coMap !== null && coMap.$isLoaded === true;
if (isValid === false) {
  throw new Error("CoMap not loaded");
}
console.log(coMap.field); // Safe

// ✗ WRONG - Accessing without check
console.log(coMap.field); // Crash if not loaded!
```

### Loading Checks

```typescript
// ✓ CORRECT - Multiple checks
const isGroupLoaded = group.$isLoaded === true;
const hasRequiredFields =
  coMap.$jazz.has("field1") === true && coMap.$jazz.has("field2") === true;
const isBothFieldsPresent = hasRequiredFields;

if (isBothFieldsPresent === false) {
  throw new Error("Missing required fields");
}
```

## Loading CoValues

### Basic Loading

```typescript
// Load by ID
const task = await Task.load(taskId, { loadAs: account });

const isTaskLoaded = task !== null && task.$isLoaded === true;
if (isTaskLoaded === false) {
  throw new Error("Task not found");
}

console.log(task.title);
```

### Deep Loading

```typescript
// Load with nested fields
const account = await MyAccount.load(accountId, {
  loadAs: me,
  resolve: {
    root: {
      myTasks: { $each: true },
      mySettings: { profile: true },
    },
  },
});

// Access nested loaded data
const isAccountLoaded = account !== null && account.$isLoaded === true;
if (isAccountLoaded === true) {
  const isRootLoaded = account.root !== null && account.root.$isLoaded === true;
  if (isRootLoaded === true) {
    const tasks = account.root.myTasks;
    const isTasksLoaded =
      tasks !== null && tasks !== undefined && tasks.$isLoaded === true;
    if (isTasksLoaded === true) {
      tasks.forEach((task) => {
        const isTaskLoaded = task !== null && task.$isLoaded === true;
        if (isTaskLoaded === true) {
          console.log(task.title);
        }
      });
    }
  }
}
```

### ensureLoaded()

```typescript
// Ensure loaded after initial load
const account = await MyAccount.load(accountId, {
  loadAs: me,
});

// Later, load deeper if needed
const { root } = await account.$jazz.ensureLoaded({
  resolve: {
    root: {
      myTasks: { $each: true },
    },
  },
});

const isRootLoaded = root !== null && root.$isLoaded === true;
if (isRootLoaded === true && root.myTasks) {
  // myTasks and each item are loaded
}
```

### waitForAllCoValuesSync()

```typescript
// Wait for all child CoValues to sync
await account.$jazz.waitForAllCoValuesSync();
```

## Subscriptions

### Subscribe to a CoValue

```typescript
const unsubscribe = Task.subscribe(taskId, {}, (task) => {
  const isLoaded = task !== null && task.$isLoaded === true;
  if (isLoaded === true) {
    console.log("Updated:", task.title);
  }
});

// Later
unsubscribe();
```

### Subscribe with Deep Resolution

```typescript
const unsub = Task.subscribe(
  taskId,
  {
    resolve: { subtasks: { $each: true } },
  },
  (task) => {
    const isLoaded = task !== null && task.$isLoaded === true;
    if (isLoaded === true && task.subtasks) {
      task.subtasks.forEach((subtask) => {
        const isSubtaskLoaded = subtask !== null && subtask.$isLoaded === true;
        if (isSubtaskLoaded === true) {
          console.log(subtask.title);
        }
      });
    }
  },
);
```

### Subscribe to an Instance

```typescript
const task = await Task.load(taskId);
const unsub = task.$jazz.subscribe({}, (updated) => {
  const isLoaded = updated !== null && updated.$isLoaded === true;
  if (isLoaded === true) {
    console.log(updated.title);
  }
});
```

## Subscription Patterns

### React Integration

```typescript
import { useAccount } from "jazz-tools/react";

function MyComponent() {
  const account = useAccount(MyAccount, {
    resolve: {
      root: { myTasks: { $each: true } }
    }
  });

  const isAccountLoaded = account !== null && account.$isLoaded === true;
  if (isAccountLoaded === false) {
    return <div>Loading...</div>;
  }

  const isRootLoaded = account.root !== null && account.root.$isLoaded === true;
  if (isRootLoaded === false) {
    return <div>Loading...</div>;
  }

  const tasks = account.root.myTasks;
  const isTasksLoaded = tasks !== null && tasks !== undefined && tasks.$isLoaded === true;
  if (isTasksLoaded === false) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {tasks.map((task) => {
        const isTaskLoaded = task !== null && task.$isLoaded === true;
        return isTaskLoaded === true ? (
          <div key={task.$jazz.id}>{task.title}</div>
        ) : null;
      })}
    </div>
  );
}
```

## Timeout Configuration

### Sync Timeouts

```typescript
await coValue.$jazz.waitForSync({
  timeout: 5000, // 5 seconds
});

await coValue.$jazz.waitForAllCoValuesSync({
  timeout: 10000, // 10 seconds
});
```

## Common Patterns

### Pattern 1: Create and Return

```typescript
async function createTask(title: string): Promise<co.loaded<typeof Task>> {
  const task = Task.create({ title, completed: false });
  await task.$jazz.waitForSync();
  return task;
}
```

### Pattern 2: Safe Access

```typescript
function getTaskTitle(task: co.loaded<typeof Task>): string {
  const isLoaded = task !== null && task.$isLoaded === true;
  if (isLoaded === false) {
    return "Loading...";
  }
  return task.title;
}
```

### Pattern 3: Nested Sync

```typescript
async function initializeSDK(account: co.loaded<typeof MyAccount>) {
  const group = Group.create({ owner: account });
  await group.$jazz.waitForSync();

  const sdk = SDK.create({ ... }, { owner: group });

  await account.$jazz.ensureLoaded({ resolve: { root: true } });
  account.root.$jazz.set("sdk", sdk);

  await sdk.$jazz.waitForSync();
  await account.$jazz.waitForSync();
}
```

### Pattern 4: Check Fields

```typescript
const isAuthLoaded = auth !== null && auth.$isLoaded === true;
const hasToken = auth.$jazz.has("token") === true;
const hasExpiresAt = auth.$jazz.has("expiresAt") === true;
const isBothFieldsPresent = hasToken && hasExpiresAt;

if (isBothFieldsPresent === false) {
  throw new Error("Auth fields missing");
}
```

## Regarde-Specific Patterns

### Initialize RegardeSDK

```typescript
export const initRegardeSDK = async (
  account: co.loaded<typeof RegardeAccount>,
  mode: "ensure" | "create",
): Promise<co.loaded<typeof RegardeSDK>> => {
  const isAccountValid = account !== null && account.$isLoaded === true;
  if (isAccountValid === false) {
    throw new Error("Account must be loaded");
  }

  // Ensure root is loaded
  const { root } = await account.$jazz.ensureLoaded({
    resolve: { root: { "regarde-sdk": true } },
  });

  const isRootLoaded = root !== null && root.$isLoaded === true;
  if (isRootLoaded === false) {
    throw new Error("Root not loaded");
  }

  const regardeSDK = root["regarde-sdk"];

  const isSdkLoaded =
    regardeSDK !== null &&
    regardeSDK !== undefined &&
    regardeSDK.$isLoaded === true;
  if (isSdkLoaded === false) {
    // Create SDK
    const regardeSDK = await createRegardeSDK(account);

    root.$jazz.set("regarde-sdk", regardeSDK);
    await regardeSDK.$jazz.waitForSync();
    await account.$jazz.waitForSync();
  }

  return regardeSDK;
};
```

### Token Refresh Pattern

```typescript
const isExpired = Date.now() > regardeSDK.auth.expiresAt;

if (isExpired === true) {
  const newToken = await getRegardeTokenAuth({
    loadedRegardeAuthCoMap: regardeSDK.auth,
  });

  if (newToken === null) {
    throw new Error("Token refresh failed");
  }

  await regardeSDK.auth.$jazz.waitForSync();
}
```

### Group Creation Pattern

```typescript
const userGroup = Group.create({ owner: account });
userGroup.addMember(registryGroup, "writer");
await userGroup.$jazz.waitForSync();
```

## Common Mistakes

### Mistake 1: Not Waiting for Sync

```typescript
// ✗ WRONG
const task = Task.create({ title: "Task" });
return task.$jazz.id; // May be undefined!

// ✓ CORRECT
const task = Task.create({ title: "Task" });
await task.$jazz.waitForSync();
return task.$jazz.id;
```

### Mistake 2: Checking Null Only

```typescript
// ✗ WRONG
if (coMap !== null) {
  console.log(coMap.field); // May still not be loaded
}

// ✓ CORRECT
if (coMap !== null && coMap.$isLoaded === true) {
  console.log(coMap.field); // Safe
}
```

### Mistake 3: Missing Nested Sync

```typescript
// ✗ WRONG
const task = Task.create({ title: "Task", subtasks: [] });
await task.$jazz.waitForSync();
const subtask = Subtask.create({ title: "Sub" });
task.subtasks.$jazz.push(subtask); // subtasks not loaded!

// ✓ CORRECT
const task = Task.create({ title: "Task", subtasks: [] });
await task.$jazz.waitForSync();
await task.$jazz.ensureLoaded({ resolve: { subtasks: true } });
const subtask = Subtask.create({ title: "Sub" });
task.subtasks.$jazz.push(subtask);
await subtask.$jazz.waitForSync();
```

### Mistake 4: Not Handling Unsubscribe

```typescript
// ✗ WRONG - memory leak
Task.subscribe(id, {}, (task) => { ... });

// ✓ CORRECT
const unsubscribe = Task.subscribe(id, {}, (task) => { ... });
// Later
unsubscribe();
```

### Mistake 5: Accessing After Error

```typescript
// ✗ WRONG
const task = await Task.load(id, { loadAs: account });
const isLoaded = task !== null && task.$isLoaded === true;
if (isLoaded === false) {
  console.error("Task not loaded");
}
console.log(task.title); // Crash!

// ✓ CORRECT
const task = await Task.load(id, { loadAs: account });
const isLoaded = task !== null && task.$isLoaded === true;
if (isLoaded === false) {
  console.error("Task not loaded");
  return; // Early return
}
console.log(task.title); // Safe
```

## Best Practices

### 1. Always Wait After Create

```typescript
const coMap = CoMap.create({ ... });
await coMap.$jazz.waitForSync();
```

### 2. Check $isLoaded Explicitly

```typescript
if (coMap !== null && coMap.$isLoaded === true) {
}
```

### 3. Chain Sync Waits for Nested

```typescript
root.$jazz.set("child", child);
await child.$jazz.waitForSync();
await root.$jazz.waitForSync();
```

### 4. Use ensureLoaded for Resolution

```typescript
const { field } = await coMap.$jazz.ensureLoaded({
  resolve: { field: { nested: true } },
});
```

### 5. Clean Up Subscriptions

```typescript
const unsub = CoMap.subscribe(...);
// Later
unsubscribe();
```

### 6. Use TypeScript Strict

```typescript
// Enable strict mode
// "strict": true in tsconfig.json
```

### 7. Export Types with 'T' Prefix

```typescript
export type TTask = co.loaded<typeof Task>;
```

### 8. Document Sync Requirements

```typescript
/**
 * Creates and syncs a new task.
 * @returns Promise that resolves when task is synced.
 */
async function createTask(...) { }
```

## See Also

- [Schemas](../schemas/README.md) - Defining data structures
- [Patterns](../patterns/README.md) - Implementation patterns
- [React Hooks](../react-hooks/README.md) - UI integration
