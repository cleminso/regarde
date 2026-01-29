# Schema Migrations

Migrations let you evolve existing CoValue data without breaking older persisted data.

## Rules

- Only add optional fields, or provide a migration to backfill.
- Never overwrite existing data; gate all writes with `$jazz.has(...) === false`.
- For nested data, `ensureLoaded(...)` before checking or writing.
- If you write during migration, `await coValue.$jazz.waitForSync()` before you read back.

## Account Migration

```typescript
import { Group, co } from "jazz-tools";

export const MyAccount = co
  .account({
    root: MyRoot,
    profile: co.profile(),
  })
  .withMigration(async (account) => {
    const hasRoot = account.$jazz.has("root") === true;
    if (hasRoot === false) {
      account.$jazz.set("root", { myData: [] });
      await account.$jazz.waitForSync();
    }

    const hasProfile = account.$jazz.has("profile") === true;
    if (hasProfile === false) {
      const publicGroup = Group.create({ owner: account });
      publicGroup.makePublic();
      await publicGroup.$jazz.waitForSync();

      account.$jazz.set(
        "profile",
        co.profile().create({ name: "User" }, publicGroup),
      );
      await account.$jazz.waitForSync();
    }
  });
```

## CoMap Versioning

Use a `version` field for multi-step migrations.

```typescript
import { co, z } from "jazz-tools";

export const Settings = co
  .map({
    version: z.number(),
    theme: z.optional(z.enum(["light", "dark"])),
  })
  .withMigration((settings) => {
    const hasVersion = settings.$jazz.has("version") === true;
    if (hasVersion === false) {
      settings.$jazz.set("version", 1);
    }

    if (settings.version === 1) {
      const hasTheme = settings.$jazz.has("theme") === true;
      if (hasTheme === false) {
        settings.$jazz.set("theme", "light");
      }

      settings.$jazz.set("version", 2);
    }
  });
```

## Nested Migration

`ensureLoaded` before you inspect nested fields.

```typescript
export const migrateNested = async (
  account: co.loaded<typeof MyAccount>,
): Promise<void> => {
  const isAccountLoaded = account !== null && account.$isLoaded === true;
  if (isAccountLoaded === false) {
    throw new Error("Account must be loaded");
  }

  const { root } = await account.$jazz.ensureLoaded({
    resolve: { root: true },
  });
  const isRootLoaded = root !== null && root.$isLoaded === true;
  if (isRootLoaded === false) {
    throw new Error("Root not loaded");
  }

  const hasNewField = root.$jazz.has("newField") === true;
  if (hasNewField === false) {
    root.$jazz.set("newField", []);
    await root.$jazz.waitForSync();
  }
};
```
