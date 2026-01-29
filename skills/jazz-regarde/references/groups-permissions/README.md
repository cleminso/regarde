# Groups and Permissions Reference

Understanding access control in Jazz.

## Overview

Groups control access to CoValues. Every CoValue has an owner (Group or Account). Group-based ownership is recommended and will become required in future.

## Permission Roles

| Role        | Description          | Permissions                                |
| ----------- | -------------------- | ------------------------------------------ |
| `admin`     | Full control         | Can do everything, including adding admins |
| `manager`   | Delegated management | Can add/remove readers and writers         |
| `writer`    | Standard writer      | Can read and write                         |
| `writeOnly` | Blind submissions    | Can write but not read others' updates     |
| `reader`    | Viewer               | Can read only                              |

## Role Matrix

| Action                     | admin | manager | writer | writeOnly    | reader |
| -------------------------- | ----- | ------- | ------ | ------------ | ------ |
| Add admins                 | ✓     | ✗       | ✗      | ✗            | ✗      |
| Add/remove managers        | ✓     | ✗       | ✗      | ✗            | ✗      |
| Add/remove readers/writers | ✓     | ✓       | ✗      | ✗            | ✗      |
| Write                      | ✓     | ✓       | ✓      | ✓ (own only) | ✗      |
| Read                       | ✓     | ✓       | ✓      | ✗            | ✓      |

Note: Admins can only remove themselves. Other roles can be removed by admin/manager.

## Creating Groups

### Basic Group

```typescript
import { Group } from "jazz-tools";

const group = Group.create({ owner: account });
```

### Adding Members

```typescript
const group = Group.create({ owner: account });

// Add writer
const bob = await co.account().load(bobsId);
const isBobLoaded = bob !== null && bob.$isLoaded === true;
if (isBobLoaded === true) {
  group.addMember(bob, "writer");
}

// Add reader
group.addMember(alice, "reader");

// Add admin
group.addMember(carol, "admin");
```

### Removing Members

```typescript
// Remove specific member
group.removeMember(bob);

// Admin can remove others (except other admins)
// Managers can remove readers/writers
// Anyone can remove themselves
```

## Creating CoValues with Groups

### Basic CoValue

```typescript
// With default owner (current account)
const task = Task.create({ title: "Task" });

// With specific group
const group = Group.create({ owner: account });
const sharedTask = Task.create({ title: "Shared Task" }, { owner: group });
```

### List

```typescript
const sharedList = co.list(Task).create([], { owner: group });
```

### Record

```typescript
const sharedRecord = co
  .record(z.string(), z.string())
  .create({ theme: "dark" }, { owner: group });
```

## Public Sharing

Make CoValues readable by everyone:

```typescript
const publicGroup = Group.create({ owner: account });
publicGroup.makePublic();

const publicTask = Task.create(
  { title: "Public Task" },
  { owner: publicGroup },
);
```

## Checking Permissions

### On Account

```typescript
const me = co.account().getMe();

if (me.canAdmin(coValue)) {
  console.log("I can add admins");
} else if (me.canManage(coValue)) {
  console.log("I can share with others");
} else if (me.canWrite(coValue)) {
  console.log("I can edit");
} else if (me.canRead(coValue)) {
  console.log("I can view");
}
```

### On Group

```typescript
const group = coValue.$jazz.owner;

// Check my role in this group
const myRole = group.myRole;
console.log(myRole); // "admin", "writer", etc.

// Get direct members
const directMembers = group.getDirectMembers();

// Get all members (including from nested groups)
const allMembers = group.members;
```

## Nested Groups

Groups can contain other groups:

```typescript
const parentGroup = Group.create({ owner: account });
const childGroup = Group.create({ owner: account });

parentGroup.addMember(childGroup, "writer");

// Members of childGroup inherit permissions through parentGroup
```

## Group Membership Operations

### Check Membership

```typescript
const members = group.getDirectMembers();
const isMember = members.some((m) => m.$jazz.id === bob.$jazz.id);
```

### Change Role

```typescript
// Bob is currently a writer, promote to manager
group.addMember(bob, "manager");

// Bob is a writer, demote to reader
group.addMember(bob, "reader");
```

## Group as Owner

### Getting Owner Group

```typescript
const group = coValue.$jazz.owner;
```

### Creating Related CoValues

```typescript
const project = Project.create({ ... }, { owner: group });

// All project items share the same group
project.tasks = co.list(Task).create([], { owner: group });
project.files = co.list(File).create([], { owner: group });
```

## Regarde-Specific Patterns

### User Group with Registry Access

