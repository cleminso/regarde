# Jazz Patterns

Practical patterns for working with Jazz in Regarde.

## Sync Safety

### Write-Wait-Use Pattern

Always wait for sync after creating or modifying CoValues before reading them.

```typescript
// Create CoMap
const newApp = RegardeApp.create({
  name: "My App",
  provider: "stripe",
}, { owner: userGroup });

// REQUIRED: Wait for sync before reading
await newApp.$jazz.waitForSync();

// Now safe to read
console.log(newApp.$jazz.id);
```

### Create-Set-Sync Pattern

When adding CoValues to parent structures:

```typescript
const newSDK = RegardeSDK.create({ version: 4 }, { owner: userGroup });
await newSDK.$jazz.waitForSync();

root.$jazz.set("regarde-sdk", newSDK);
await root.$jazz.waitForSync();
await account.$jazz.waitForSync();
```

### Property-Specific Sync

Wait for specific properties when needed:

```typescript
await app.$jazz.waitForSync({ property: "name" });
```

## Authentication Flow (7 Steps)

1. **Token Generation** - Client generates 16-char secure random string
2. **Token Storage** - Stored in `RegardeTokenAuth` CoMap with 24h expiration
3. **Headers Sent** - `X-Regarde-Token` and `X-Regarde-Auth-ID` headers
4. **Worker Load** - Worker loads `RegardeTokenAuth` via `loadAs: workerAccount`
5. **Ownership Check** - Verify `tokenAuth._owner === account.id`
6. **Expiry Check** - Validate `Date.now() < tokenAuth.expiresAt`
7. **Stateless Verify** - No session state, validated on each request

```typescript
// Client-side token generation
const token = generateRegardeToken(); // 16-char random
await getRegardeTokenAuth({ loadedRegardeAuthCoMap: authCoMap });

// API verification
const tokenAuth = await RegardeTokenAuth.load(authId, { loadAs: worker });
if (tokenAuth._owner !== accountId) throw new Error("Invalid ownership");
if (Date.now() > tokenAuth.expiresAt) throw new Error("Token expired");
```

## Schema Usage

### Core Schemas

| Schema | Purpose | Owner |
|--------|---------|-------|
| `RegardeAccount` | Root account with SDK reference | User |
| `RegardeSDK` | Main SDK container (v4) | User |
| `RegardeApp` | App definition (name, config) | User |
| `PaymentEvent` | Payment transaction record | Worker (user READ) |
| `Subscription` | Mutable subscription state | Worker (user READ) |
| `UserHandle` | Nickname registration data | User |
| `CheckoutSession` | Active checkout session | User |
| `RegardeTokenAuth` | 24h registration token | User |

### Schema Definition Pattern

```typescript
export const PaymentEvent = co.map({
  provider: z.enum(PAYMENT_PROVIDERS),
  eventType: z.enum(PAYMENT_EVENT_TYPES),
  amount: z.string(),
  currency: z.string(),
  status: z.enum(PAYMENT_STATUSES),
  timestamp: z.number(),
});

export type TPaymentEvent = co.loaded<typeof PaymentEvent>;
```

## Group Permissions

### User Group

User's personal group for user-owned data:

```typescript
const userGroup = Group.create({ owner: account });
// Used for: RegardeSDK, RegardeApp, UserHandle, CheckoutSession
```

### AdminOtherReaders Group

Worker writes, user reads:

```typescript
const adminGroup = Group.create({ owner: workerAccount });
adminGroup.addMember(account, "reader");
// Used for: PaymentEvent, Subscription, Invoice, Refund
```

### Group Assignment Pattern

```typescript
// User-owned data
const app = RegardeApp.create({ name: "My App" }, { owner: userGroup });

// Worker-owned with user READ access
const payment = PaymentEvent.create({ ... }, { owner: adminGroup });
```

## Variable Naming Conventions

| Pattern | Usage | Example |
|---------|-------|---------|
| `account` | RegardeAccount instance | `const account = useAccount()` |
| `worker` | Worker account in API/admin | `const worker = await getWorkerAccount()` |
| `userGroup` | User's personal group | `const userGroup = Group.create({ owner: account })` |
| `regardeAdminOtherReadersGroup` | Worker admin group | Used for payment events |
| `RegardeTokenAuth` | Auth token schema | `RegardeTokenAuth.create({ ... })` |
| `T` prefix | Type definitions | `TRegardeAccount`, `TPaymentEvent` |
| `co` prefix | Jazz schema objects | `co.map({ ... })` |

## Loading Patterns

### $isLoaded Checks

Always use explicit boolean checks:

```typescript
const isLoaded = account !== null && account.$isLoaded === true;
if (isLoaded === false) {
  throw new Error("Account not loaded");
}
```

### Collection Filtering

Filter to loaded items only:

```typescript
const loadedEvents = allEvents.filter(
  (event): event is TPaymentEvent =>
    event !== null && event !== undefined && event.$isLoaded === true
);
```

### ensureLoaded

Explicit loading with resolution:

```typescript
const { root } = await account.$jazz.ensureLoaded({
  resolve: {
    root: {
      "regarde-sdk": true
    }
  }
});
```

### waitForAllCoValuesSync

Wait for all nested CoValues:

```typescript
await account.$jazz.waitForAllCoValuesSync();
```

## Common Patterns

### Type Predicates in Filters

```typescript
// Correct - implicit parameter, type predicate
const valid = items.filter(
  (item): item is TItem =>
    item !== null && item !== undefined && item.$isLoaded === true
);
```

### Migration Pattern

```typescript
export const RegardeAccount = co
  .account({ ... })
  .withMigration(async (account) => {
    const hasRoot = account.$jazz.has("root") === true;
    if (hasRoot === false) {
      const sdk = await initRegardeSDK(account, "create");
      account.$jazz.set("root", { "regarde-sdk": sdk });
      await account.$jazz.waitForSync();
    }
  });
```

### Boolean Explicitness

```typescript
// Always use === true / === false
const isValid = account !== null && account.$isLoaded === true;
if (isValid === false) throw new Error("Invalid");

const hasField = root.$jazz.has("field") === true;
if (hasField === false) createField();
```
