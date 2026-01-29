# Schemas Reference

Defining data structures with Jazz schemas.

## Overview

Schemas define the shape of your data. Jazz uses `jazz-tools` with Zod for validation.

## Schema Definition

### Basic CoMap

```typescript
import { co, z } from "jazz-tools";

const Task = co.map({
  title: z.string(),
  completed: z.boolean(),
  priority: z.number(),
});
```

### Primitive Types

Available via `z` from `jazz-tools`:

| Type                    | Description    | Example                                  |
| ----------------------- | -------------- | ---------------------------------------- |
| `z.string()`            | Text           | `name: z.string()`                       |
| `z.number()`            | Numbers        | `age: z.number()`                        |
| `z.boolean()`           | True/false     | `active: z.boolean()`                    |
| `z.date()`              | Dates          | `created: z.date()`                      |
| `z.literal(["a", "b"])` | Enum values    | `status: z.literal(["pending", "done"])` |
| `z.enum(["a", "b"])`    | Enum values    | `status: z.enum(["low", "high"])`        |
| `z.optional(T)`         | Optional field | `nickname: z.optional(z.string())`       |

### Nested CoValues

Reference other schemas directly:

```typescript
const Subtask = co.map({
  title: z.string(),
});

const Task = co.map({
  title: z.string(),
  subtasks: co.list(Subtask),
});
```

### Optional CoValue Fields

```typescript
const Task = co.map({
  title: z.string(),
  parent: co.optional(Task), // Optional Task
  subtasks: co.list(Subtask).optional(), // Optional List
});
```

## Account Schema

Define custom account structure:

```typescript
const MyAppRoot = co.map({
  myData: co.list(MyData),
});

const MyAppAccount = co.account({
  root: MyAppRoot,
  profile: co.profile(),
});
```

With custom profile:

```typescript
const MyProfile = co.profile({
  name: z.string(),
  avatar: co.image(),
});

const MyAppAccount = co.account({
  root: MyAppRoot,
  profile: MyProfile,
});
```

## Profile Schema

```typescript
const MyProfile = co.profile({
  name: z.string(), // Required
  bio: z.string(),
  avatar: co.image(),
});
```

## Schema with Migration

Run code when account is loaded:

```typescript
const MyAppAccount = co
  .account({
    root: MyAppRoot,
    profile: MyProfile,
  })
  .withMigration(async (account) => {
    // Initialize root if missing
    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", {
        myData: [],
      });
    }

    // Initialize profile if missing
    if (!account.$jazz.has("profile")) {
      const publicGroup = Group.create({ owner: account });
      publicGroup.makePublic();

      account.$jazz.set(
        "profile",
        MyProfile.create({ name: "New User" }, publicGroup),
      );
    }
  });
```

## Schema Migration Best Practices

### Always Check has()

```typescript
// ✓ Good
if (!account.$jazz.has("field")) {
  account.$jazz.set("field", defaultValue);
}

// ✗ Bad (will overwrite existing)
account.$jazz.set("field", defaultValue);
```

### Load Before Checking

```typescript
// For nested fields, ensure loaded first
const { root } = await account.$jazz.ensureLoaded({
  resolve: { root: true },
});

if (!root.$jazz.has("newField")) {
  root.$jazz.set("newField", []);
}
```

### Version Tracking

```typescript
const MyCoMap = co
  .map({
    version: z.literal([1, 2, 3]),
    // ... other fields
  })
  .withMigration((coMap) => {
    if (coMap.version === 1) {
      // Migrate from v1 to v2
      coMap.$jazz.set("newField", defaultValue);
      coMap.$jazz.set("version", 2);
    }
  });
```

### Add Only, Don't Change

```typescript
// ✓ Good: Add new optional field
const Task = co.map({
  title: z.string(),
  completed: z.boolean(),
  priority: z.optional(z.number()), // New field, optional
});

// ✗ Bad: Changing type
const Task = co.map({
  title: z.string(),
  completed: z.boolean(),
  priority: z.number(), // Required - breaks existing data!
});
```

## Type Extraction

### Loaded Type

```typescript
type TTask = co.loaded<typeof Task>;

function processTask(task: TTask) {
  // Task has all fields loaded
  console.log(task.title);
}
```

### Input Type

```typescript
type TTaskInput = co.input<typeof Task>;

function createTask(input: TTaskInput) {
  return Task.create(input);
}
```

### With Resolution

