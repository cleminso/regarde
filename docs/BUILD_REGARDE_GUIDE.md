# Layer Interaction Guide

Quick reference for knowing which layer to use and what questions to ask.

## The Decision Tree

```
What are you trying to do?
│
├─→ Define data structure? → SCHEMA
│
├─→ Read/display existing data? → HOOKS
│
├─→ Create/update/delete data? → MANAGERS
│
├─→ Build a form? → FRONTEND (Jotai) → calls MANAGERS
│
└─→ Handle loading states? → HOOKS (MaybeLoaded pattern)
```

---

## Layer 1: Schema

**When to use:** Defining data structures, types, relationships

### Checklist

- [ ] Does this field need validation constraints (`.min()`, `.max()`)?
- [ ] Is this field required or optional?
- [ ] What type should this be? (string, number, CoMap, CoList)
- [ ] Does this CoValue reference other CoValues?
- [ ] What are the ownership/permission rules?

### Key Questions

1. **What is the shape of this data?**
   - Use Zod primitives: `z.string()`, `z.number()`, `z.boolean()`
   - Use Jazz types: `co.map()`, `co.list()`, `co.record()`

2. **Is this collaborative or static?**
   - Collaborative: Use `co.map()`, `co.list()`
   - Static: Use Zod primitives

3. **What are the constraints?**
   - Min/max length: `z.string().min(1).max(100)`
   - Enum values: `z.enum(["stripe", "polar"])`
   - URL format: `z.url()`

4. **Is this optional?**
   - Required: `field: z.string()`
   - Optional: `field: z.optional(z.string())`

---

## Layer 2: Managers

**When to use:** Creating, updating, deleting data + business logic + validation

### Checklist

- [ ] Do I validated inputs before the Jazz operation?
- [ ] I'm checking `$isLoaded` before accessing CoValue properties?
- [ ] I'm calling `waitForSync()` after mutations?
- [ ] Is the owner group properly set?
- [ ] Are errors handled and logged?

### Key Questions

1. **What validation is needed?**
   - Create validation function: `validateCreateXParams()`
   - Return: `{ success: boolean, errors?: Record<string, string> }`
   - Call validation before any Jazz operations

2. **Is the data loaded?**

   ```typescript
   const isLoaded = app.$isLoaded === true;
   if (isLoaded === false) {
     throw new Error("App must be loaded");
   }
   ```

3. **What is the mutation sequence?**
   - Create → `waitForSync()` → push to list → `waitForSync()`
   - Update fields → `waitForSync()`
   - Never skip `waitForSync()` between dependent operations

4. **What group owns this data?**
   - Pass to `.create()`: `Webhook.create(data, { owner: ownerGroup })`

5. **How should errors be handled?**
   - Try/catch around operations
   - Log with context: `logger.error({ message, data: { ... } })`
   - Throw descriptive errors: `throw new Error("Failed to create: " + message)`

### Red Flags

- Direct `$jazz.set()` in components (always use managers)
- Skipping validation
- Forgetting `waitForSync()`
- Not checking `$isLoaded`

### Example

```typescript
// packages/sdk/src/core/managers/webhookManager.ts

// 1. Define validation
export const validateCreateWebhookParams = (params): ValidationResult => {
  const errors: Record<string, string> = {};
  if (params.name.trim().length === 0) {
    errors.name = "Name is required";
  }
  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true };
};

// 2. Create function with validation
export const createWebhook = async (app, params): Promise<TWebhook> => {
  // Validate first
  const validation = validateCreateWebhookParams(params);
  if (validation.success === false) {
    throw new Error("Validation failed: " + JSON.stringify(validation.errors));
  }

  // Check loaded
  if (app.$isLoaded === false) {
    throw new Error("App not loaded");
  }

  // Create with owner
  const webhook = Webhook.create(params, { owner: app.$jazz.owner });
  await webhook.$jazz.waitForSync();

  // Add to parent list
  app.webhooks.$jazz.push(webhook);
  await app.webhooks.$jazz.waitForSync();

  return webhook;
};
```

---

## Layer 3: Hooks

