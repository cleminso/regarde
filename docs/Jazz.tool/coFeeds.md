CoFeeds are append-only data structures that track entries from different user sessions and accounts. Unlike other CoValues where everyone edits the same data, CoFeeds maintain separate streams for each session.

Each account can have multiple sessions (different browser tabs, devices, or app instances), making CoFeeds ideal for building features like activity logs, presence indicators, and notification systems.

The following examples demonstrate a practical use of CoFeeds:

- [Multi-cursors](https://github.com/garden-co/jazz/tree/main/examples/multi-cursors) - track user presence on a canvas with multiple cursors and out of bounds indicators
- [Reactions](https://github.com/garden-co/jazz/tree/main/examples/reactions) - store per-user emoji reaction using a CoFeed

## [](https://jazz.tools/docs/react/using-covalues/cofeeds#creating-cofeeds)Creating CoFeeds

CoFeeds are defined by specifying the type of items they'll contain, similar to how you define CoLists:

```
// Define a schema for feed items
const Activity = co.map({
  timestamp: z.date(),
  action: z.literal(["watering", "planting", "harvesting", "maintenance"]),
  notes: z.optional(z.string()),
});

// Define a feed of garden activities
const ActivityFeed = co.feed(Activity);

// Create a feed instance
const activityFeed = ActivityFeed.create([]);
```

### [](https://jazz.tools/docs/react/using-covalues/cofeeds#ownership)Ownership

Like other CoValues, you can specify ownership when creating CoFeeds.

```
const teamGroup = Group.create();
teamGroup.addMember(colleagueAccount, "writer");

const teamFeed = ActivityFeed.create([], { owner: teamGroup });
```

See [Groups as permission scopes](https://jazz.tools/docs/react/groups/intro) for more information on how to use groups to control access to CoFeeds.

## [](https://jazz.tools/docs/react/using-covalues/cofeeds#reading-from-cofeeds)Reading from CoFeeds

Since CoFeeds are made of entries from users over multiple sessions, you can access entries in different ways - from a specific user's session or from their account as a whole.

### [](https://jazz.tools/docs/react/using-covalues/cofeeds#per-session-access)Per-Session Access

To retrieve entries from a session:

```
// Get the feed for a specific session
const sessionFeed = activityFeed.perSession[sessionId];

// Latest entry from a session
console.log(sessionFeed.value.action); // "watering"
```

For convenience, you can also access the latest entry from the current session with `inCurrentSession`:

```
// Get the feed for the current session
const currentSessionFeed = activityFeed.inCurrentSession;

// Latest entry from the current session
console.log(currentSessionFeed.value.action); // "harvesting"
```

### [](https://jazz.tools/docs/react/using-covalues/cofeeds#per-account-access)Per-Account Access

To retrieve entries from a specific account (with entries from all sessions combined) use `perAccount`:

```
// Get the feed for a specific account
const accountFeed = activityFeed.perAccount[accountId];

// Latest entry from the account
console.log(accountFeed.value.action); // "watering"
```

For convenience, you can also access the latest entry from the current account with `byMe`:

```
// Get the feed for the current account
const myLatestEntry = activityFeed.byMe;

// Latest entry from the current account
console.log(myLatestEntry.value.action); // "harvesting"
```

### [](https://jazz.tools/docs/react/using-covalues/cofeeds#feed-entries)Feed Entries

#### [](https://jazz.tools/docs/react/using-covalues/cofeeds#all-entries)All Entries

To retrieve all entries from a CoFeed:

```
// Get the feeds for a specific account and session
const accountFeed = activityFeed.perAccount[accountId];
const sessionFeed = activityFeed.perSession[sessionId];

// Iterate over all entries from the account
for (const entry of accountFeed.all) {
  console.log(entry.value);
}

// Iterate over all entries from the session
for (const entry of sessionFeed.all) {
  console.log(entry.value);
}
```

#### [](https://jazz.tools/docs/react/using-covalues/cofeeds#latest-entry)Latest Entry

To retrieve the latest entry from a CoFeed, ie. the last update:

```
// Get the latest entry from the current account
const latestEntry = activityFeed.byMe;

console.log(`My last action was ${latestEntry.value.action}`);
  // "My last action was harvesting"

// Get the latest entry from each account
const latestEntriesByAccount = Object.values(activityFeed.perAccount).map(entry => ({
  accountName: entry.by?.profile?.name,
  value: entry.value,
}));
```

## [](https://jazz.tools/docs/react/using-covalues/cofeeds#writing-to-cofeeds)Writing to CoFeeds

CoFeeds are append-only; you can add new items, but not modify existing ones. This creates a chronological record of events or activities.

### [](https://jazz.tools/docs/react/using-covalues/cofeeds#adding-items)Adding Items

```
// Log a new activity
activityFeed.push(Activity.create({
  timestamp: new Date(),
  action: "watering",
  notes: "Extra water for new seedlings"
}));
```

Each item is automatically associated with the current user's session. You don't need to specify which session the item belongs to - Jazz handles this automatically.

### [](https://jazz.tools/docs/react/using-covalues/cofeeds#understanding-session-context)Understanding Session Context

Each entry is automatically added to the current session's feed. When a user has multiple open sessions (like both a mobile app and web browser), each session creates its own separate entries:

```
// On mobile device:
fromMobileFeed.push(Activity.create({
  timestamp: new Date(),
  action: "harvesting",
  location: "Vegetable patch"
}));

// On web browser (same user):
fromBrowserFeed.push(Activity.create({
  timestamp: new Date(),
  action: "planting",
  location: "Flower bed"
}));

// These are separate entries in the same feed, from the same account

```

## [](https://jazz.tools/docs/react/using-covalues/cofeeds#metadata)Metadata

CoFeeds support metadata, which is useful for tracking information about the feed itself.

### [](https://jazz.tools/docs/react/using-covalues/cofeeds#by)By

The `by` property is the account that made the entry.

```
<div><pre tabindex="0"><code><span><span>const</span><span> accountFeed</span><span> =</span><span> activityFeed</span><span>.perAccount[accountId];</span></span>
<span></span>
<span><span>// Get the account that made the last entry</span></span>
<span><span>console</span><span>.log</span><span>(</span><span>accountFeed</span><span>?.by);</span></span></code></pre></div>
```

### [](https://jazz.tools/docs/react/using-covalues/cofeeds#madeat)MadeAt

The `madeAt` property is a timestamp of when the entry was added to the feed.

```
const accountFeed = activityFeed.perAccount[accountId];

// Get the timestamp of the last update
console.log(accountFeed?.madeAt);

// Get the timestamp of each entry
for (const entry of accountFeed.all) {
  console.log(entry.madeAt);
}
```

## [](https://jazz.tools/docs/react/using-covalues/cofeeds#best-practices)Best Practices

### [](https://jazz.tools/docs/react/using-covalues/cofeeds#when-to-use-cofeeds)When to Use CoFeeds

- **Use CoFeeds when**:

  - You need to track per-user/per-session data
  - Time-based information matters (activity logs, presence)

- **Consider alternatives when**:

  - Data needs to be collaboratively edited (use CoMaps or CoLists)
  - You need structured relationships (use CoMaps/CoLists with references)