```typescript
// Create user group with registry worker as writer
const userGroup = Group.create({ owner: account });
userGroup.addMember(registryGroup, "writer");
await userGroup.$jazz.waitForSync();

// User data owned by this group
const myApps = co.list(App).create([], { owner: userGroup });
```

### Admin Readers Group

```typescript
// For payment data: worker is admin, user is reader
const adminReadersGroup = Group.create({ owner: account });
adminReadersGroup.addMember(registryGroup, "admin");
adminReadersGroup.addMember(account, "reader");
await adminReadersGroup.$jazz.waitForSync();

// Payment data in this group
const payments = co
  .record(z.string(), z.string())
  .create({}, { owner: adminReadersGroup });
```

### Permission Checks

```typescript
// Check if user can admin (owns the token)
const canAdmin = userAccount.canAdmin(regardeAuth);

if (!canAdmin) {
  throw new Error("User doesn't own this token");
}
```

## Best Practices

### 1. Always Use Groups for CoValues

```typescript
// ✓ Good
const group = Group.create({ owner: account });
const task = Task.create({ ... }, { owner: group });

// ✗ Bad (deprecated)
const task = Task.create({ ... }, account);
```

### 2. Create Groups Per-Purpose

```typescript
// User's personal data
const userGroup = Group.create({ owner: account });

// Shared team data
const teamGroup = Group.create({ owner: teamLeader });
teamGroup.addMember(member1, "writer");
teamGroup.addMember(member2, "reader");
```

### 3. Use makePublic() Carefully

```typescript
// Only for truly public data
const publicGroup = Group.create({ owner: account });
publicGroup.makePublic();

const publicProfile = Profile.create({ ... }, { owner: publicGroup });
```

### 4. Verify Permissions Before Actions

```typescript
if (account.canWrite(coValue)) {
  coValue.$jazz.set("field", value);
} else {
  throw new Error("Insufficient permissions");
}
```

### 5. Document Permission Model

```typescript
/**
 * User data: User is owner, worker is writer
 * - User has full control
 * - Worker can write payment events
 */
const userGroup = Group.create({ owner: account });
userGroup.addMember(registryWorkerGroup, "writer");

/**
 * Payment data: User is owner, worker is admin, user is reader
 * - Worker can create payment events
 * - User can read but not modify
 */
const paymentGroup = Group.create({ owner: account });
paymentGroup.addMember(registryWorkerGroup, "admin");
paymentGroup.addMember(account, "reader");
```

### 6. Use Constants for Registry Groups

```typescript
// constants.ts
export const REGARDE_REGISTRY_GROUP = "co_zoppoxWWJaHYKPgSgUkuCCXQX21";

// usage.ts
const registryGroup = await co
  .group()
  .load(REGARDE_REGISTRY_GROUP, { loadAs: account });
```

### 7. Clean Up Unused Groups

```typescript
// Groups are CoValues, so they persist
// Remove members when no longer needed
group.removeMember(user);
```

### 8. Check Nested Group Membership

```typescript
// Check if user has any role through nested groups
const allMembers = group.members;
const isMember = allMembers.some((m) => m.$jazz.id === user.$jazz.id);
```

## Common Patterns

### Pattern 1: Team with Different Roles

```typescript
const teamGroup = Group.create({ owner: admin });
teamGroup.addMember(lead, "manager");
teamGroup.addMember(member1, "writer");
teamGroup.addMember(member2, "writer");
teamGroup.addMember(observer, "reader");
```

### Pattern 2: Publicly Readable

```typescript
const publicGroup = Group.create({ owner: account });
publicGroup.makePublic();

const article = Article.create({ ... }, { owner: publicGroup });
```

### Pattern 3: Write-Only Submissions

```typescript
const submissionsGroup = Group.create({ owner: organizer });
submissionsGroup.addMember(participant1, "writeOnly");
submissionsGroup.addMember(participant2, "writeOnly");

// Participants can submit but not see others' submissions
```

### Pattern 4: Progressive Access

```typescript
// Start with private
group.addMember(newMember, "reader");

// Upgrade as needed
group.addMember(newMember, "writer");

// Later
if (member.isTrusted) {
  group.addMember(member, "manager");
}
```

### Pattern 5: Check Before Modification

```typescript
function updateTask(task: Task, changes: Partial<Task>) {
  const me = co.account().getMe();

  if (!me.canWrite(task)) {
    throw new Error("Cannot edit this task");
  }

  Object.entries(changes).forEach(([key, value]) => {
    task.$jazz.set(key as keyof Task, value);
  });
}
```
