# CoValues Reference

Core Jazz data types used in Regarde SDK.

## Overview

CoValues are "Collaborative Values" - data structures that sync across devices in real-time. Every CoValue has a unique ID and tracks full edit history.

## Regarde-Used CoValues

| Type              | Purpose             | Regarde Usage                              |
| ----------------- | ------------------- | ------------------------------------------ |
| `co.map({...})`   | Key-value objects   | RegardeSDK, RegardeAuth, App, PaymentEvent |
| `co.list(T)`      | Ordered collections | myApps list                                |
| `co.record(K, V)` | Dynamic key-value   | PaymentEvent maps                          |

## CoMap

Key-value objects. Most common CoValue type in Regarde.

### Declaration

```typescript
import { co, z } from "jazz-tools";

// Struct-like (fixed fields)
const App = co.map({
  name: z.string(),
  isEnabled: z.boolean(),
  paymentProvider: z.enum(["lemonsqueezy", "stripe"]),
});

// Record-like (dynamic keys)
const Metadata = co.record(z.string(), z.string());
```

### Creating

```typescript
// With default owner (current account)
const app = App.create({
  name: "My App",
  isEnabled: false,
  paymentProvider: "lemonsqueezy",
});

// With specific group
const group = Group.create({ owner: account });
const sharedApp = App.create(
  { name: "Shared App", isEnabled: true, paymentProvider: "stripe" },
  { owner: group },
);

// After create, ALWAYS wait for sync
await sharedApp.$jazz.waitForSync();
```

### Reading

```typescript
// Direct property access
console.log(app.name); // "My App"
console.log(app.isEnabled); // false

// Check $isLoaded first - use explicit boolean check
const isLoaded = app !== null && app.$isLoaded === true;
if (isLoaded === true) {
  console.log(app.name);
}

// Optional fields need checks
const Person = co.map({
  name: z.string(),
  nickname: z.optional(z.string()),
});

const hasNickname = person.nickname !== null && person.nickname !== undefined;
if (hasNickname === true) {
  console.log(person.nickname);
}
```

### Updating

```typescript
// Update single field
app.$jazz.set("isEnabled", true);

// Update from CoValue
app.$jazz.set("metadata", Metadata.create({ key: "value" }));

// Update from JSON (Jazz creates CoValue)
app.$jazz.set("metadata", { key: "value" });

// Delete field
app.$jazz.set("nickname", undefined);

// Delete key (record CoMaps)
metadata.$jazz.delete("key");
```

### Recursive References

Use getters to avoid temporal dead zone:

```typescript
const Category = co.map({
  name: z.string(),
  get parent(): co.Optional<typeof Category> {
    return co.optional(Category);
  },
});
```

### Partial and Pick

```typescript
// Make all fields optional
const AppDraft = App.partial();

// Select specific fields
const AppSummary = App.pick({ name: true, isEnabled: true });
```

### Type Extraction

```typescript
// Use explicit type extraction with 'T' prefix
type TApp = co.loaded<typeof App>;
type TAppInput = co.input<typeof App>;
```

## CoList

Ordered collections (arrays). Used for `myApps` in RegardeSDK.

### Declaration

```typescript
import { co, z } from "jazz-tools";

const ListOfApps = co.list(App);
const ListOfStrings = co.list(z.string());
```

### Creating

```typescript
// Empty list
const apps = ListOfApps.create([], { owner: group });

// With initial items
const apps = ListOfApps.create([
  { name: "App 1", isEnabled: true, paymentProvider: "lemonsqueezy" },
  { name: "App 2", isEnabled: false, paymentProvider: "stripe" },
]);

await apps.$jazz.waitForSync();
```

### Reading

```typescript
// By index
const firstApp = apps[0];

// Check loaded before accessing
const isFirstLoaded = firstApp !== null && firstApp.$isLoaded === true;
if (isFirstLoaded === true) {
  console.log(firstApp.name);
}

// Length
console.log(apps.length); // 2

// Iteration with explicit checks
apps.forEach((app, index) => {
  const isAppLoaded = app !== null && app.$isLoaded === true;
  if (isAppLoaded === true) {
    console.log(app.name);
  }
});

// Array methods
const enabledApps = apps.filter((a) => {
  const isLoaded = a !== null && a.$isLoaded === true;
  return isLoaded === true && a.isEnabled === true;
});
```

### Updating

```typescript
// Add items
apps.$jazz.push({
  name: "New App",
  isEnabled: false,
  paymentProvider: "lemonsqueezy",
});
apps.$jazz.unshift({
  name: "First App",
  isEnabled: true,
  paymentProvider: "stripe",
});

// Replace
apps.$jazz.set(0, {
  name: "Updated",
  isEnabled: true,
  paymentProvider: "lemonsqueezy",
});

// Remove
apps.$jazz.remove(0); // By index
apps.$jazz.remove((a) => {
  const isLoaded = a !== null && a.$isLoaded === true;
  return isLoaded === true && a.isEnabled === false;
}); // By predicate
apps.$jazz.pop();
apps.$jazz.shift();
apps.$jazz.splice(1, 2); // Remove 2 items starting at index 1

// Retain only matching
apps.$jazz.retain((a) => {
  const isLoaded = a !== null && a.$isLoaded === true;
  return isLoaded === true && a.isEnabled === true;
});
```

