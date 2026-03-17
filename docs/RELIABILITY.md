# Reliability Patterns

This document covers testing philosophy, sync safety invariants, and reliability patterns.

## Testing Philosophy

### What to Test

- **Validation rules** - Ensure data constraints are enforced
- **Data transformation** - Verify mapping and conversion logic
- **Error recovery** - Test graceful degradation paths
- **Business logic** - Validate core domain operations

### What NOT to Test

- **Jazz sync internals** - Assume the framework works
- **Framework behavior** - Trust React, Next.js, etc.
- **External APIs** - Mock third-party services

```typescript
// Do test: business logic
describe('should calculate discount when member tier is GOLD', () => {
  // Implementation
});

// Don't test: Jazz framework internals
describe('Jazz should sync CoValues', () => {
  // Unnecessary - trust the framework
});
```

## Testing Patterns

### Naming Conventions

Tests follow the pattern: `"should [outcome] when [condition]"`

```typescript
it('should reject negative amounts when amount is below zero', () => {
  expect(() => createPayment(-10)).toThrow('Amount must be positive');
});
```

### Folder Structure

Tests live in `__tests__/` folders next to implementation:

```
src/
  utils/
    parseDate.ts
    __tests__/
      parseDate.test.ts
  validation/
    projectSchema.ts
    __tests__/
      projectSchema.test.ts
```

### Test Structure

```typescript
describe('Project validation', () => {
  describe('createProject', () => {
    it('should create project when all required fields present', () => {
      // Arrange
      const input = validProjectData();
      
      // Act
      const result = createProject(input);
      
      // Assert
      expect(result.name).toBe(input.name);
    });
    
    it('should throw ValidationError when name is empty', () => {
      expect(() => createProject({ ...validProjectData(), name: '' }))
        .toThrow(ValidationError);
    });
  });
});
```

## Sync Safety Invariants

### Write-Wait-Use Pattern

**Critical**: Always wait for sync before reading after CoMap writes.

See [jazz-patterns.md](jazz-patterns.md#sync-safety) for comprehensive patterns and examples.

**Key Patterns**:
- **Write-Wait-Use**: Create → waitForSync() → Read
- **Create-Set-Sync**: Create with initial data → waitForSync()
- **Explicit Loading Checks**: Use `=== true`/`=== false` for `$isLoaded` checks

**Invariant**: All CoMap mutations must be followed by `await coMap.$jazz.waitForSync()` before subsequent reads.

### Common Mistakes

```typescript
// Mistake: Reading immediately after write
project.name = 'New Name';
return project.name; // May return old value!

// Fix
project.name = 'New Name';
await project.$jazz.waitForSync();
return project.name; // Safe

// Mistake: Implicit truthiness checks
if (data) { ... } // Wrong

// Fix
if (data !== null && data !== undefined) { ... } // Correct
```

## Error Handling

### Handle at Boundaries

Errors should be caught at business logic boundaries:

```typescript
async function createProject(data: unknown): Promise<Result<Project>> {
  try {
    const validated = projectSchema.parse(data);
    const project = await db.projects.create(validated);
    return { success: true, data: project };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof ValidationError 
        ? error 
        : new UnknownError('Failed to create project') 
    };
  }
}
```

### Specific Error Types

```typescript
class ValidationError extends Error {
  constructor(message: string, public fields: string[]) {
    super(message);
  }
}

class SyncError extends Error {
  constructor(message: string, public retryable: boolean) {
    super(message);
  }
}
```

### Never Swallow Errors

```typescript
// Wrong
try {
  await riskyOperation();
} catch (e) {
  // Silent failure
}

// Correct
try {
  await riskyOperation();
} catch (e) {
  logger.error('Operation failed', e);
  throw new RecoverableError('Please try again', { cause: e });
}
```

### Validation at Boundaries

All external input must be validated with Zod:

```typescript
const apiInputSchema = z.object({
  projectId: z.string().uuid(),
  amount: z.number().positive(),
});

export function handleApiRequest(rawData: unknown) {
  const data = apiInputSchema.parse(rawData);
  // Now safe to use data
}
```

## Data Integrity

### Forward/Reverse Registry Consistency

Admin CLI maintains consistency between registries:

```typescript
// When adding a domain
await admin.addDomain('example.com', { forward: true, reverse: true });
// Both forward and reverse entries created atomically
```

Always verify both registries after operations:

```bash
regarde admin verify registries
```

### Backup Before Destructive Operations

```typescript
async function deleteProject(projectId: string) {
  const backup = await createBackup(projectId);
  try {
    await db.projects.delete(projectId);
  } catch (e) {
    await restoreBackup(backup);
    throw e;
  }
}
```

### Audit Logging

All data modifications must be logged:

```typescript
interface AuditLog {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: Date;
  changes: Record<string, unknown>;
}
```

## Reliability Checklist

Before committing code:

- [ ] All CoMap writes followed by `waitForSync()` before reads
- [ ] Tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm format-and-lint`)
- [ ] No implicit truthiness checks (use `=== true/false`)
- [ ] All external inputs validated with Zod
- [ ] Errors handled at boundaries, not silently swallowed
- [ ] Explicit return types on public functions
- [ ] Types use 'T' prefix (enforced by oxlint)
- [ ] No `any` types used
- [ ] Public SDK functions have JSDoc
- [ ] Audit logs added for data modifications
