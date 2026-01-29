# CoValues API Reference

Complete API for Jazz CoValues used in Regarde SDK.

## CoMap API

### Static Methods

#### `CoMap.create(init, options?)`

Create a new CoMap instance.

```typescript
const app = App.create(
  { name: "My App", isEnabled: false, paymentProvider: "lemonsqueezy" },
  { owner: group },
);
```

Parameters:

- `init`: Object with field values
- `options`: `{ owner?: Group }`

Returns: `Loaded<CoMap>`

#### `CoMap.load(id, options?)`

Load a CoMap by ID.

```typescript
const app = await App.load(appId, {
  loadAs: account,
  resolve: { metadata: true },
});
```

Parameters:

- `id`: `ID<string>` - CoValue ID
- `options`:
  - `loadAs`: Account - who is loading
  - `resolve`: Resolution query (optional)

Returns: `Promise<CoMap | undefined>`

#### `CoMap.subscribe(id, options, callback)`

Subscribe to updates.

```typescript
const unsubscribe = App.subscribe(appId, {}, (app) => {
  const isLoaded = app !== null && app.$isLoaded === true;
  if (isLoaded === true) {
    console.log("Updated:", app.name);
  }
});

// Later
unsubscribe();
```

Parameters:

- `id`: `ID<string>`
- `options`: Subscription options
- `callback`: `(value: CoMap) => void`

Returns: `() => void` - unsubscribe function

### Instance Methods

#### `$jazz.id`

CoValue ID (starts with `co_`).

#### `$jazz.owner`

Owner Group.

#### `$isLoaded`

Whether the CoMap is loaded and ready to access.

#### `$jazz.has(key)`

Check if a field exists.

```typescript
const hasField = app.$jazz.has("description") === true;
if (hasField === true) {
  console.log(app.description);
}
```

#### `$jazz.set(key, value)`

Set a field value.

```typescript
app.$jazz.set("isEnabled", true);
```

#### `$jazz.delete(key)`

Delete a field (for record CoMaps).

```typescript
metadata.$jazz.delete("key");
```

#### `$jazz.ensureLoaded({ resolve })`

Ensure referenced CoValues are loaded.

```typescript
const app = await app.$jazz.ensureLoaded({
  resolve: { metadata: { nested: true } },
});
```

#### `$jazz.waitForSync(options?)`

Wait for sync to complete.

```typescript
await app.$jazz.waitForSync();
await app.$jazz.waitForSync({ timeout: 5000 });
```

#### `$jazz.waitForAllCoValuesSync()`

Wait for all child CoValues to sync.

```typescript
await account.$jazz.waitForAllCoValuesSync();
```

#### `$jazz.subscribe(options, callback)`

Subscribe to this specific instance.

```typescript
const unsub = app.$jazz.subscribe({}, (updated) => {
  const isLoaded = updated !== null && updated.$isLoaded === true;
  if (isLoaded === true) {
    console.log(updated.name);
  }
});
```

### Type Helpers

#### `co.loaded<typeof CoMap, Resolve?>`

Extract loaded type.

```typescript
type TApp = co.loaded<typeof App>;
type TAppWithMetadata = co.loaded<typeof App, { metadata: true }>;
```

#### `co.input<typeof CoMap>`

Extract input type (for `.create()`).

```typescript
type TAppInput = co.input<typeof App>;
```

#### `co.Optional<typeof CoMap>`

Make a CoValue type optional.

```typescript
const AppWithOptional = co.map({
  metadata: co.optional(Metadata),
});
```

## CoList API

### Static Methods

#### `co.list(ItemType).create(init, options?)`

```typescript
const list = co.list(App).create([], { owner: group });
const list = co
  .list(App)
  .create([
    { name: "App 1", isEnabled: true, paymentProvider: "lemonsqueezy" },
  ]);
```

#### `co.list(ItemType).load(id, options?)`

```typescript
const list = await co.list(App).load(listId, {
  resolve: { $each: true },
});
```

#### `co.list(ItemType).subscribe(id, options, callback)`

```typescript
const unsub = co.list(App).subscribe(
  listId,
  {
    resolve: { $each: true },
  },
  (list) => {
    const isLoaded = list !== null && list.$isLoaded === true;
    if (isLoaded === true) {
      console.log(list.length);
    }
  },
);
```

### Instance Methods

#### `$jazz.push(...items)`

Add items to end.

```typescript
list.$jazz.push({
  name: "New App",
  isEnabled: false,
  paymentProvider: "stripe",
});
list.$jazz.push(app1, app2);
```

#### `$jazz.unshift(...items)`

Add items to beginning.

```typescript
list.$jazz.unshift({
  name: "First App",
  isEnabled: true,
  paymentProvider: "lemonsqueezy",
});
```

#### `$jazz.set(index, item)`

Replace item at index.

```typescript
list.$jazz.set(0, {
  name: "Updated",
  isEnabled: true,
  paymentProvider: "stripe",
});
```

#### `$jazz.remove(index | predicate)`

Remove item(s).

