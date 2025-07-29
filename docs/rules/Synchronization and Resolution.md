Rule 1: Handle All Three Loading States
**Why:** Jazz's subscription model is asynchronous and permission-aware. The three states represent the complete lifecycle of data access.

Every subscription must handle:

- `undefined`: Initial loading state, value is being fetched
- `null`: CoValue not found or not accessible (permissions/missing)
- `Value`: Successfully loaded CoValue instance

```typescript
// ✅ Always handle all states
const task = useCoState(Task, taskId);
if (task === undefined) {
  return "Loading...";
} else if (task === null) {
  return "Task not found or not accessible";
} else {
  return <TaskComponent task={task} />;
}
```

**Why this matters:** Failing to handle `undefined` causes render errors during loading. Failing to handle `null` causes crashes when users lack permissions or data is deleted.

### Rule 2: Understand Fail-Fast Resolution

**Why:** Jazz prioritizes data consistency over partial loading. If any requested reference is inaccessible, the entire load operation returns `null` to prevent inconsistent application state.

```typescript
// ❌ This returns null if assignee is inaccessible
const task = await Task.load(taskId, {
  resolve: { assignee: true },
});

// ✅ Use conditional resolution or separate loads
const task = await Task.load(taskId);
const assignee = task ? await task.assignee?.load() : null;
```

**Why this matters:** A single inaccessible reference can break your entire UI if you rely on fail-fast resolution. Progressive loading provides better user experience.

## **Migration and Account Rules**

### Rule 3: Migration Completion vs Data Availability

**Why:** Jazz waits for migration to finish server-side, but client-side group synchronization is asynchronous. Groups need to propagate from server to client before being accessible.

```typescript
// ✅ Progressive loading pattern
const { me } = useAccount(MyAccount, {
  resolve: { profile: true }, // Start shallow
});

// Then load deeper as needed
const deepData = useCoState(Profile, me?.profile?.id, {
  resolve: me?.profile ? { onboarding: true } : undefined,
});
```

**Why this matters:** Attempting to resolve newly-created nested CoMaps immediately after migration often fails with "Owner group not available" because the client hasn't received the group data yet.

### Rule 4: Use ensureLoaded for Guaranteed Resolution

**Why:** Sometimes you need atomic operations that require all data to be present. `ensureLoaded` guarantees the specified resolution depth before proceeding.

```typescript
// ✅ Ensure data is loaded before operations
const loadedProject = await project.ensureLoaded({
  resolve: {
    tasks: { $each: true },
  },
});
// Now safely access loadedProject.tasks
```

**Why this matters:** Critical operations (like data processing or complex updates) need guaranteed data availability to prevent runtime errors.

Rule 5: Be Explicit About Resolution Depth
**Why:** Jazz's graph-like data structure allows infinite nesting. Being explicit prevents over-loading (performance) and under-loading (runtime errors).

```typescript
// ✅ Explicit resolution
const project = useCoState(Project, projectId, {
  resolve: {
    tasks: { $each: true },
    owner: true,
  },
});

// ❌ Avoid over-resolution
const project = useCoState(Project, projectId, {
  resolve: true, // Loads everything, may cause failures
});
```

**Why this matters:** Over-resolution can fail due to inaccessible deep references. Under-resolution leads to `undefined` values when you expect data.

### Rule 6: Use $onError for Fault-Tolerant Lists

**Why:** In collaborative environments, list items may become inaccessible due to permission changes. `$onError` provides graceful degradation instead of complete failure.

```typescript
// ✅ Handle inaccessible list items gracefully
const friends = await co.list(Person).load(listId, {
  resolve: {
    $each: { $onError: null },
  },
});
// friends[0] might be null due to access rights
```

**Why this matters:** Without `$onError`, a single inaccessible list item causes the entire list load to fail, breaking your UI completely.

### Rule 7: Understand Reference vs Resolution Difference

