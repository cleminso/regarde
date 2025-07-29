Data Creation vs Access Patterns

### CoMaps: Creation vs Access

- **Creation**: Use `.create()` with ownership/groups - establishes data structure
- **Access**: Use hooks with resolve queries - subscribes to existing data reactively
- **Key insight**: Server creates authoritative structures, clients subscribe and display

### Server vs Client Responsibilities

- **Server-side**: Migrations, worker processes, initial data setup, authoritative creation
- **Client-side**: React hooks, resolve queries, reactive updates, data consumption
- **Pattern**: Server creates/manages, clients read/display

## Account & Schema Architecture

### useAccount() Connection to Schema

```typescript
const { me } = useAccount(CustomAccountSchema, {
  resolve: { profile: { nestedData: true } },
});
```

- Schema acts as both **data structure definition** and **type contract**
- Direct type-safe connection - no separate hooks needed for CoMaps
- Resolve queries declaratively specify what to load

### Account ↔ CoMaps Relationship

- **Account** = User identity + authentication (top-level container)
- **Profile CoMap** = Public user data (`"everyone": "reader"`)
- **Root CoMap** = Private user data (owner only)
- **Nested CoMaps** = Specific data structures within profile/root

### Data Flow Pattern

`useAccount(Schema, {resolve})` → Jazz auto-loads → React re-renders → Direct property access

- **No separate `useCoMap()` needed** - resolve system handles everything
- One hook subscription manages entire data tree

## Data States & Loading

### Three Critical States

1. **Loaded & exists**: `me?.profile` (safe to use)
2. **Loading**: `me?.profile === null` (show loading UI)
3. **Doesn't exist**: `me?.profile === undefined` (needs creation)

### Loading State Implications

- If not in `resolve`, data returns `null` even if it exists
- Jazz handles automatic loading states in hook system
- Deep loading via nested resolve queries

## Groups & Permissions

### Permission Architecture

- **Groups control data accessibility** in hooks
- **Migrations establish permission foundation** (privileged context)
- **Hooks respect established permissions** (consumer context)

### Access Patterns

- **No permission**: Hook returns `undefined` (won't even attempt to load)
- **Has permission, loading**: Hook returns `null`
- **Has permission, loaded**: Hook returns actual data

## Migration vs Hook Context

### Migrations (Privileged)

- Run during account creation/login with elevated privileges
- Can create account-level data structures and groups
- Handle async operations with `await` and `ensureLoaded()`
- Establish foundational data architecture

### Hooks (Consumer)

- Consume existing data structures established by migrations
- Can modify existing data they have access to
- Must be synchronous and follow React rules
- Cannot create root-level account data

### Why Migration Code Works vs Hook Code Fails

- **Timing**: Migrations run when system expects structural changes
- **Privileges**: Migrations create; hooks consume
- **Error handling**: Migrations can retry/fallback; hooks must gracefully handle failures
- **Metaphor**: Migrations = "construction time", Hooks = "runtime"

## Best Practices

### Optional Chaining vs Conditional Logic

- **Use optional chaining**: Safe property access (`me?.profile?.data`)
- **Use conditional rendering**: Loading states (`me ? <Data /> : <Loading />`)
- **Never**: Conditionally call hooks (breaks React rules)

### Data Access Safety

```typescript
// ✅ Safe access pattern
const data = me?.profile?.nestedData?.value || '';

// ✅ Loading state handling
if (!me) return <Loading />;

// ✅ Existence checking in migrations
if (account.root === undefined) { /* create */ }
```

### Key Architectural Insights

- **Groups are the bridge** between migration setup and hook consumption
- **Resolve queries are declarative** - specify what you need, Jazz handles loading
- **Permissions are enforced automatically** - no manual authorization logic needed
- **One account hook subscription** can manage complex nested data trees
