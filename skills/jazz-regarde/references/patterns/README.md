# Patterns Reference

Common Jazz implementation patterns.

## Schema Patterns

### 1. Nested CoValue Creation

```typescript
const project = Project.create({
  title: "My Project",
  tasks: co.list(Task).create([
    { title: "Task 1", completed: false },
    { title: "Task 2", completed: false },
  ]),
});

await project.$jazz.waitForSync();
```

### 2. Recursive References

```typescript
const Category = co.map({
  name: z.string(),
  get parent(): co.Optional<typeof Category> {
    return co.optional(Category);
  },
});
```

### 3. Optional CoValues

```typescript
const User = co.map({
  name: z.string(),
  profile: co.optional(Profile),
  avatar: co.optional(co.image()),
});
```

### 4. Set-like Collection

```typescript
const Chat = co.map({
  participants: co.record(z.string(), User),
});

// Add participant
chat.participants.$jazz.set(userId, user);

// Check membership
const isMember = userId in chat.participants;
```

### 5. Soft Deletion

```typescript
const Task = co.map({
  title: z.string(),
  completed: z.boolean(),
  deleted: z.optional(z.boolean()),
});

function getActiveTasks(tasks: co.loaded<typeof TaskList>) {
  return tasks.filter((t) => {
    const isLoaded = t !== null && t.$isLoaded === true;
    return isLoaded === true && t.deleted !== true;
  });
}

// "Delete"
task.$jazz.set("deleted", true);
```

## Loading Patterns

### 1. Basic Loading

```typescript
const task = await Task.load(taskId, { loadAs: account });

const isLoaded = task !== null && task.$isLoaded === true;
if (isLoaded === false) {
  throw new Error("Task not found");
}

console.log(task.title);
```

### 2. Deep Loading

```typescript
const project = await Project.load(projectId, {
  loadAs: account,
  resolve: {
    tasks: { $each: { subtasks: true } },
    owner: { profile: true },
  },
});
```

### 3. Lazy Loading

```typescript
// Load initially
const account = await Account.load(accountId, { loadAs: me });

// Load more when needed
const { root } = await account.$jazz.ensureLoaded({
  resolve: { root: { myTasks: true } },
});
```

### 4. Subscription

```typescript
const unsubscribe = Task.subscribe(taskId, {}, (task) => {
  const isLoaded = task !== null && task.$isLoaded === true;
  if (isLoaded === true) {
    updateUI(task);
  }
});

// Later
unsubscribe();
```

### 5. Load Unique

```typescript
// By unique identifier
const settings = await Settings.loadUnique("user-settings", ownerGroupId, {
  resolve: { theme: true },
});
```

### 6. Upsert Unique

```typescript
const settings = await Settings.upsertUnique({
  unique: "user-settings",
  value: { theme: "dark" },
  owner: group,
});
```

## Update Patterns

### 1. Single Update

```typescript
task.$jazz.set("completed", true);
```

### 2. Batch Update

```typescript
Object.entries(updates).forEach(([key, value]) => {
  task.$jazz.set(key as keyof co.input<typeof Task>, value);
});
```

### 3. Transaction Pattern

```typescript
async function updateTask(
  task: co.loaded<typeof Task>,
  changes: Partial<co.input<typeof Task>>,
) {
  const updates = Object.entries(changes);

  for (const [key, value] of updates) {
    task.$jazz.set(key as keyof co.input<typeof Task>, value);
  }

  await task.$jazz.waitForSync();
}
```

### 4. List Operations

```typescript
// Push to end
tasks.$jazz.push({ title: "New" });

// Push to beginning
tasks.$jazz.unshift({ title: "First" });

// Replace
tasks.$jazz.set(0, { title: "Updated" });

// Remove
tasks.$jazz.remove(0);
tasks.$jazz.remove((t) => t.completed);
```

### 5. Safe Update

```typescript
async function updateTask(
  task: co.loaded<typeof Task>,
  updates: Partial<co.input<typeof Task>>,
) {
  const isLoaded = task !== null && task.$isLoaded === true;
  if (isLoaded === false) {
    throw new Error("Task not loaded");
  }

  const canWrite = co.account().getMe().canWrite(task) === true;
  if (canWrite === false) {
    throw new Error("Insufficient permissions");
  }

  Object.entries(updates).forEach(([key, value]) => {
    task.$jazz.set(key as keyof co.input<typeof Task>, value);
  });

  await task.$jazz.waitForSync();
}
```