```typescript
list.$jazz.remove(0); // By index
list.$jazz.remove((app) => {
  const isLoaded = app !== null && app.$isLoaded === true;
  return isLoaded === true && app.isEnabled === false;
}); // By predicate
```

#### `$jazz.retain(predicate)`

Keep only matching items.

```typescript
list.$jazz.retain((app) => {
  const isLoaded = app !== null && app.$isLoaded === true;
  return isLoaded === true && app.isEnabled === true;
});
```

#### `$jazz.pop()`

Remove and return last item.

#### `$jazz.shift()`

Remove and return first item.

#### `$jazz.splice(start, deleteCount, ...items)`

Remove and/or insert items.

```typescript
list.$jazz.splice(1, 2, newItem);
```

#### `length`

Get list length.

#### `[index]`

Access by index.

```typescript
const first = list[0];
const isLoaded = first !== null && first.$isLoaded === true;
if (isLoaded === true) {
  console.log(first.name);
}
```

## CoRecord API

### Static Methods

#### `co.record(keyType, valueType).create(init, options?)`

```typescript
const payments = co.record(z.string(), z.string()).create({
  ls_123: "co_event123",
});
```

### Instance Methods

#### `$jazz.set(key, value)`

Set key-value pair.

```typescript
payments.$jazz.set("ls_456", "co_event456");
```

#### `$jazz.delete(key)`

Delete key.

```typescript
payments.$jazz.delete("ls_123");
```

#### Object.keys(record)

Get all keys.

```typescript
const keys = Object.keys(payments);
```

#### Object.values(record)

Get all values.

```typescript
const values = Object.values(payments);
```

#### Object.entries(record)

Get key-value pairs.

```typescript
const entries = Object.entries(payments);
```

#### `[key]`

Access by key.

```typescript
const eventId = payments["ls_123"];
```

## Group API

### Static Methods

#### `Group.create(options?)`

```typescript
const group = Group.create({ owner: account });
```

#### `co.group().load(id, options?)`

```typescript
const group = await co.group().load(groupId, { loadAs: account });
```

### Instance Methods

#### `addMember(account, role)`

Add member with role.

```typescript
group.addMember(otherAccount, "writer");
// roles: "admin", "manager", "writer", "writeOnly", "reader"
```

#### `removeMember(account)`

Remove member.

```typescript
group.removeMember(otherAccount);
```

#### `makePublic()`

Make readable by everyone.

```typescript
group.makePublic();
```

#### `getDirectMembers()`

Get direct member list.

#### `members`

Get all members (including from nested groups).

#### `myRole`

Get current account's role.

#### `canRead(coValue)` / `canWrite(coValue)` / `canManage(coValue)` / `canAdmin(coValue)`

Check permissions.

```typescript
const canWrite = account.canWrite(coValue);
if (canWrite === true) {
  coValue.$jazz.set("field", value);
}
```

## Account API

### Static Methods

#### `co.account().getMe()`

Get current account.

```typescript
const me = co.account().getMe();
```

#### `co.account().load(id, options?)`

Load account by ID.

```typescript
const account = await co.account().load(accountId);
```

#### `co.account().subscribe(id, options, callback)`

```typescript
const unsub = co.account().subscribe(
  accountId,
  {
    resolve: { profile: true },
  },
  (account) => {
    const isLoaded = account !== null && account.$isLoaded === true;
    if (isLoaded === true) {
      console.log(account.profile.name);
    }
  },
);
```

### Instance Methods

#### `$jazz.id`

Account ID.

#### `profile`

Public profile CoMap.

#### `root`

Private root CoMap.

#### `canRead(coValue)` / `canWrite(coValue)` / etc.

Permission checks.

## Type Definitions

### Loaded<T, Resolve>

```typescript
type TApp = co.loaded<typeof App>;
type TAppWithMetadata = co.loaded<typeof App, { metadata: true }>;
type TAppDeep = co.loaded<typeof App, { metadata: { nested: true } }>;
```

### ID<T>

CoValue ID type.

```typescript
import { type ID } from "jazz-tools";

function loadApp(id: ID<string>): Promise<TApp | undefined> {
  return App.load(id, { loadAs: account });
}
```

### Resolution Queries

```typescript
// Shallow
{
  resolve: {
    field: true;
  }
}

// Deep
{
  resolve: {
    field: {
      nested: true;
    }
  }
}

// List items
{
  resolve: {
    listField: {
      $each: true;
    }
  }
}

// List items with nested
{
  resolve: {
    listField: {
      $each: {
        nested: true;
      }
    }
  }
}
```

## Loading Pattern with Validation

```typescript
async function loadWithValidation(id: string): Promise<TApp | null> {
  const app = await App.load(id, { loadAs: account });

  const isLoaded = app !== null && app.$isLoaded === true;
  if (isLoaded === false) {
    return null;
  }

  const hasRequiredFields =
    app.$jazz.has("name") === true && app.$jazz.has("isEnabled") === true;

  if (hasRequiredFields === false) {
    return null;
  }

  return app;
}
```