**When to use:** Reading data, subscribing to changes, handling loading states

### Checklist

- [ ] I'm using `useCoState()` or `useAccount()` with proper resolve queries?
- [ ] I'm handling all MaybeLoaded states? (undefined, null, loaded)
- [ ] I'm checking `$isLoaded` before accessing nested properties?
- [ ] Is the resolve query fetching all needed nested data?

### Key Questions

1. **What data do I need?**
   - Single CoValue: `useCoState(Schema, id, { resolve: {...} })`
   - Account data: `useAccount(AccountSchema, { resolve: {...} })`

2. **What nested data to resolve?**

   ```typescript
   useCoState(RegardeApp, appId, {
     resolve: {
       webhooks: { $each: true }, // Load all webhooks
       profile: true, // Load profile
     },
   });
   ```

3. **How to handle loading states?**
   - `undefined` = Initial loading
   - `null` = Not found/unauthorized/unavailable
   - Loaded = Check `$isLoaded === true`

4. **What to return?**
   - Simple: `MaybeLoaded<T>` (undefined | null | loaded)
   - Complex: Object with `isLoading` flag + filtered data

### Red Flags

- Mutating data in hooks (hooks are read-only)
- Not resolving nested data (causes $isLoaded checks everywhere)
- Not handling `null` case (unauthorized/unavailable)
- Using hooks for form state (use Jotai instead)

### Example

```typescript
// packages/sdk/src/frameworks/react/hooks/useRegardeApp.ts
export const useRegardeApp = (appId: string) => {
  const app = useCoState(RegardeApp, appId, {
    resolve: {
      webhooks: { $each: true },
      profile: true,
    }
  });

  // Return MaybeLoaded<TRegardeApp>
  return app;
};

// Usage in component
const app = useRegardeApp(appId);
if (app === undefined) return <Loading />;
if (app === null) return <NotFound />;
if (app.$isLoaded === false) return <Loading />;
// Now safe to use: app.webhooks, app.profile, etc.
```

---

## Common Scenarios

### Scenario 1: "I need to add a new field to webhooks"

1. **Schema**: Add field to `Webhook` CoMap
2. **Manager**: Update `CreateWebhookParams` interface
3. **Manager**: Update validation if needed
4. **Frontend**: Update `WebhookFormData` interface
5. **Frontend**: Update Jotai atoms (form + validation)

### Scenario 2: "I need to display a list of webhooks"

1. **Hooks**: Already resolved in `useRegardeApp` with `{ webhooks: { $each: true } }`
2. **Component**: Use hook, check `$isLoaded`, render list

### Scenario 3: "I need to update a webhook"

1. **Manager**: Ensure `updateWebhook` handles the field
2. **Manager**: Add validation to `validateWebhookUpdates` if needed
3. **Component**: Call `updateWebhook(webhook, { field: value })`

### Scenario 4: "Form validation isn't working"

1. Check Jotai `formErrorsAtom` logic
2. Check `canSubmitAtom` is used to disable button
3. Check SDK `validateCreateWebhookParams` for server-side backup

---

## Anti-Patterns to Avoid

| Don't                              | Do Instead                  | Why                                     |
| ---------------------------------- | --------------------------- | --------------------------------------- |
| Direct `$jazz.set()` in components | Call SDK managers           | Consistency, validation, error handling |
| Skip `waitForSync()`               | Always call after mutations | Data consistency                        |
| Use `key` prop for form reset      | Use Jotai `resetFormAtom`   | Clean state management                  |
| Validation only in schema          | Add manager validation      | Jazz default is "warn" mode             |
| Complex `useState` chains          | Use Jotai atoms             | Cleaner, derived state support          |
| Mutate in hooks                    | Hooks are read-only         | Separation of concerns                  |
| Ignore `$isLoaded`                 | Always check before access  | Type safety, loading states             |

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│  SCHEMA        → Define structure       │
│  HOOKS         → Read data              │
│  MANAGERS      → Write + validate       │
│  FRONTEND      → Form state + UX        │
└─────────────────────────────────────────┘
```
