**CoValues ("Collaborative Values") are the core abstraction of Jazz.** They're your bread-and-butter datastructures that you use to represent everything in your app.

As their name suggests, CoValues are inherently collaborative, meaning **multiple users and devices can edit them at the same time.**

**Think of CoValues as "super-fast Git for lots of tiny data."**

- CoValues keep their full edit histories, from which they derive their "current state".
- The fact that this happens in an eventually-consistent way makes them [CRDTs](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type).
- Having the full history also means that you often don't need explicit timestamps and author info - you get this for free as part of a CoValue's [edit metadata](https://jazz.tools/docs/react/using-covalues/history).

CoValues model JSON with CoMaps and CoLists, but also offer CoFeeds for simple per-user value feeds, and let you represent binary data with FileStreams.

## [](https://jazz.tools/docs/react/schemas/covalues#start-your-app-with-a-schema)Start your app with a schema

Fundamentally, CoValues are as dynamic and flexible as JSON, but in Jazz you use them by defining fixed schemas to describe the shape of data in your app.

This helps correctness and development speed, but is particularly important...

- when you evolve your app and need migrations
- when different clients and server workers collaborate on CoValues and need to make compatible changes

Thinking about the shape of your data is also a great first step to model your app.

Even before you know the details of how your app will work, you'll probably know which kinds of objects it will deal with, and how they relate to each other.

In Jazz, you define schemas using `co` for CoValues and `z` (from [Zod](https://zod.dev/)) for their primitive fields.

```
// schema.ts
import { co, z } from "jazz-tools";

const ListOfTasks = co.list(z.string());

export const TodoProject = co.map({
  title: z.string(),
  tasks: ListOfTasks,
});
```

This gives us schema info that is available for type inference _and_ at runtime.

Check out the inferred type of `project` in the example below, as well as the input `.create()` expects.

```
// app.ts
import { Group } from "jazz-tools";
import { TodoProject, ListOfTasks } from "./schema";

const project = TodoProject.create(
  {
    title: "New Project",
    tasks: ListOfTasks.create([], Group.create()),
  },
  Group.create()
);
```

## [](https://jazz.tools/docs/react/schemas/covalues#types-of-covalues)Types of CoValues

### [](https://jazz.tools/docs/react/schemas/covalues#comap-declaration)`CoMap` (declaration)

CoMaps are the most commonly used type of CoValue. They are the equivalent of JSON objects (Collaborative editing follows a last-write-wins strategy per-key).

You can either declare struct-like CoMaps:

```
const Task = co.map({
  title: z.string(),
  completed: z.boolean(),
});
```

Or record-like CoMaps (key-value pairs, where keys are always `string`):

```
const ColorToHex = co.record(z.string(), z.string());

const ColorToFruit = co.record(z.string(), Fruit);
```

See the corresponding sections for [creating](https://jazz.tools/docs/react/using-covalues/comaps#creating-comaps), [subscribing/loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading), [reading from](https://jazz.tools/docs/react/using-covalues/comaps#reading-from-comaps) and [updating](https://jazz.tools/docs/react/using-covalues/comaps#updating-comaps) CoMaps.

### [](https://jazz.tools/docs/react/schemas/covalues#colist-declaration)`CoList` (declaration)

CoLists are ordered lists and are the equivalent of JSON arrays. (They support concurrent insertions and deletions, maintaining a consistent order.)

You define them by specifying the type of the items they contain:

```
const ListOfColors = co.list(z.string());
const ListOfTasks = co.list(Task);
```

See the corresponding sections for [creating](https://jazz.tools/docs/react/using-covalues/colists#creating-colists), [subscribing/loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading), [reading from](https://jazz.tools/docs/react/using-covalues/colists#reading-from-colists) and [updating](https://jazz.tools/docs/react/using-covalues/colists#updating-colists) CoLists.

### [](https://jazz.tools/docs/react/schemas/covalues#cofeed-declaration)`CoFeed` (declaration)

CoFeeds are a special CoValue type that represent a feed of values for a set of users/sessions (Each session of a user gets its own append-only feed).

They allow easy access of the latest or all items belonging to a user or their sessions. This makes them particularly useful for user presence, reactions, notifications, etc.

You define them by specifying the type of feed item:

```
const FeedOfTasks = co.feed(Task);
```

See the corresponding sections for [creating](https://jazz.tools/docs/react/using-covalues/cofeeds#creating-cofeeds), [subscribing/loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading), [reading from](https://jazz.tools/docs/react/using-covalues/cofeeds#reading-from-cofeeds) and [writing to](https://jazz.tools/docs/react/using-covalues/cofeeds#writing-to-cofeeds) CoFeeds.

### [](https://jazz.tools/docs/react/schemas/covalues#filestream-declaration)`FileStream` (declaration)

FileStreams are a special type of CoValue that represent binary data. (They are created by a single user and offer no internal collaboration.)

They allow you to upload and reference files.

You typically don't need to declare or extend them yourself, you simply refer to the built-in `co.fileStream()` from another CoValue:

```
const Document = co.map({
  title: z.string(),
  file: co.fileStream(),
});
```

See the corresponding sections for [creating](https://jazz.tools/docs/react/using-covalues/filestreams#creating-filestreams), [subscribing/loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading), [reading from](https://jazz.tools/docs/react/using-covalues/filestreams#reading-from-filestreams) and [writing to](https://jazz.tools/docs/react/using-covalues/filestreams#writing-to-filestreams) FileStreams.

**Note: For images, we have a special, higher-level `co.image()` helper, see [ImageDefinition](https://jazz.tools/docs/react/using-covalues/imagedef).**

### [](https://jazz.tools/docs/react/schemas/covalues#unions-of-comaps-declaration)Unions of CoMaps (declaration)

You can declare unions of CoMaps that have discriminating fields, using `z.discriminatedUnion()`.

```

const ButtonWidget = co.map({
  type: z.literal("button"),
  label: z.string(),
});

const SliderWidget = co.map({
  type: z.literal("slider"),
  min: z.number(),
  max: z.number(),
});

const WidgetUnion = z.discriminatedUnion([ButtonWidget, SliderWidget]);
```

See the corresponding sections for [creating](https://jazz.tools/docs/react/using-covalues/schemaunions#creating-schemaunions), [subscribing/loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading) and [narrowing](https://jazz.tools/docs/react/using-covalues/schemaunions#narrowing) SchemaUnions.

## [](https://jazz.tools/docs/react/schemas/covalues#covalue-fielditem-types)CoValue field/item types

Now that we've seen the different types of CoValues, let's see more precisely how we declare the fields or items they contain.

### [](https://jazz.tools/docs/react/schemas/covalues#primitive-fields)Primitive fields

You can declare primitive field types using `z` (re-exported in `jazz-tools` from [Zod](https://zod.dev/)):

```
import { co, z } from "jazz-tools";

const Person = co.map({
  title: z.string(),
})

export const ListOfColors = co.list(z.string());
```

Here's a quick overview of the primitive types you can use:

```
z.string();  // For simple strings
z.number();  // For numbers
z.boolean(); // For booleans
z.null();    // For null
z.date();    // For dates
z.literal(["waiting", "ready"]); // For enums
```

Finally, for more complex JSON data, that you _don't want to be collaborative internally_ (but only ever update as a whole), you can use more complex Zod types.

For example, you can use `z.object()` to represent an internally immutable position:

```
const Sprite = co.map({
  // assigned as a whole
  position: z.object({ x: z.number(), y: z.number() }),
});
```

Or you could use a `z.tuple()`:

```
const Sprite = co.map({
  // assigned as a whole
  position: z.tuple([z.number(), z.number()]),
});
```

### [](https://jazz.tools/docs/react/schemas/covalues#references-to-other-covalues)References to other CoValues

To represent complex structured data with Jazz, you form trees or graphs of CoValues that reference each other.

Internally, this is represented by storing the IDs of the referenced CoValues in the corresponding fields, but Jazz abstracts this away, making it look like nested CoValues you can get or assign/insert.

The important caveat here is that **a referenced CoValue might or might not be loaded yet,** but we'll see what exactly that means in [Subscribing and Deep Loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading).

In Schemas, you declare references by just using the schema of the referenced CoValue:

```
// schema.ts
const Person = co.map({
  name: z.string(),
});

const ListOfPeople = co.list(Person);

const Company = co.map({
  members: ListOfPeople,
});
```

#### [](https://jazz.tools/docs/react/schemas/covalues#optional-references)Optional References

You can make references optional with `z.optional()`:

```
const Person = co.map({
  pet: z.optional(Pet),
});
```

#### [](https://jazz.tools/docs/react/schemas/covalues#recursive-references)Recursive References

You can refer to the same schema from within itself using getters:

```
const Person = co.map({
  name: z.string(),
  get bestFriend() {
    return Person;
  }
});
```

You can use the same technique for mutually recursive references, but you'll need to help TypeScript along:

```
import { co, z, CoListSchema } from "jazz-tools";

const Person = co.map({
  name: z.string(),
  get friends(): CoListSchema<typeof Person> {
    return ListOfPeople;
  }
});

const ListOfPeople = co.list(Person);
```

Note: similarly, if you use modifiers like `z.optional()` you'll need to help TypeScript along:

```
const Person = co.map({
  name: z.string(),
  get bestFriend(): z.ZodOptional<typeof Person> {
    return z.optional(Person);
  }
});
```

### [](https://jazz.tools/docs/react/schemas/covalues#helper-methods)Helper methods

You can use the `withHelpers` method on CoValue schemas to add helper functions to the schema itself.

These typically take a parameter of a loaded CoValue of the schema.

```
const Person = co.map({
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.date(),
}).withHelpers((Self) => ({
  fullName(person: Loaded<typeof Self>) {
    return `${person.firstName} ${person.lastName}`;
  },

  ageAsOf(person: Loaded<typeof Self>, date: Date) {
    return differenceInYears(date, person.dateOfBirth);
  }
}));

const person = Person.create({
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: new Date("1990-01-01"),
});

const fullName = Person.fullName(person);
const age = Person.ageAsOf(person, new Date());
```
