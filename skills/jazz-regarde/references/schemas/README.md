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

## Naming Conventions

### Type Prefixes

Use consistent prefixes for Jazz schema types:

| Convention            | Pattern                                     | Example                                                   |
| --------------------- | ------------------------------------------- | --------------------------------------------------------- |
| **Schema Definition** | PascalCase, no prefix                       | `const PaymentEvent = co.map({...})`                      |
| **Loaded Type**       | PascalCase with `T` prefix                  | `type TPaymentEvent = co.loaded<typeof PaymentEvent>`     |
| **Input Type**        | PascalCase with `T` prefix + `Input` suffix | `type TPaymentEventInput = co.input<typeof PaymentEvent>` |

### Examples

```typescript
// Schema definition (no prefix)
export const PaymentEvent = co.map({
  amount: z.string(),
  currency: z.string(),
  status: z.enum(["pending", "completed", "failed"]),
});

// Loaded type (T prefix)
export type TPaymentEvent = co.loaded<typeof PaymentEvent>;

// Input type (T prefix + Input suffix)
export type TPaymentEventInput = co.input<typeof PaymentEvent>;

// Usage in function signatures
function processPayment(event: TPaymentEvent) {
  // All fields are guaranteed to be loaded
  console.log(event.amount, event.currency);
}

function createPayment(input: TPaymentEventInput) {
  return PaymentEvent.create(input, { owner: group });
}
```

### Why This Convention?

1. **T prefix** makes type names searchable and distinct from runtime values
2. **Input suffix** clarifies this is the creation input type vs loaded instance

## Decision Tree: Schema vs TSchema

Use this decision tree to know when to use `Schema` vs `TSchema`:

```
Do you need to reference the schema?
├── Defining the schema structure?
│   └── Use Schema (e.g., const App = co.map({...}))
├── Creating a new instance?
│   └── Use Schema.create() (e.g., App.create(input, {owner: group}))
├── Loading from ID?
│   └── Use Schema.load() (e.g., App.load(id, {loadAs: me}))
├── Subscribing to changes?
│   └── Use Schema.subscribe() (e.g., App.subscribe(id, {}, callback))
├── Typing a loaded instance?
│   ├── Function parameter (accepts loaded CoMap)?
│   │   └── Use TSchema (e.g., function process(app: TApp))
│   ├── Function return type (returns loaded CoMap)?
│   │   └── Use TSchema (e.g., function load(): Promise<TApp>)
│   ├── Type guard/filter?
│   │   └── Use TSchema (e.g., (app): app is TApp => ...)
│   └── Inline type with co.loaded?
│       └── Use co.loaded<typeof Schema> (e.g., const app: co.loaded<typeof App>)
└── Referencing in another schema?
    └── Use Schema directly (e.g., payments: AppPaymentsSchema)
```

### When to Export TSchema Types

**ALWAYS export TSchema for any CoMap that:**

- Will be passed between functions
- Needs type-safe access to its fields
- Is part of the public SDK API

**Examples from the codebase:**

```typescript
// Good: TApp used in function parameters
async function processPayment(app: TApp, event: TPaymentEvent): Promise<void> {
  // TypeScript knows app.name, app.payments, etc. are accessible
  console.log(app.name);
}

// Good: TApp used in return types
async function loadApp(appId: string): Promise<TApp | undefined> {
  const app = await App.load(appId, { loadAs: me });
  const isLoaded = app !== null && app.$isLoaded === true;
  if (isLoaded === false) return undefined;
  return app; // Returns TApp
}

// Good: TApp used in type guards
const loadedApps = apps.filter((app): app is TApp => {
  return app !== null && app.$isLoaded === true;
});
```

### Why TSchema Types Are Essential

1. **Type Safety**: `TApp` ensures only loaded instances can be passed to functions that access fields
2. **Self-Documentation**: `function process(app: TApp)` clearly signals "this function needs a loaded app"
3. **Maintainability**: One import (`TApp`) vs verbose `co.loaded<typeof App>` everywhere
4. **Refactoring Safety**: TypeScript catches all usages when schema changes

### Comparison: With vs Without TSchema

```typescript
// WITHOUT TSchema - verbose and error-prone
async function processPayment(
  app: co.loaded<typeof App>,
  event: co.loaded<typeof PaymentEvent>,
): Promise<co.loaded<typeof App>> {
  // Verbose, easy to mistype, hard to maintain
}

// WITH TSchema - clean and maintainable
async function processPayment(app: TApp, event: TPaymentEvent): Promise<TApp> {
  // Clean, consistent, easy to refactor
}
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

## TypeScript Narrowing Best Practices

### Never Use Indexed Access Types for CoMap Fields

**Problem**: Using indexed access types like `TSchema["field"]` in function parameters causes TypeScript widening issues with Jazz CoMaps.

```typescript
// DON'T DO THIS - causes type widening issues
type TBadParameter = TApp["payments"]; // Widens to union type