### Soft Deletion

```typescript
const App = co.map({
  name: z.string(),
  deleted: z.optional(z.boolean()),
});

function getActiveApps(list: co.loaded<typeof ListOfApps, { $each: true }>) {
  const isListLoaded = list !== null && list.$isLoaded === true;
  if (isListLoaded === false) {
    return [];
  }

  return list.filter((a) => {
    const isAppLoaded = a !== null && a.$isLoaded === true;
    return isAppLoaded === true && a.deleted !== true;
  });
}
```

## CoRecord

Dynamic key-value stores with arbitrary string keys. Used for payment event maps in Regarde.

### Declaration

```typescript
import { co, z } from "jazz-tools";

// Maps provider UUIDs to PaymentEvent IDs
const PaymentEventMap = co.record(z.string(), z.string());

// Maps app IDs to payment maps
const PaymentByAppMap = co.record(z.string(), PaymentEventMap);
```

### Creating

```typescript
const payments = PaymentEventMap.create({
  ls_123: "co_event123",
  ls_456: "co_event456",
});

await payments.$jazz.waitForSync();
```

### Reading

```typescript
// Bracket notation
const eventId = payments["ls_123"];

// Check if key exists
const hasKey = "ls_123" in payments;

// Iterate keys
Object.keys(payments).forEach((key) => {
  console.log(key, payments[key]);
});

// Iterate entries
Object.entries(payments).forEach(([key, value]) => {
  console.log(key, value);
});
```

### Updating

```typescript
// Set key
payments.$jazz.set("ls_789", "co_event789");

// Delete key
payments.$jazz.delete("ls_123");
```

### Set-like Collections

Use CoRecord with CoValue IDs as keys:

```typescript
const Chat = co.map({
  participants: co.record(z.string(), User),
});

// Add participant
chat.participants.$jazz.set(userId, user);

// Get participant count
const count = Object.keys(chat.participants).length;

// Check membership
const isMember = userId in chat.participants;
```

## Schema Unions

Discriminated unions for polymorphic data.

### Declaration

```typescript
const TextContent = co.map({
  type: z.literal("text"),
  text: z.string(),
});

const ImageContent = co.map({
  type: z.literal("image"),
  url: z.string(),
});

const ContentUnion = co.discriminatedUnion("type", [TextContent, ImageContent]);
```

### Creating

```typescript
// From specific schema
const text = TextContent.create({ type: "text", text: "Hello" });

// From JSON (Jazz infers type)
const contents = ContentUnion.create([
  { type: "text", text: "Hello" },
  { type: "image", url: "..." },
]);
```

### Loading

```typescript
// Load without knowing type
const content = await ContentUnion.load(contentId);

// Subscribe
const unsubscribe = ContentUnion.subscribe(contentId, {}, (content) => {
  // Type narrowing needed for specific properties
  if (content.type === "text") {
    console.log(content.text);
  }
});
```

### Limitations

- No `$jazz.ensureLoaded` on union (narrow first)
- No `$jazz.set` on union (use `$jazz.applyDiff`)
- No `$jazz.subscribe` on union (use union's `subscribe`)

## Best Practices

### Always Use Groups for Ownership

```typescript
// ✓ Good
const group = Group.create({ owner: account });
const coMap = MyCoMap.create({ ... }, { owner: group });

// ✗ Bad (deprecated)
const coMap = MyCoMap.create({ ... }, account);
```

### Always Wait for Sync

```typescript
// ✓ Good
const coMap = MyCoMap.create({ ... });
await coMap.$jazz.waitForSync();

// ✗ Bad
const coMap = MyCoMap.create({ ... });
const id = coMap.$jazz.id; // May be undefined
```

### Check $isLoaded with Explicit Boolean

```typescript
// ✓ Good - explicit boolean check
const isLoaded = coMap !== null && coMap.$isLoaded === true;
if (isLoaded === true) {
  console.log(coMap.field);
}

// ✗ Bad - implicit truthiness
console.log(coMap.field); // May crash
```

### Use Explicit Type Extraction

```typescript
// ✓ Good - use 'T' prefix for types
type TApp = co.loaded<typeof App>;
type TAppInput = co.input<typeof App>;

// Use in function signatures
function processApp(app: TApp): void {
  // Full typing available
}
```

### Boolean Pattern (Explicit Checks)

```typescript
// ✓ Good - explicit comparisons
const hasToken = auth.token !== null && auth.token.length > 0;
const isExpired = Date.now() > auth.expiresAt;
const isBothFieldsPresent = hasToken && isExpired === false;

if (isBothFieldsPresent === false) {
  throw new Error("Auth incomplete");
}

// ✗ Bad - implicit truthiness
if (!auth.token || !auth.expiresAt) {
  throw new Error("Auth incomplete");
}
```
