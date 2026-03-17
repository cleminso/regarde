# Data Ownership Model

Clear ownership boundaries ensure data integrity and security.

## User-Owned Data

Created and controlled by the user's personal group.

| CoValue | Description |
|---------|-------------|
| **RegardeAccount** | Root account with RegardeSDK reference |
| **RegardeSDK** | Main SDK container (v4 structure) |
| **RegardeApp** (App) | User's app definitions (name, payment config, webhooks) |
| **UserHandle** | Nickname registration data |
| **CheckoutSession** | Active checkout sessions |
| **RegardeTokenAuth** | 24-hour registration token (2FA mechanism) |

## Worker-Owned Data (User READ Access)

Created by worker, user has READ-only access. Ensures financial data integrity.

| CoValue | Description |
|---------|-------------|
| **PaymentEvent** | Individual payment transaction from webhook |
| **SubscriptionEvent** | Subscription state change event |
| **Subscription** | Current mutable subscription state |
| **LicenseEvent** | License activation/deactivation event |
| **Invoice** | Invoice record from provider |
| **Refund** | Refund record for a payment |

## Registry-Owned Data (Worker Only)

Owned by worker/registry, managed directly. Users have no direct access.

| CoValue | Description |
|---------|-------------|
| **RegistryAppMetadata** | App verification status and access flags |
| **NicknameRegistry** | Global nickname → JazzAccountID mapping |
| **ReverseNicknameRegistry** | JazzAccountID → nickname mapping |
| **ReservedNicknamesRegistry** | Reserved nickname categories |
| **AuditLog** | Registry operation audit trail |

## Group Permissions

### User Group

```typescript
const userGroup = Group.create({ owner: account });
// User has full read/write access
```

### AdminOtherReaders Group

```typescript
const adminGroup = Group.create({ owner: workerAccount });
adminGroup.addMember(userAccount, "reader");
// Worker writes, user reads only
```

### Why This Model Matters

1. **Data Integrity** - Financial records (payments, subscriptions) cannot be tampered with by users
2. **Audit Trail** - All registry operations logged immutably
3. **Clear Boundaries** - No ambiguity about who can modify what
4. **Security** - Worker verification required for sensitive operations
5. **Compliance** - Financial data integrity for regulatory requirements

## Common Mistakes to Avoid

### Creating PaymentEvent as User-Owned

```typescript
// WRONG - User could modify payment records
const payment = PaymentEvent.create({ ... }, { owner: userGroup });

// CORRECT - Worker owns, user reads
const payment = PaymentEvent.create({ ... }, { owner: adminGroup });
```

### Forgetting READ Permission

```typescript
// WRONG - User cannot see their own payments
const adminGroup = Group.create({ owner: workerAccount });
// Missing: adminGroup.addMember(account, "reader");

// CORRECT - Grant explicit READ access
const adminGroup = Group.create({ owner: workerAccount });
adminGroup.addMember(account, "reader");
```

### Mixing Ownership in Same Group

```typescript
// WRONG - Same group for user and worker data
const mixedGroup = Group.create({ owner: account });
const app = RegardeApp.create({ ... }, { owner: mixedGroup });
const payment = PaymentEvent.create({ ... }, { owner: mixedGroup });

// CORRECT - Separate groups by ownership model
const userGroup = Group.create({ owner: account });
const adminGroup = Group.create({ owner: workerAccount });
adminGroup.addMember(account, "reader");

const app = RegardeApp.create({ ... }, { owner: userGroup });
const payment = PaymentEvent.create({ ... }, { owner: adminGroup });
```

## Cross-References

- See [ARCHITECTURE.md](../../ARCHITECTURE.md) for system overview and component relationships
- See [SECURITY.md](../SECURITY.md) for authentication flow and access control details
- See [jazz-patterns.md](./jazz-patterns.md) for implementation patterns
