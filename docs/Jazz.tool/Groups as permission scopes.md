Every CoValue has an owner, which can be a `Group` or an `Account`.

You can use a `Group` to grant access to a CoValue to multiple users. These users can have different roles, such as "writer", "reader" or "admin".

## [](https://jazz.tools/docs/react/groups/intro#creating-a-group)Creating a Group

Here's how you can create a `Group`.

```
import { Group } from "jazz-tools";

const group = Group.create();
```

The `Group` itself is a CoValue, and whoever owns it is the initial admin.

You typically add members using [public sharing](https://jazz.tools/docs/react/groups/sharing#public-sharing) or [invites](https://jazz.tools/docs/react/groups/sharing#invites). But if you already know their ID, you can add them directly (see below).

## [](https://jazz.tools/docs/react/groups/intro#adding-group-members-by-id)Adding group members by ID

You can add group members by ID by using `Account.load` and `Group.addMember`.

```
import { Group, Account } from "jazz-tools";

const group = Group.create();

const bob = await Account.load(bobsID, []);
group.addMember(bob, "writer");
```

Note: if the account ID is of type `string`, because it comes from a URL parameter or something similar, you need to cast it to `ID<Account>` first:

```
import { Group, Account, ID } from "jazz-tools";

const bob = await Account.load(bobsID as ID<Account>, []);
group.addMember(bob, "writer");
```

## [](https://jazz.tools/docs/react/groups/intro#getting-the-group-of-an-existing-covalue)Getting the Group of an existing CoValue

You can get the group of an existing CoValue by using `coValue._owner`.

```
const group = existingCoValue._owner;
const newValue = MyCoMap.create(
  { color: "red"},
  { owner: group }
);
```

Because `._owner` can be an `Account` or a `Group`, in cases where you specifically need to use `Group` methods (such as for adding members or getting your own role), you can cast it to assert it to be a Group:

```
import { Group } from "jazz-tools";

const group = existingCoValue._owner.castAs(Group);
group.addMember(bob, "writer");

const role = group.getRoleOf(bob);
```

## [](https://jazz.tools/docs/react/groups/intro#checking-the-permissions)Checking the permissions

You can check the permissions of an account on a CoValue by using the `canRead`, `canWrite` and `canAdmin` methods.

```
const value = await MyCoMap.load(valueID, {});
const me = Account.getMe();

if (me.canAdmin(value)) {
  console.log("I can share value with others");
} else if (me.canWrite(value)) {
  console.log("I can edit value");
} else if (me.canRead(value)) {
  console.log("I can view value");
} else {
  console.log("I cannot access value");
}
```

To check the permissions of another account, you need to load it first:

```
const value = await MyCoMap.load(valueID, {});
const bob = await Account.load(accountID, []);

if (bob.canAdmin(value)) {
  console.log("Bob can share value with others");
} else if (bob.canWrite(value)) {
  console.log("Bob can edit value");
} else if (bob.canRead(value)) {
  console.log("Bob can view value");
} else {
  console.log("Bob cannot access value");
}
```
