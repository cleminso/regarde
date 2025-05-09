**CoValues ("Collaborative Values") are the core abstraction of Jazz.** They're your bread-and-butter datastructures that you use to represent everything in your app.

As their name suggests, CoValues are inherently collaborative, meaning **multiple users and devices can edit them at the same time.**

**Think of CoValues as "super-fast Git for lots of tiny data."**

- CoValues keep their full edit histories, from which they derive their "current state".
- The fact that this happens in an eventually-consistent way makes them [CRDTs](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type).
- Having the full history also means that you often don't need explicit timestamps and author info - you get this for free as part of a CoValue's [edit metadata](https://jazz.tools/docs/react/using-covalues/metadata).

CoValues model JSON with CoMaps and CoLists, but also offer CoFeeds for simple per-user value feeds, and let you represent binary data with FileStreams.

## [](https://jazz.tools/docs/react/schemas/covalues#start-your-app-with-a-schema)Start your app with a schema

Fundamentally, CoValues are as dynamic and flexible as JSON, but in Jazz you use them by defining fixed schemas to describe the shape of data in your app.

This helps correctness and development speed, but is particularly important...

- when you evolve your app and need migrations
- when different clients and server workers collaborate on CoValues and need to make compatible changes

Thinking about the shape of your data is also a great first step to model your app.

Even before you know the details of how your app will work, you'll probably know which kinds of objects it will deal with, and how they relate to each other.

Jazz makes it quick to declare schemas, since they are simple TypeScript classes:

```
export class TodoProject extends CoMap {
    title = co.string;
    tasks = co.ref(ListOfTasks);
}
```

Here you can see how we extend a CoValue type and use `co` for declaring (collaboratively) editable fields. This means that schema info is available for type inference _and_ at runtime.

Classes might look old-fashioned, but Jazz makes use of them being both types and values in TypeScript, letting you refer to either with a single definition and import.

```
import { TodoProject, ListOfTasks } from "./schema";

const project: TodoProject = TodoProject.create(
    {
        title: "New Project",
        tasks: ListOfTasks.create([], Group.create()),
    },
    Group.create()
);
```

## [](https://jazz.tools/docs/react/schemas/covalues#types-of-covalues)Types of CoValues

### [](https://jazz.tools/docs/react/schemas/covalues#comap-declaration)`CoMap` (declaration)

CoMaps are the most commonly used type of CoValue. They are the equivalent of JSON objects. (Collaborative editing follows a last-write-wins strategy per-key.)

You can either declare struct-like CoMaps:

```
class Person extends CoMap {
    name = co.string;
    age = co.number;
    pet = co.optional.ref(Pet);
}
```

Or record-like CoMaps (key-value pairs, where keys are always `string`):

```
class ColorToHex extends CoMap.Record(co.string) {}

class ColorToFruit extends CoMap.Record(co.ref(Fruit)) {}
```

See the corresponding sections for [creating](https://jazz.tools/docs/react/using-covalues/creation#comap-creation), [subscribing/loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading), [reading from](https://jazz.tools/docs/react/using-covalues/reading#comap-reading) and [writing to](https://jazz.tools/docs/react/using-covalues/writing#comap-writing) CoMaps.

### [](https://jazz.tools/docs/react/schemas/covalues#colist-declaration)`CoList` (declaration)

CoLists are ordered lists and are the equivalent of JSON arrays. (They support concurrent insertions and deletions, maintaining a consistent order.)

You define them by specifying the type of the items they contain:

```
class ListOfColors extends CoList.Of(co.string) {}

class ListOfTasks extends CoList.Of(co.ref(Task)) {}
```

See the corresponding sections for [creating](https://jazz.tools/docs/react/using-covalues/creation#colist-creation), [subscribing/loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading), [reading from](https://jazz.tools/docs/react/using-covalues/reading#colist-reading) and [writing to](https://jazz.tools/docs/react/using-covalues/writing#colist-writing) CoLists.

### [](https://jazz.tools/docs/react/schemas/covalues#cofeed-declaration)`CoFeed` (declaration)

CoFeeds are a special CoValue type that represent a feed of values for a set of users / sessions. (Each session of a user gets its own append-only feed.)

They allow easy access of the latest or all items belonging to a user or their sessions. This makes them particularly useful for user presence, reactions, notifications, etc.

You define them by specifying the type of feed item:

```
class FeedOfTasks extends CoFeed.Of(co.ref(Task)) {}
```

See the corresponding sections for [creating](https://jazz.tools/docs/react/using-covalues/creation#cofeed-creation), [subscribing/loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading), [reading from](https://jazz.tools/docs/react/using-covalues/reading#cofeed-reading) and [writing to](https://jazz.tools/docs/react/using-covalues/writing#cofeed-writing) CoFeeds.

### [](https://jazz.tools/docs/react/schemas/covalues#filestream-declaration)`FileStream` (declaration)

FileStreams are a special type of CoValue that represent binary data. (They are created by a single user and offer no internal collaboration.)

They allow you to upload and reference files, images, etc.

You typically don't need to declare or extend them yourself, you simply refer to the built-in `FileStream` from another CoValue:

```
import { FileStream } from "jazz-tools";

class UserProfile extends CoMap {
    name = co.string;
    avatar = co.ref(FileStream);
}
```

See the corresponding sections for [creating](https://jazz.tools/docs/react/using-covalues/creation#filestream-creation), [subscribing/loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading), [reading from](https://jazz.tools/docs/react/using-covalues/reading#filestream-reading) and [writing to](https://jazz.tools/docs/react/using-covalues/writing#filestream-writing) FileStreams.

### [](https://jazz.tools/docs/react/schemas/covalues#schemaunion-declaration)`SchemaUnion` (declaration)

SchemaUnion is a helper type that allows you to load and refer to multiple subclasses of a CoMap schema, distinguished by a discriminating field.

You declare them with a base class type and discriminating lambda, in which you have access to the `RawCoMap`, on which you can call `get` with the field name to get the discriminating value.

```
import { SchemaUnion, CoMap } from "jazz-tools";

class BaseWidget extends CoMap {
  type = co.string;
}

class ButtonWidget extends BaseWidget {
  type = co.literal("button");
  label = co.string;
}

class SliderWidget extends BaseWidget {
  type = co.literal("slider");
  min = co.number;
  max = co.number;
}

const WidgetUnion = SchemaUnion.Of<BaseWidget>((raw) => {
  switch (raw.get("type")) {
    case "button": return ButtonWidget;
    case "slider": return SliderWidget;
    default: throw new Error("Unknown widget type");
  }
});
```

See the corresponding sections for [creating](https://jazz.tools/docs/react/using-covalues/creation#schemaunion-creation), [subscribing/loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading) and [narrowing](https://jazz.tools/docs/react/using-covalues/reading#schemaunion-narrowing) SchemaUnions.

## [](https://jazz.tools/docs/react/schemas/covalues#covalue-fielditem-types)CoValue field/item types

Now that we've seen the different types of CoValues, let's see more precisely how we declare the fields or items they contain.

### [](https://jazz.tools/docs/react/schemas/covalues#primitive-fields)Primitive fields

You can declare primitive field types using the `co` declarer:

```
import { co } from "jazz-tools";

export class Person extends CoMap {
    title = co.string;
}

export class ListOfColors extends CoList.Of(co.string) {}
```

Here's a quick overview of the primitive types you can use:

```
co.string;
co.number;
co.boolean;
co.null;
co.Date;
co.literal("waiting", "ready");
```

Finally, for more complex JSON data, that you _don't want to be collaborative internally_ (but only ever update as a whole), you can use `co.json<T>()`:

```
co.json<{ name: string }>();
```

For more detail, see the API Reference for the [`co` field declarer](https://jazz.tools/api-reference/jazz-tools#co).

### [](https://jazz.tools/docs/react/schemas/covalues#refs-to-other-covalues)Refs to other CoValues

To represent complex structured data with Jazz, you form trees or graphs of CoValues that reference each other.

Internally, this is represented by storing the IDs of the referenced CoValues in the corresponding fields, but Jazz abstracts this away, making it look like nested CoValues you can get or assign/insert.

The important caveat here is that **a referenced CoValue might or might not be loaded yet,** but we'll see what exactly that means in [Subscribing and Deep Loading](https://jazz.tools/docs/react/using-covalues/subscription-and-loading).

In Schemas, you declare Refs using the `co.ref<T>()` declarer:

```
class Company extends CoMap {
    members = co.ref(ListOfPeople);
}

class ListOfPeople extends CoList.Of(co.ref(Person)) {}
```

#### [](https://jazz.tools/docs/react/schemas/covalues#optional-refs)Optional Refs

⚠️ If you want to make a referenced CoValue field optional, you _have to_ use `co.optional.ref<T>()`: ⚠️

```
class Person extends CoMap {
    pet = co.optional.ref(Pet);
}
```

### [](https://jazz.tools/docs/react/schemas/covalues#computed-fields--methods)Computed fields & methods

Since CoValue schemas are based on classes, you can easily add computed fields and methods:

```
class Person extends CoMap {
    firstName = co.string;
    lastName = co.string;
    dateOfBirth = co.Date;

    get name() {
        return `${this.firstName} ${this.lastName}`;
    }

    ageAsOf(date: Date) {
        return differenceInYears(date, this.dateOfBirth);
    }
}
```
