## [](https://jazz.tools/docs/react/schemas/accounts-and-migrations#covalues-as-a-graph-of-data-rooted-in-accounts)CoValues as a graph of data rooted in accounts

Compared to traditional relational databases with tables and foreign keys, Jazz is more like a graph database, or GraphQL APIs — where CoValues can arbitrarily refer to each other and you can resolve references without having to do a join. (See [Subscribing & deep loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading)).

To find all data related to a user, the account acts as a root node from where you can resolve all the data they have access to. These root references are modeled explicitly in your schema, distinguishing between data that is typically public (like a user's profile) and data that is private (like their messages).

### [](https://jazz.tools/docs/react/schemas/accounts-and-migrations#accountroot---private-data-a-user-cares-about)`Account.root` - private data a user cares about

Every Jazz app that wants to refer to per-user data needs to define a custom root `CoMap` schema and declare it in a custom `Account` schema as the `root` field:

```
import { co, z } from "jazz-tools";

const MyAppRoot = co.map({
  myChats: co.list(Chat),
});

export const MyAppAccount = co.account({
  root: MyAppRoot,
  profile: co.profile(),
});
```

### [](https://jazz.tools/docs/react/schemas/accounts-and-migrations#accountprofile---public-data-associated-with-a-user)`Account.profile` - public data associated with a user

The built-in `Account` schema class comes with a default `profile` field, which is a CoMap (in a Group with `"everyone": "reader"` - so publicly readable permissions) that is set up for you based on the username the `AuthMethod` provides on account creation.

Their pre-defined schemas roughly look like this:

```
// ...somewhere in jazz-tools itself...
const Account = co.account({
  root: co.map({}),
  profile: co.profile(),
});
```

If you want to keep the default `co.profile()` schema, but customise your account's private `root`, all you have to do is define a new `root` field in your account schema and use `co.profile()` without options:

```
const MyAppRoot = co.map({
  myChats: co.list(Chat),
});

export const MyAppAccount = co.account({
  root: MyAppRoot,
  profile: co.profile(),
});
```

If you want to extend the `profile` to contain additional fields (such as an avatar `co.image()`), you can declare your own profile schema class using `co.profile({...})`:

```
export const MyAppRoot = co.map({
  myChats: co.list(Chat),
});

export const MyAppProfile = co.profile({
  name: z.string(), // compatible with default Profile schema
  avatar: co.optional(co.image()),
});

export const MyAppAccount = co.account({
  root: MyAppRoot,
  profile: MyAppProfile,
});
```

## [](https://jazz.tools/docs/react/schemas/accounts-and-migrations#resolving-covalues-starting-at-profile-or-root)Resolving CoValues starting at `profile` or `root`

To use per-user data in your app, you typically use `useAccount` somewhere in a high-level component, pass it your custom Account schema and specify which references to resolve using a resolve query (see [Subscribing & deep loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading)).

```
import { useAccount } from "jazz-tools/react";

function DashboardPageComponent() {
  const { me } = useAccount(MyAppAccount, { resolve: {
    profile: true,
    root: {
      myChats: { $each: true },
    }
  }});

  return (
    <div>
      <h1>Dashboard</h1>
      {me ? (
        <div>
          <p>Logged in as {me.profile.name}</p>
          <h2>My chats</h2>
          {me.root.myChats.map((chat) => (
            <ChatPreview key={chat.id} chat={chat} />
          ))}
        </div>
      ) : (
        "Loading..."
      )}
    </div>
  );
}
```

## [](https://jazz.tools/docs/react/schemas/accounts-and-migrations#populating-and-evolving-root-and-profile-schemas-with-migrations)Populating and evolving `root` and `profile` schemas with migrations

As you develop your app, you'll likely want to

- initialise data in a user's `root` and `profile`
- add more data to your `root` and `profile` schemas

You can achieve both by overriding the `migrate()` method on your `Account` schema class.

### [](https://jazz.tools/docs/react/schemas/accounts-and-migrations#when-migrations-run)When migrations run

Migrations are run after account creation and every time a user logs in. Jazz waits for the migration to finish before passing the account to your app's context.

### [](https://jazz.tools/docs/react/schemas/accounts-and-migrations#initialising-user-data-after-account-creation)Initialising user data after account creation

```
export const MyAppAccount = co.account({
  root: MyAppRoot,
  profile: MyAppProfile,
}).withMigration((account, creationProps?: { name: string }) => {
  // we specifically need to check for undefined,
  // because the root might simply be not loaded (`null`) yet
  if (account.root === undefined) {
    account.root = MyAppRoot.create({
      // Using a group to set the owner is always a good idea.
      // This way if in the future we want to share
      // this coValue we can do so easily.
      myChats: co.list(Chat).create([], Group.create()),
    });
  }

  if (account.profile === undefined) {
    const profileGroup = Group.create();
    // Unlike the root, we want the profile to be publicly readable.
    profileGroup.makePublic();

    account.profile = MyAppProfile.create({
      name: creationProps?.name ?? "New user",
      bookmarks: co.list(Bookmark).create([], profileGroup),
    }, profileGroup);
  }
});
```

### [](https://jazz.tools/docs/react/schemas/accounts-and-migrations#addingchanging-fields-to-root-and-profile)Adding/changing fields to `root` and `profile`

To add new fields to your `root` or `profile` schemas, amend their corresponding schema classes with new fields, and then implement a migration that will populate the new fields for existing users (by using initial data, or by using existing data from old fields).

To do deeply nested migrations, you might need to use the asynchronous `ensureLoaded()` method before determining whether the field already exists, or is simply not loaded yet.

Now let's say we want to add a `myBookmarks` field to the `root` schema:

```
const MyAppRoot = co.map({
  myChats: co.list(Chat),
  myBookmarks: co.optional(co.list(Bookmark)),
});


export const MyAppAccount = co.account({
  root: MyAppRoot,
  profile: MyAppProfile,
}).withMigration(async (account) => {
  if (account.root === undefined) {
    account.root = MyAppRoot.create({
      myChats: co.list(Chat).create([], Group.create()),
    });
  }

  // We need to load the root field to check for the myContacts field
  const { root } = await account.ensureLoaded({
    resolve: { root: true }
  });

  // we specifically need to check for undefined,
  // because myBookmarks might simply be not loaded (`null`) yet
  if (root.myBookmarks === undefined) {
    root.myBookmarks = co.list(Bookmark).create([], Group.create());
  }
});
```
