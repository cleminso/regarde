CoMaps are key-value objects that work like JavaScript objects. You can access properties with dot notation and define typed fields that provide TypeScript safety. They're ideal for structured data that needs type validation.

## [](https://jazz.tools/docs/react/using-covalues/comaps#creating-comaps)Creating CoMaps

CoMaps are typically defined with `co.map()` and specifying primitive fields using `z` (see [Defining schemas: CoValues](https://jazz.tools/docs/react/schemas/covalues) for more details on primitive fields):

```
import { co, z } from "jazz-tools";

const Project = co.map({
  name: z.string(),
  startDate: z.date(),
  status: z.literal(["planning", "active", "completed"]),
  coordinator: z.optional(Member),
});
```

You can create either struct-like CoMaps with fixed fields (as above) or record-like CoMaps for key-value pairs:

```
const Inventory = co.record(z.string(), z.number());
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
const inventory = Inventory.create({
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
project.startDate = "2025-03-15"; // ✗ Type error: expected DateType 'string' is not assignable to type 'Date'.
```

### [](https://jazz.tools/docs/react/using-covalues/comaps#deleting-properties)Deleting Properties

You can delete properties from CoMaps:

```
delete inventory["basil"];  // Remove a key-value pair

// For optional fields in struct-like CoMaps
project.coordinator = undefined;  // Remove the reference
```

## [](https://jazz.tools/docs/react/using-covalues/comaps#best-practices)Best Practices

### [](https://jazz.tools/docs/react/using-covalues/comaps#structuring-data)Structuring Data

- Use struct-like CoMaps for entities with fixed, known properties
- Use record-like CoMaps for dynamic key-value collections
- Group related properties into nested CoMaps for better organization

### [](https://jazz.tools/docs/react/using-covalues/comaps#common-patterns)Common Patterns

#### [](https://jazz.tools/docs/react/using-covalues/comaps#helper-methods)Helper methods

You can add helper methods to your CoMap schema to make it more useful:

```
import { co, z, Loaded } from "jazz-tools";

const Project = co.map({
  name: z.string(),
  startDate: z.date(),
  endDate: z.optional(z.date()),
}).withHelpers((Self) => ({
  isActive(project: Loaded<typeof Self>) {
    const now = new Date();
    return now >= project.startDate && (!project.endDate || now <= project.endDate);
  },

  formatDuration(project: Loaded<typeof Self>, format: "short" | "full") {
    const start = project.startDate.toLocaleDateString();
    if (!project.endDate) {
      return format === "full"
        ? `Started on ${start}, ongoing`
        : `From ${start}`;
    }

    const end = project.endDate.toLocaleDateString();
    return format === "full"
      ? `From ${start} to ${end}`
      : `${(project.endDate.getTime() - project.startDate.getTime()) / 86400000} days`;
  }
}));

const project = Project.create({
  name: "My project",
  startDate: new Date("2025-04-01"),
  endDate: new Date("2025-04-04"),
});

console.log(Project.isActive(project)); // false
console.log(Project.formatDuration(project, "short")); // "3 days"
```
