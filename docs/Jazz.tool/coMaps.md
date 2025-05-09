CoMaps are key-value objects that work like JavaScript objects. You can access properties with dot notation and define typed fields that provide TypeScript safety. They're ideal for structured data that needs type validation.

## [](https://jazz.tools/docs/react/using-covalues/comaps#creating-comaps)Creating CoMaps

CoMaps are typically defined by extending the `CoMap` class and specifying primitive fields using the `co` declarer (see [Defining schemas: CoValues](https://jazz.tools/docs/react/schemas/covalues) for more details on primitive fields):

```
class Project extends CoMap {
  name = co.string;
  startDate = co.Date;
  status = co.literal("planning", "active", "completed");
  coordinator = co.optional.ref(Member);
}
```

You can create either struct-like CoMaps with fixed fields (as above) or record-like CoMaps for key-value pairs:

```
class Inventory extends CoMap.Record(co.number) {}
```

To instantiate a CoMap:

```
const project = Project.create({
  name: "Spring Planting",
  startDate: new Date("2025-03-15"),
  status: "planning",
});

const inventory = Inventory.create({
  tomatoes: 48,
  basil: 12,
});
```

### [](https://jazz.tools/docs/react/using-covalues/comaps#ownership)Ownership

When creating CoMaps, you can specify ownership to control access:

```
// Create with default owner (current user)
const privateProject = Project.create({
  name: "My Herb Garden",
  startDate: new Date("2025-04-01"),
  status: "planning",
});

// Create with shared ownership
const gardenGroup = Group.create();
gardenGroup.addMember(memberAccount, "writer");

const communityProject = Project.create(
  {
    name: "Community Vegetable Plot",
    startDate: new Date("2025-03-20"),
    status: "planning",
  },
  { owner: gardenGroup },
);
```

See [Groups as permission scopes](https://jazz.tools/docs/react/groups/intro) for more information on how to use groups to control access to CoMaps.

## [](https://jazz.tools/docs/react/using-covalues/comaps#reading-from-comaps)Reading from CoMaps

CoMaps can be accessed using familiar JavaScript object notation:

```
console.log(project.name);      // "Spring Planting"
console.log(project.status);    // "planning"
```

### [](https://jazz.tools/docs/react/using-covalues/comaps#handling-optional-fields)Handling Optional Fields

Optional fields require checks before access:

```
if (project.coordinator) {
  console.log(project.coordinator.name);  // Safe access
}
```

### [](https://jazz.tools/docs/react/using-covalues/comaps#working-with-record-comaps)Working with Record CoMaps

For record-type CoMaps, you can access values using bracket notation:

```
<div><pre tabindex="0"><code><span><span>const</span><span> inventory</span><span> =</span><span> Inventory</span><spanconst inventory = Inventory.create({
  tomatoes: 48,
  peppers: 24,
  basil: 12
});

console.log(inventory["tomatoes"]);  // 48
```

## [](https://jazz.tools/docs/react/using-covalues/comaps#updating-comaps)Updating CoMaps

Updating CoMap properties uses standard JavaScript assignment:

```
project.name = "Spring Vegetable Garden";    // Update name
project.startDate = new Date("2025-03-20");  // Update date
```

### [](https://jazz.tools/docs/react/using-covalues/comaps#type-safety)Type Safety

CoMaps are fully typed in TypeScript, giving you autocomplete and error checking:

```
project.name = "Spring Vegetable Planting";  // ✓ Valid string
project.startDate = "2025-03-15";  // ✗ Type error: expected Date
```

### [](https://jazz.tools/docs/react/using-covalues/comaps#deleting-properties)Deleting Properties

You can delete properties from CoMaps:

```
delete inventory["basil"];  // Remove a key-value pair

// For optional fields in struct-like CoMaps
project.coordinator = null;  // Remove the reference
```

## [](https://jazz.tools/docs/react/using-covalues/comaps#best-practices)Best Practices

### [](https://jazz.tools/docs/react/using-covalues/comaps#structuring-data)Structuring Data

- Use struct-like CoMaps for entities with fixed, known properties
- Use record-like CoMaps for dynamic key-value collections
- Group related properties into nested CoMaps for better organization

### [](https://jazz.tools/docs/react/using-covalues/comaps#common-patterns)Common Patterns

#### [](https://jazz.tools/docs/react/using-covalues/comaps#using-computed-properties)Using Computed Properties

CoMaps support computed properties and methods:

```
class ComputedProject extends CoMap {
  name = co.string;
  startDate = co.Date;
  endDate = co.optional.Date;

  get isActive() {
    const now = new Date();
    return now >= this.startDate && (!this.endDate || now <= this.endDate);
  }

  formatDuration(format: "short" | "full") {
    const start = this.startDate.toLocaleDateString();
    if (!this.endDate) {
      return format === "full"
        ? `Started on ${start}, ongoing`
        : `From ${start}`;
    }

    const end = this.endDate.toLocaleDateString();
    return format === "full"
      ? `From ${start} to ${end}`
      : `${(this.endDate.getTime() - this.startDate.getTime()) / 86400000} days`;
  }
}

// ...

console.log(computedProject.isActive); // false
console.log(computedProject.formatDuration("short")); // "3 days"
```
