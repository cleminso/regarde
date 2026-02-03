# Jazz Regarde Skill

Jazz local-first database patterns for Regarde SDK.

## System Instructions

You are an expert in Jazz (local-first database) and the Regarde SDK. Follow these critical rules:

### Critical Rules

1. **Write-Wait-Use Pattern**: ALWAYS wait for sync after creating/modifying CoValues
2. **Check $isLoaded === true**: ALWAYS check explicit boolean, not truthiness
3. **Group Ownership**: ALWAYS use `Group.create()` for ownership (never Account)
4. **CoValue Types**: Regarde ONLY uses CoMap, CoList, CoRecord (NOT CoFeed, CoImage)
5. **Authentication**: Regarde uses Passphrase (CLI) and RegardeTokenAuth Token (API)

### Explicit Boolean Pattern (MANDATORY)

```typescript
// ✓ CORRECT - explicit boolean comparisons
const isLoaded = account !== null && account.$isLoaded === true;
if (isLoaded === false) {
  throw new Error("Account not loaded");
}

const hasToken = auth.token !== null && auth.token.length > 0;
const hasExpiresAt = auth.expiresAt > 0;
const isExpired = Date.now() > auth.expiresAt;
const isValid = hasToken && hasExpiresAt && isExpired === false;

// ✗ WRONG - implicit truthiness
if (!account.$isLoaded) { ... }
if (!auth.token) { ... }
```

### Regarde-Used CoValues

| Type              | Usage                                           |
| ----------------- | ----------------------------------------------- |
| `co.map({...})`   | RegardeSDK, RegardeTokenAuth, App, PaymentEvent |
| `co.list(T)`      | myApps list                                     |
| `co.record(K, V)` | PaymentEvent maps                               |

### Type Extraction

```typescript
type TApp = co.loaded<typeof App>;
type TAppInput = co.input<typeof App>;
function loadApp(id: ID<string>): Promise<TApp | undefined>;
```

### Sync Safety

```typescript
// Write-Wait-Use
const app = App.create({...});
await app.$jazz.waitForSync(); // REQUIRED

// Create-Set-Sync
root.$jazz.set("child", child);
await child.$jazz.waitForSync();
await root.$jazz.waitForSync();
```

### Loading/Validation (EXPLICIT)

```typescript
const isLoaded = coMap !== null && coMap.$isLoaded === true;
const hasField = coMap.$jazz.has("field") === true;
const isValid = isLoaded && hasField;

if (isValid === false) {
  throw new Error("Not valid");
}
```

### Authentication

```typescript
// Passphrase for CLI
const auth = usePassphraseAuth({ wordlist });

// Token for API
const { token, tokenId, isExpired } = useRegardeTokenAuth(regardeSDK?.auth);
const canCallApi = token !== null && tokenId !== null && isExpired === false;
```

### Group Permissions

```typescript
const group = Group.create({ owner: account });
group.addMember(otherAccount, "writer");
group.makePublic();

const canWrite = account.canWrite(coValue);
if (canWrite === true) {
  coValue.$jazz.set("field", value);
}
```

### React Hooks

```typescript
const account = useAccount(RegardeAccount, {
  resolve: {root: {"regarde-sdk": true}}
});

// EXPLICIT check
const isLoaded = account !== null && account.$isLoaded === true;
if (isLoaded === false) {
  return <div>Loading...</div>;
}
```

## Decision Tree

```
Define schema?
├── Fixed fields → co.map({field: z.string()})
├── Dynamic keys → co.record(z.string(), z.string())
└── Ordered list → co.list(Item)

Create data?
├── Use Group.create() for ownership
├── Add members with addMember()
└── ALWAYS call await coValue.$jazz.waitForSync()

Read data?
├── Check $isLoaded === true (explicit boolean)
├── Use ensureLoaded() for deep resolution
└── Use subscribe() for real-time

Authentication?
├── Passphrase (CLI) → usePassphraseAuth()
└── Tokens (API) → useRegardeTokenAuth()

Permissions?
├── Single user → Group with owner: account
├── Multiple users → addMember(role)
├── Public → makePublic()
└── Check canRead/canWrite/canAdmin
```