## Migration Patterns

### 1. Basic Migration

```typescript
const MyAccount = co.account({ root: MyRoot }).withMigration((account) => {
  if (!account.$jazz.has("root")) {
    account.$jazz.set("root", { myData: [] });
  }
});
```

### 2. Versioned Migration

```typescript
const MyCoMap = co
  .map({
    version: z.literal([1, 2]),
    field1: z.string(),
    field2: z.optional(z.string()),
  })
  .withMigration((coMap) => {
    if (coMap.version === 1) {
      coMap.$jazz.set("field2", "");
      coMap.$jazz.set("version", 2);
    }
  });
```

### 3. Deep Migration

```typescript
const MyAccount = co
  .account({ root: MyRoot })
  .withMigration(async (account) => {
    const { root } = await account.$jazz.ensureLoaded({
      resolve: { root: true },
    });

    if (!root.$jazz.has("newField")) {
      root.$jazz.set("newField", []);
    }
  });
```

### 4. Schema Union Migration

```typescript
const TaskV1 = co.map({
  version: z.literal(1),
  title: z.string(),
});

const TaskV2 = co
  .map({
    version: z.literal(2),
    title: z.string(),
    priority: z.enum(["low", "medium", "high"]),
  })
  .withMigration((task) => {
    if (task.version === 1) {
      task.$jazz.set("priority", "medium");
      task.$jazz.set("version", 2);
    }
  });

export const Task = co.discriminatedUnion("version", [TaskV1, TaskV2]);
```

## Authentication Patterns

### 1. Multi-Auth Setup

```typescript
import { usePasskeyAuth, usePassphraseAuth } from "jazz-tools/react";

function AuthComponent() {
  const passkey = usePasskeyAuth({ appName: "MyApp" });
  const passphrase = usePassphraseAuth({ wordlist });

  if (passkey.state === "signedIn" || passphrase.state === "signedIn") {
    return <div>Welcome!</div>;
  }

  return (
    <div>
      <PasskeyForm auth={passkey} />
      <PassphraseForm auth={passphrase} />
    </div>
  );
}
```

### 2. Auto-Refresh Token

```typescript
import { useRegardeTokenAuth } from "@regarde-dev/core/react";

function ApiComponent() {
  const { regardeSDK } = useMyRegardeAccount();
  const { token, tokenId, isExpired, refresh, isLoading } = useRegardeTokenAuth(
    regardeSDK?.auth,
  );

  useEffect(() => {
    if (isExpired && !isLoading) {
      refresh();
    }
  }, [isExpired, isLoading, refresh]);

  // Use token for API calls
  // ...
}
```

### 3. Anonymous Migration

```typescript
import { JazzReactProvider } from "jazz-tools/react";

function App() {
  return (
    <JazzReactProvider
      sync={...}
      onAnonymousAccountDiscarded={async (anonymous) => {
        const me = await MyAccount.getMe().$jazz.ensureLoaded({
          resolve: { root: { myData: true } }
        });

        // Migrate data
        anonymous.root.myData.forEach((item) => {
          const isLoaded = item !== null && item.$isLoaded === true;
          if (isLoaded === true) {
            me.root.myData.$jazz.push(item);
          }
        });
      }}
    >
      <MyApp />
    </JazzReactProvider>
  );
}
```

## Permission Patterns

### 1. Role-Based Access

```typescript
function canEdit(user: Account, coValue: CoValue): boolean {
  return user.canWrite(coValue);
}

function canShare(user: Account, coValue: CoValue): boolean {
  return user.canManage(coValue);
}

function canAdmin(user: Account, coValue: CoValue): boolean {
  return user.canAdmin(coValue);
}
```

### 2. Group-Based Sharing

```typescript
const shareWithUser = async (
  coValue: CoValue,
  userId: string,
  role: "reader" | "writer",
) => {
  const group = coValue.$jazz.owner;
  const user = await co.account().load(userId);

  const isUserLoaded = user !== null && user.$isLoaded === true;
  if (isUserLoaded === false) {
    throw new Error("User not found");
  }

  group.addMember(user, role);
};
```

### 3. Public Sharing

```typescript
const makePublic = (coValue: CoValue) => {
  const group = coValue.$jazz.owner;
  group.makePublic();
};
```

