Groups can inherit members from other groups using the `extend` method.

When a group extends another group, members of the parent group will become automatically part of the child group.

## [](https://jazz.tools/docs/react/groups/inheritance#basic-usage)Basic Usage

Here's how to extend a group:

```
const playlistGroup = Group.create();
const trackGroup = Group.create();

// This way track becomes visible to the members of playlist
trackGroup.extend(playlistGroup);
```

When you extend a group:

- Members of the parent group get access to the child group
- Their roles are inherited (with some exceptions, see [below](https://jazz.tools/docs/react/groups/inheritance#role-inheritance-rules))
- Removing a member from the parent group also removes their access to child groups

## [](https://jazz.tools/docs/react/groups/inheritance#inheriting-members-but-overriding-their-role)Inheriting members but overriding their role

In some cases you might want to inherit all members from a parent group but override/flatten their roles to the same specific role in the child group. You can do so by passing an "override role" as a second argument to `extend`:

```
const organizationGroup = Group.create();
organizationGroup.addMember(bob, "admin");

const billingGroup = Group.create();

// This way the members of the organization can only read the billing data
billingGroup.extend(organizationGroup, "reader");
```

The "override role" works in both directions:

```
const parentGroup = Group.create();
parentGroup.addMember(bob, "reader");
parentGroup.addMember(alice, "admin");

const childGroup = Group.create();
childGroup.extend(parentGroup, "writer");

// Bob and Alice are now writers in the child group
```

## [](https://jazz.tools/docs/react/groups/inheritance#multiple-levels-of-inheritance)Multiple Levels of Inheritance

Groups can be extended multiple levels deep:

```
const grandParentGroup = Group.create();
const parentGroup = Group.create();
const childGroup = Group.create();

childGroup.extend(parentGroup);
parentGroup.extend(grandParentGroup);
```

Members of the grandparent group will get access to all descendant groups based on their roles.

## [](https://jazz.tools/docs/react/groups/inheritance#permission-changes)Permission Changes

When you remove a member from a parent group, they automatically lose access to all child groups. We handle key rotation automatically to ensure security.

```
// Remove member from parent
await parentGroup.removeMember(bob);

// Bob loses access to both parent and child groups
```

## [](https://jazz.tools/docs/react/groups/inheritance#role-inheritance-rules)Role Inheritance Rules

If the account is already a member of the child group, it will get the more permissive role:

```
const parentGroup = Group.create();
parentGroup.addMember(bob, "reader");

const childGroup = Group.create();
parentGroup.addMember(bob, "writer");
childGroup.extend(parentGroup);

// Bob stays a writer because his role is higher
// than the inherited reader role.
```

When extending groups, only admin, writer and reader roles are inherited:

```
const parentGroup = Group.create();
parentGroup.addMember(bob, "writeOnly");

const childGroup = Group.create();
childGroup.extend(parentGroup);

// Bob does not become a member of the child group
```

To extend a group:

1.  The current account must be an admin in the child group
2.  The current account must be a member of the parent group

```
const companyGroup = company._owner.castAs(Group)
const teamGroup = Group.create();

// Works only if I'm a member of companyGroup
teamGroup.extend(companyGroup);
```

## [](https://jazz.tools/docs/react/groups/inheritance#revoking-a-group-extension)Revoking a group extension

You can revoke a group extension by using the `revokeExtend` method:

```
const parentGroup = Group.create();
const childGroup = Group.create();

childGroup.extend(parentGroup);

// Revoke the extension
await childGroup.revokeExtend(parentGroup);
```

## [](https://jazz.tools/docs/react/groups/inheritance#getting-all-parent-groups)Getting all parent groups

You can get all the parent groups of a group by calling the `getParentGroups` method:

```
const childGroup = Group.create();
const parentGroup = Group.create();
childGroup.extend(parentGroup);

console.log(childGroup.getParentGroups()); // [parentGroup]
```

## [](https://jazz.tools/docs/react/groups/inheritance#example-team-hierarchy)Example: Team Hierarchy

Here's a practical example of using group inheritance for team permissions:

```
// Company-wide group
const companyGroup = Group.create();
companyGroup.addMember(CEO, "admin");

// Team group with elevated permissions
const teamGroup = Group.create();
teamGroup.extend(companyGroup); // Inherits company-wide access
teamGroup.addMember(teamLead, "admin");
teamGroup.addMember(developer, "writer");

// Project group with specific permissions
const projectGroup = Group.create();
projectGroup.extend(teamGroup); // Inherits team permissions
projectGroup.addMember(client, "reader"); // Client can only read project items
```

This creates a hierarchy where:

- The CEO has admin access to everything
- Team members get writer access to team and project content
- Team leads get admin access to team and project content
- The client can only read project content
