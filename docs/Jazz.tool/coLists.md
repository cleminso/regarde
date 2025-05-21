CoLists are ordered collections that work like JavaScript arrays. They provide indexed access, iteration methods, and length properties, making them perfect for managing sequences of items.

## [](https://jazz.tools/docs/react/using-covalues/colists#creating-colists)Creating CoLists

CoLists are defined by specifying the type of items they contain:

```
import { co, z } from "jazz-tools";

const ListOfResources = co.list(z.string());

const ListOfTasks = co.list(Task);
```

To create a `CoList`:

```
// Create an empty list
const resources = co.list(z.string()).create([]);

// Create a list with initial items
const tasks = co.list(Task).create([
  Task.create({ title: "Prepare soil beds", status: "in-progress" }),
  Task.create({ title: "Order compost", status: "todo" })
]);
```

### [](https://jazz.tools/docs/react/using-covalues/colists#ownership)Ownership

Like other CoValues, you can specify ownership when creating CoLists.

```
// Create with shared ownership
const teamGroup = Group.create();
teamGroup.addMember(colleagueAccount, "writer");

const teamList = co.list(Task).create([], { owner: teamGroup });
```

See [Groups as permission scopes](https://jazz.tools/docs/react/groups/intro) for more information on how to use groups to control access to CoLists.

## [](https://jazz.tools/docs/react/using-covalues/colists#reading-from-colists)Reading from CoLists

CoLists support standard array access patterns:

```
// Access by index
const firstTask = tasks[0];
console.log(firstTask.title);  // "Prepare soil beds"

// Get list length
console.log(tasks.length);     // 2

// Iteration
tasks.forEach(task => {
  console.log(task.title);
  // "Prepare soil beds"
  // "Order compost"
});

// Array methods
const todoTasks = tasks.filter(task => task.status === "todo");
console.log(todoTasks.length); // 1
```

## [](https://jazz.tools/docs/react/using-covalues/colists#updating-colists)Updating CoLists

Update `CoList`s just like you would JavaScript arrays:

```
// Add items
resources.push("Tomatoes");       // Add to end
resources.unshift("Lettuce");     // Add to beginning
tasks.push(Task.create({          // Add complex items
  title: "Install irrigation",
  status: "todo"
}));

// Replace items
resources[0] = "Cucumber";           // Replace by index

// Modify nested items
tasks[0].status = "complete";        // Update properties of references
```

### [](https://jazz.tools/docs/react/using-covalues/colists#deleting-items)Deleting Items

Remove specific items by index with `splice`, or remove the first or last item with `pop` or `shift`:

```
// Remove 2 items starting at index 1
resources.splice(1, 2);
console.log(resources);              // ["Cucumber", "Peppers"]

// Remove a single item at index 0
resources.splice(0, 1);
console.log(resources);              // ["Peppers"]

// Remove items
const lastItem = resources.pop();    // Remove and return last item
resources.shift();                   // Remove first item
```

### [](https://jazz.tools/docs/react/using-covalues/colists#array-methods)Array Methods

`CoList`s support the standard JavaScript array methods you already know:

```
// Add multiple items at once
resources.push("Tomatoes", "Basil", "Peppers");

// Find items
const basil = resources.find(r => r === "Basil");

// Filter (returns regular array, not a CoList)
const tItems = resources.filter(r => r.startsWith("T"));
console.log(tItems); // ["Tomatoes"]

// Sort (modifies the CoList in-place)
resources.sort();
console.log(resources); // ["Basil", "Peppers", "Tomatoes"]
```

### [](https://jazz.tools/docs/react/using-covalues/colists#type-safety)Type Safety

CoLists maintain type safety for their items:

```
// TypeScript catches type errors
resources.push("Carrots");        // ✓ Valid string
resources.push(42);               // ✗ Type error: expected string

// For lists of references
tasks.forEach(task => {
  console.log(task.title);        // TypeScript knows task has title
});
```

## [](https://jazz.tools/docs/react/using-covalues/colists#best-practices)Best Practices

### [](https://jazz.tools/docs/react/using-covalues/colists#common-patterns)Common Patterns

#### [](https://jazz.tools/docs/react/using-covalues/colists#list-rendering)List Rendering

CoLists work well with UI rendering libraries:

```
import { co, z, Loaded } from "jazz-tools";
const ListOfTasks = co.list(Task);

// React example
function TaskList({ tasks: Loaded<typeof ListOfTasks> }) {
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          {task.title} - {task.status}
        </li>
      ))}
    </ul>
  );
}
```

#### [](https://jazz.tools/docs/react/using-covalues/colists#managing-relations)Managing Relations

CoLists can be used to create one-to-many relationships:

```
import { co, z } from "jazz-tools";

const Project = co.map({
  name: z.string(),
  tasks: co.list(Task),
});

// ...

const task = Task.create({
  title: "Plant seedlings",
  status: "todo",
  project: project, // Add a reference to the project
});

// Add a task to a garden project
project.tasks.push(task);

// Access the project from the task
console.log(task.project); // { name: "Garden Project", tasks: [task] }
```
