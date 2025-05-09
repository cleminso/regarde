...more docs coming soon

## [](https://jazz.tools/docs/react/groups/sharing#public-sharing)Public sharing

You can share CoValues publicly by setting the `owner` to a `Group`, and granting access to "everyone".

```
const group = Group.create();
group.addMember("everyone", "writer"); // *highlight*
```

This is done in the [chat example](https://github.com/garden-co/jazz/tree/main/examples/chat) where anyone can join the chat, and send messages.

You can also [add members by Account ID](https://jazz.tools/docs/react/groups/intro#adding-group-members-by-id).

## [](https://jazz.tools/docs/react/groups/sharing#invites)Invites

You can grant users access to a CoValue by sending them an invite link.

This is used in the [pet example](https://github.com/garden-co/jazz/tree/main/examples/pets) and the [todo example](https://github.com/garden-co/jazz/tree/main/examples/todo).

```
import { createInviteLink } from "jazz-react";

createInviteLink(organization, "writer"); // or reader, or admin
```

It generates a URL that looks like `.../invite/[CoValue ID]/[inviteSecret]`

In your app, you need to handle this route, and let the user accept the invitation, as done [here](https://github.com/garden-co/jazz/tree/main/examples/pets/src/2_main.tsx).

```
useAcceptInvite({
  invitedObjectSchema: PetPost,
  onAccept: (petPostID) => navigate("/pet/" + petPostID),
});
```