**Why:** Jazz treats explicitly resolved references as requirements (must be accessible) versus implicit references as optional (can be null).

```typescript
// ✅ Non-resolved reference approach
const project = await Project.load(projectId, { resolve: true });
const owner = project?.owner; // null if inaccessible, doesn't fail load

// ❌ Resolved reference approach (fails if owner inaccessible)
const project = await Project.load(projectId, {
  resolve: { owner: true },
});
```

**Why this matters:** This distinction determines whether your load operation succeeds or fails based on permission boundaries.

## **Type Safety Rules**

### Rule 8: Use co.loaded for Type Safety

**Why:** TypeScript can't infer which CoMap references are loaded vs unloaded. `co.loaded` provides compile-time guarantees about data availability.

```typescript
// ✅ Type-safe resolution expectations
type ProjectWithTasks = co.loaded<typeof Project, {
  tasks: { $each: true };
}>;

function TaskList({ project }: { project: ProjectWithTasks }) {
  // TypeScript knows tasks are loaded
  return project.tasks.map(task => <div key={task.id}>{task.title}</div>);
}
```

**Why this matters:** Prevents runtime errors by catching data access issues at compile time, especially when passing data between components.

## **Permission and Group Rules**

### Rule 9: Account for Group Creation Timing

**Why:** When migrations create groups, there's a delay between server-side creation and client-side availability. The client needs to receive and process group membership data.

```typescript
// ✅ Conditional resolution based on availability
const { me } = useAccount(MyAccount, {
  resolve: {
    profile: true,
    root: me?.profile ? { someField: true } : undefined,
  },
});
```

**Why this matters:** Attempting to resolve references to newly-created groups immediately often fails because the client hasn't synchronized the group data yet.

### Rule 10: Handle Optional Fields Properly

**Why:** Jazz distinguishes between `undefined` (not set/loaded) and `null` (set but inaccessible). Migrations need this distinction to avoid overwriting existing data.

```typescript
// ✅ Check for undefined specifically (not just falsy)
if (account.root === undefined) {
  account.root = MyAppRoot.create({...});
}

// ✅ In migrations, use ensureLoaded for nested checks
const { root } = await account.ensureLoaded({
  resolve: { root: true }
});
if (root.myBookmarks === undefined) {
  root.myBookmarks = co.list(Bookmark).create([]);
}
```

**Why this matters:** Using falsy checks (`!account.root`) would incorrectly trigger recreation when data is simply inaccessible (`null`).

## **Subscription Lifecycle Rules**

### Rule 11: Use Framework Hooks for Automatic Cleanup

**Why:** Manual subscriptions require explicit cleanup to prevent memory leaks. Framework hooks handle the subscription lifecycle automatically.

```typescript
// ✅ Automatic subscription management
const task = useCoState(Task, taskId, { resolve: { assignee: true } });

// ❌ Manual subscription (only for non-React contexts)
const unsubscribe = Task.subscribe(taskId, {}, callback);
```

**Why this matters:** Forgotten `unsubscribe()` calls lead to memory leaks and potential performance issues in long-running applications.

### Rule 12: Progressive Data Access Pattern

**Why:** Complex nested data often has varying synchronization timing. Progressive loading adapts to this reality instead of fighting it.

```typescript
// ✅ Progressive loading
const { me } = useAccount(MyAccount, { resolve: { profile: true } });
const profileDetails = useCoState(Profile, me?.profile?.id, {
  resolve: me?.profile
    ? {
        onboarding: true,
        projects: { $each: true },
      }
    : undefined,
});
```

**Why this matters:** Attempting to load deeply nested data immediately often fails due to group synchronization delays, especially after account creation.

## **Error Handling Rules**

### Rule 13: Distinguish Loading vs Access Errors

**Why:** Users need different feedback for "data is loading" vs "you don't have permission." The distinction affects UX and debugging.