```typescript
type TTaskWithSubtasks = co.loaded<typeof Task, { subtasks: { $each: true } }>;

function processTask(task: TTaskWithSubtasks) {
  // task.subtasks is fully loaded
  task.subtasks.forEach((s) => console.log(s.title));
}
```

## Schema Union

Discriminated unions for polymorphic types:

```typescript
const TextContent = co.map({
  type: z.literal("text"),
  text: z.string(),
});

const ImageContent = co.map({
  type: z.literal("image"),
  image: co.image(),
});

const ContentUnion = co.discriminatedUnion("type", [TextContent, ImageContent]);
```

## Complex Objects

For immutable complex data:

```typescript
const Position = co.map({
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

const Bounds = co.map({
  rect: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});
```

## Regarde-Specific Schemas

### RegardeAccount

```typescript
const RegardeAccount = co
  .account({
    profile: co.profile(),
    root: RegardeRoot,
  })
  .withMigration(async (account) => {
    if (!account.$jazz.has("profile")) {
      const publicGroup = Group.create({ owner: account });
      publicGroup.makePublic();
      account.$jazz.set(
        "profile",
        co.profile().create({ name: "Regarde User" }, publicGroup),
      );
    }
  });
```

### RegardeSDK

```typescript
const RegardeSDK = co.map({
  auth: RegardeAuth,
  myApps: co.list(App),
  myPayments: PaymentSchema,
  myUserHandle: UserHandle,
  version: z.number(),
});
```

### RegardeAuth

```typescript
const RegardeAuth = co
  .map({
    token: z.string(),
    expiresAt: z.number(),
  })
  .withMigration((regardeAuth) => {
    if (!regardeAuth.$jazz.has("token")) {
      regardeAuth.$jazz.set("token", generateRegardeToken());
    }
    if (!regardeAuth.$jazz.has("expiresAt")) {
      regardeAuth.$jazz.set("expiresAt", 0);
    }
  });
```

### App Schema

```typescript
const App = co.map({
  name: z.string(),
  description: z.string(),
  ownerAccountId: z.string(),
  paymentProvider: z.enum(["lemonsqueezy", "stripe"]),
  isEnabled: z.boolean(),
  createdAt: z.number(),
  metadata: co.record(z.string(), z.string()),
  webhookSecret: z.string(),
  payments: AppPaymentsSchema,
});
```

### PaymentEvent

```typescript
const PaymentEvent = co.map({
  amount: z.string(),
  app: z.string(),
  currency: z.string(),
  metadata: co.record(z.string(), z.string()),
  prefixedProviderEventUUID: z.string(),
  paymentStatus: z.enum(["pending", "completed", "failed", "cancelled"]),
  timestamp: z.number(),
  userAccount: z.string(),
});
```

## Best Practices

### 1. Use Descriptive Field Names

```typescript
// ✓ Good
const Order = co.map({
  orderId: z.string(),
  customerName: z.string(),
  totalAmount: z.number(),
});

// ✗ Bad
const Order = co.map({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
});
```

### 2. Document Schema Purpose

```typescript
/**
 * User application configuration.
 * Stores app metadata and payment settings.
 */
const App = co.map({
  name: z.string(),
  // ...
});
```

### 3. Export Types

```typescript
export const Task = co.map({ ... });
export type TTask = co.loaded<typeof Task>;
export type TTaskInput = co.input<typeof Task>;
```

### 4. Keep Schemas Simple

```typescript
// ✓ Good: Separate related CoMaps
const User = co.map({
  name: z.string(),
});

const UserSettings = co.map({
  theme: z.string(),
});

// ✗ Bad: Too many unrelated fields
const User = co.map({
  name: z.string(),
  theme: z.string(),
  notificationEnabled: z.boolean(),
  // ... 20 more fields
});
```

### 5. Version Your SDK Schemas

```typescript
const RegardeSDK = co.map({
  // ... fields
  version: z.number(), // Track schema version
});
```

### 6. Use Constants for Schema IDs

```typescript
// constants.ts
export const REGARDE_REGISTRY_GROUP = "co_zoppoxWWJaHYKPgSgUkuCCXQX21";

// usage.ts
const group = await co
  .group()
  .load(REGARDE_REGISTRY_GROUP, { loadAs: account });
```

## See Also

- [Migrations](./migrations.md) - How to evolve existing schema data over time
- [Sync Safety](../sync-safety/README.md) - Critical patterns for data consistency
- [Groups & Permissions](../groups-permissions/README.md) - Access control for your schemas