## React Patterns

### 1. Loading State

```typescript
function MyComponent() {
  const account = useAccount(MyAccount);

  const isLoaded = account !== null && account.$isLoaded === true;
  if (isLoaded === false) {
    return <div>Loading...</div>;
  }

  return <div>{account.profile.name}</div>;
}
```

### 2. Error Handling

```typescript
function MyComponent() {
  const [error, setError] = useState<string | null>(null);
  const account = useAccount(MyAccount);

  useEffect(() => {
    const isLoaded = account !== null && account.$isLoaded === true;
    if (isLoaded === false && error === null) {
      setError("Failed to load");
    }
  }, [account, error]);

  if (error !== null) {
    return <div>Error: {error}</div>;
  }

  const isLoaded = account !== null && account.$isLoaded === true;
  if (isLoaded === false) {
    return <div>Loading...</div>;
  }

  return <div>{account.profile.name}</div>;
}
```

### 3. Dynamic Resolution

```typescript
function TaskList({ showDetails }: { showDetails: boolean }) {
  const tasks = useCoState(TaskList, listId, {
    resolve: showDetails
      ? { $each: { subtasks: true, details: true } }
      : { $each: true },
  });

  // ...
}
```

### 4. Select with Filter

```typescript
const tasks = useCoState(TaskList, listId, {
  resolve: { $each: true },
  select: (list) => {
    const isLoaded = list !== null && list.$isLoaded === true;
    if (isLoaded === false) return null;
    return list.filter((t) => {
      const isTaskLoaded = t !== null && t.$isLoaded === true;
      return isTaskLoaded === true && t.completed !== true;
    });
  },
});
```

### 5. Memoized Callbacks

```typescript
function TaskItem({ task }: { task: co.loaded<typeof Task> }) {
  const isLoaded = task !== null && task.$isLoaded === true;
  if (isLoaded === false) return null;

  const handleToggle = useCallback(() => {
    task.$jazz.set("completed", !task.completed);
  }, [task]);

  return <button onClick={handleToggle}>Toggle</button>;
}
```

### 6. useEffect for Side Effects

```typescript
function TaskItem({ taskId }: { taskId: string }) {
  const task = useCoState(Task, taskId);

  useEffect(() => {
    const isLoaded = task !== null && task.$isLoaded === true;
    if (isLoaded === true) {
      // Do something when task loads/changes
      analytics.track("task_viewed", { id: task.$jazz.id });
    }
  }, [task]);

  // ...
}
```

### 7. Composition Pattern

```typescript
function TaskList({ tasks }: { tasks: co.loaded<typeof TaskList> }) {
  return (
    <div>
      {tasks.map((task) => {
        const isLoaded = task !== null && task.$isLoaded === true;
        return isLoaded === true ? (
          <TaskItem key={task.$jazz.id} task={task} />
        ) : null;
      })}
    </div>
  );
}

function MyPage() {
  const account = useAccount(MyAccount, {
    resolve: { root: { myTasks: { $each: true } } }
  });

  const isLoaded = account !== null && account.$isLoaded === true;
  if (isLoaded === false) {
    return <div>Loading...</div>;
  }

  return <TaskList tasks={account.root.myTasks} />;
}
```

## Error Handling Patterns

### 1. Safe Access

```typescript
function getField<T>(coMap: co.loaded<typeof App>, key: string): T | null {
  const isLoaded = coMap !== null && coMap.$isLoaded === true;
  if (isLoaded === false) {
    return null;
  }

  if (coMap.$jazz.has(key) === false) {
    return null;
  }

  return coMap[key] as T;
}
```

### 2. Retry Pattern

```typescript
const loadWithRetry = async (
  id: string,
  retries = 3,
): Promise<co.loaded<typeof Task> | null> => {
  for (let i = 0; i < retries; i++) {
    const task = await Task.load(id, { loadAs: account });

    const isLoaded = task !== null && task.$isLoaded === true;
    if (isLoaded === true) {
      return task;
    }

    await new Promise((r) => setTimeout(r, 100 * (i + 1)));
  }

  return null;
};
```

### 3. Error Boundary