```typescript
// ✅ Clear error distinction
if (data === undefined) {
  return <LoadingSpinner />;
}
if (data === null) {
  return <AccessDeniedMessage />;
}
return <DataComponent data={data} />;
```

**Why this matters:** Showing "Access Denied" during normal loading confuses users. Showing "Loading..." for permanent permission issues provides false hope.

### Rule 14: Use Conditional Rendering for Nested Access

**Why:** Nested CoMaps may not be available immediately, even if the parent is loaded. Conditional rendering prevents accessing potentially `null` values.

```typescript
// ✅ Conditional rendering
{me?.profile?.onboarding && (
  <OnboardingComponent onboarding={me.profile.onboarding} />
)}

// ❌ Don't force resolution of potentially unavailable data
{me.profile.onboarding && ( // May be null due to access
  <OnboardingComponent onboarding={me.profile.onboarding} />
)}
```

**Why this matters:** Nested properties can be `null` due to permissions or synchronization delays, even when the parent object exists.

## **Nested Properties Best Practices**

### Best Practice 1: Layer Your Data Access

**Why:** Nested data has cascading dependencies. Each level may have different availability timing.

```typescript
// ✅ Layered approach
const { me } = useAccount(MyAccount, { resolve: { profile: true } });
const profile = me?.profile;
const onboarding = useCoState(OnboardingNickname, profile?.onboarding?.id);
const projects = useCoState(ListOfProjects, profile?.projects?.id, {
  resolve: { $each: true },
});

// ❌ Deep resolution that often fails
const { me } = useAccount(MyAccount, {
  resolve: {
    profile: {
      onboarding: true,
      projects: { $each: true },
    },
  },
});
```

### Best Practice 2: Use Optional Chaining Throughout

**Why:** Any level in a nested chain can be `null` or `undefined`. Optional chaining prevents runtime errors.

```typescript
// ✅ Safe nested access
const nickname = me?.profile?.onboarding?.nickname;
const firstProject = me?.profile?.projects?.[0]?.title;

// ❌ Unsafe access
const nickname = me.profile.onboarding.nickname; // Can crash
```

### Best Practice 3: Validate Nested Data Before Operations

**Why:** Operations on nested data should ensure all required levels are available.

```typescript
// ✅ Validation before operations
function updateOnboarding(newNickname: string) {
  if (!me?.profile?.onboarding) {
    console.warn("Onboarding data not available");
    return;
  }
  me.profile.onboarding.nickname = newNickname;
}

// ❌ Assuming availability
function updateOnboarding(newNickname: string) {
  me.profile.onboarding.nickname = newNickname; // Can crash
}
```

### Best Practice 4: Use Loading States for Each Level

**Why:** Different nesting levels may load at different times. Users need appropriate feedback.

```typescript
// ✅ Level-specific loading states
function ProfileComponent() {
  const { me } = useAccount(MyAccount, { resolve: { profile: true }});
  const onboarding = useCoState(OnboardingNickname, me?.profile?.onboarding?.id);

  if (!me) return <div>Loading account...</div>;
  if (!me.profile) return <div>Loading profile...</div>;
  if (!me.profile.onboarding && onboarding === undefined) {
    return <div>Loading onboarding...</div>;
  }
  if (onboarding === null) {
    return <div>Onboarding data not accessible</div>;
  }

  return <OnboardingDisplay onboarding={onboarding} />;
}
```

### Best Practice 5: Design for Partial Availability

**Why:** In collaborative environments, users may lose access to nested data at any time.

```typescript
// ✅ Graceful degradation
function ProfileView({ profile }: { profile: LoadedProfile }) {
  return (
    <div>
      <h1>{profile.name}</h1>
      {profile.onboarding ? (
        <OnboardingSection onboarding={profile.onboarding} />
      ) : (
        <div>Onboarding information not available</div>
      )}
      {profile.projects?.length > 0 ? (
        <ProjectsList projects={profile.projects} />
      ) : (
        <div>No projects visible</div>
      )}
    </div>
  );
}
```