function badProcessPayments(payments: TApp["payments"]) {
  // TypeScript can't narrow properly here
  if (payments.$isLoaded) {
    // payments might still have union type
  }
}
```

**Solution**: Always use `co.loaded<typeof Schema>` pattern with explicit checks:

```typescript
// DO THIS INSTEAD - proper narrowing
import { co } from "jazz-tools";
import { AppPaymentsSchema } from "./schemas";

// Define the type using co.loaded
type TAppPayments = co.loaded<typeof AppPaymentsSchema>;

function processPayments(payments: TAppPayments) {
  // Explicit boolean check for proper narrowing
  const isLoaded = payments !== null && payments.$isLoaded === true;

  if (isLoaded === false) {
    throw new Error("Payments not loaded");
  }

  // Now TypeScript knows payments is fully loaded
  payments.all.forEach((payment) => {
    console.log(payment.amount);
  });
}
```

### Always Check `$isLoaded === true` Before Accessing Nested CoMaps

**Critical Pattern**: When accessing nested CoMap properties, you MUST check `$isLoaded === true` explicitly:

```typescript
// DON'T DO THIS - unsafe access
function unsafeAccess(app: TApp) {
  // Type error: app.payments might not be loaded
  const count = app.payments.all.length; // Error
}

// DO THIS - safe access with proper checks
function safeAccess(app: TApp) {
  // Check app is loaded first
  const isAppLoaded = app !== null && app.$isLoaded === true;
  if (isAppLoaded === false) {
    throw new Error("App not loaded");
  }

  // Check nested payments is loaded
  const isPaymentsLoaded =
    app.payments !== null && app.payments.$isLoaded === true;

  if (isPaymentsLoaded === false) {
    throw new Error("Payments not loaded");
  }

  // NOW safe to access
  const count = app.payments.all.length; // Type-safe
}
```

### Complete Example: Nested CoMap Access

```typescript
import { co } from "jazz-tools";
import { App, PaymentEvent, ProcessedProviderEvents } from "./schemas";

type TApp = co.loaded<typeof App>;
type TPaymentEvent = co.loaded<typeof PaymentEvent>;
type TProcessedEvents = co.loaded<typeof ProcessedProviderEvents>;

async function handlePaymentEvent(
  app: TApp,
  paymentEvent: TPaymentEvent,
  processedEvents: TProcessedEvents,
): Promise<void> {
  // Step 1: Validate all inputs are loaded with explicit checks
  const isAppLoaded = app !== null && app.$isLoaded === true;
  if (isAppLoaded === false) {
    throw new Error("App must be loaded");
  }

  const isPaymentLoaded =
    paymentEvent !== null && paymentEvent.$isLoaded === true;
  if (isPaymentLoaded === false) {
    throw new Error("Payment event must be loaded");
  }

  const isProcessedLoaded =
    processedEvents !== null && processedEvents.$isLoaded === true;
  if (isProcessedLoaded === false) {
    throw new Error("Processed events must be loaded");
  }

  // Step 2: Check nested CoMaps within app
  const isPaymentsLoaded =
    app.payments !== null && app.payments.$isLoaded === true;
  if (isPaymentsLoaded === false) {
    throw new Error("App payments must be loaded");
  }

  // Step 3: Now safe to perform operations
  const eventId = paymentEvent.prefixedProviderEventUUID;

  // Check idempotency
  if (processedEvents.all.has(eventId) === false) {
    // Add to processed events
    processedEvents.all.$jazz.set(eventId, paymentEvent);
    await processedEvents.$jazz.waitForSync();

    // Add to app payments
    app.payments.all.$jazz.set(paymentEvent.$jazz.id, paymentEvent);
    await app.payments.$jazz.waitForSync();
  }
}
```

### Why These Rules Matter

1. **Type Safety**: `co.loaded<typeof Schema>` preserves the exact schema structure
2. **Runtime Safety**: Explicit `$isLoaded === true` checks prevent accessing unloaded data
3. **Jazz Best Practices**: These patterns align with how Jazz handles lazy loading and sync
4. **Future-Proof**: Prevents bugs when schema structures change

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
  auth: RegardeTokenAuth,
  myApps: co.list(App),
  myPayments: PaymentSchema,
  myUserHandle: UserHandle,
  version: z.number(),
});
```

### RegardeTokenAuth

```typescript
const RegardeTokenAuth = co
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