```typescript
class JazzErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Jazz error:", error);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

## Testing Patterns

### 1. Mock CoValues

```typescript
const mockTask = Task.create({
  title: "Test Task",
  completed: false,
});
```

### 2. Test Sync Safety

```typescript
test("should wait for sync after create", async () => {
  const task = Task.create({ title: "Test" });
  await task.$jazz.waitForSync();

  expect(task.$jazz.id).toBeDefined();
});
```

### 3. Test Loading

```typescript
test("should load task by ID", async () => {
  const task = Task.create({ title: "Test" });
  await task.$jazz.waitForSync();

  const loaded = await Task.load(task.$jazz.id, { loadAs: me });
  expect(loaded?.$isLoaded).toBe(true);
});
```

## Regarde-Specific Patterns

### 1. Initialize SDK

```typescript
export const initRegardeSDK = async (
  account: co.loaded<typeof RegardeAccount>,
  mode: "ensure" | "create"
): Promise<co.loaded<typeof RegardeSDK>> => {
  const isAccountValid = account !== null && account.$isLoaded === true;
  if (isAccountValid === false) {
    throw new Error("Account must be loaded");
  }

  const { root } = await account.$jazz.ensureLoaded({
    resolve: { root: { "regarde-sdk": true } }
  });

  const isRootLoaded = root !== null && root.$isLoaded === true;
  if (isRootLoaded === false) {
    throw new Error("Root not loaded");
  }

  let regardeSDK = root["regarde-sdk"];

  const isSdkLoaded =
    regardeSDK !== null && regardeSDK !== undefined && regardeSDK.$isLoaded === true;
  if (isSdkLoaded === false) {
    const userGroup = Group.create({ owner: account });
    userGroup.addMember(registryGroup, "writer");
    await userGroup.$jazz.waitForSync();

    regardeSDK = RegardeSDK.create({
      auth: RegardeTokenAuth.create({ ... }, { owner: userGroup }),
      myApps: co.list(App).create([], { owner: userGroup }),
      // ...
    }, { owner: userGroup });

    root.$jazz.set("regarde-sdk", regardeSDK);
    await regardeSDK.$jazz.waitForSync();
    await account.$jazz.waitForSync();
  }

  return regardeSDK;
};
```

### 2. Token Verification Flow

```typescript
async function verifyToken(req: Request, worker: Account) {
  const token = req.headers.get("X-Regarde-Token");
  const tokenId = req.headers.get("X-Regarde-Token-Id");

  if (token === null || token.length === 0) {
    throw new Error("Missing auth headers");
  }

  if (tokenId === null || tokenId.length === 0) {
    throw new Error("Missing auth headers");
  }

  const regardeAuth = await RegardeTokenAuth.load(tokenId, { loadAs: worker });

  const isAuthLoaded = regardeAuth !== null && regardeAuth.$isLoaded === true;
  if (isAuthLoaded === false) {
    throw new Error("Invalid token ID");
  }

  if (regardeAuth.token !== token) {
    throw new Error("Token mismatch");
  }

  if (Date.now() > regardeAuth.expiresAt) {
    throw new Error("Token expired");
  }

  // Load and verify ownership
  const userAccount =
    await regardeAuth.$jazz.owner.$jazz.owner.$jazz.ensureLoaded();
  const isUserLoaded = userAccount !== null && userAccount.$isLoaded === true;
  const canAdmin =
    isUserLoaded === true ? userAccount.canAdmin(regardeAuth) === true : false;
  if (canAdmin === false) {
    throw new Error("Ownership verification failed");
  }

  return { regardeAuth, userAccount };
}
```

### 3. Payment Event Creation

```typescript
async function recordPayment(
  paymentData: PaymentData,
  appId: string,
  worker: Account
) {
  // Get user's payment structure
  const userAccount = await Account.load(userId, { loadAs: worker });
  const regardeSDK = userAccount.root["regarde-sdk"];

  // Create PaymentEvent
  const paymentEvent = PaymentEvent.create({
    amount: paymentData.amount,
    app: appId,
    currency: paymentData.currency,
    metadata: { ... },
    prefixedProviderEventUUID: prefix + eventId,
    paymentStatus: "completed",
    timestamp: Date.now(),
    userAccount: userId,
  }, { owner: regardeSDK.myPayments.$jazz.owner });

  await paymentEvent.$jazz.waitForSync();

  // Index in user's payment structure
  regardeSDK.myPayments.$jazz.set(
    `${paymentData.eventId}`,
    paymentEvent.$jazz.id
  );
}
```
