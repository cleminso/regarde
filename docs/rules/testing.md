# Pragmatic Testing Philosophy

> **Core Principle:** "Test business logic, trust the framework"

**Proven Results:** Successfully eliminated 197 over-engineered tests (48% reduction) while maintaining 100% business logic coverage across three packages.

---

# Testing Guidelines - Simplified Approach

## DO Test:

- Complex business logic (nickname conflict resolution)
- Custom validation rules (profile completeness)
- Integration between packages
- Real user error scenarios
- Performance of critical business functions

## DON'T Test:

- Zod schema parsing (trust the framework)
- Jazz framework behavior (trust the framework)
- React hook lifecycle (trust the framework)
- Basic property assignments (trivial operations)
- Theoretical scenarios (test what exists)

## Test Naming Convention:

- `should [business outcome] when [business condition]`
- Focus on WHAT the business logic should achieve
- Avoid HOW the implementation works

## Example:

`should suggest alternative nicknames when requested nickname is taken`
`should call UserHandle.shape.nickname.parse() without throwing`

---

## Quick Decision Guide

**Ask yourself:** _"Is this MY business logic or framework behavior?"_

- **MY logic** → Test it
- **Framework behavior** → Trust it
- **Not sure?** → Probably framework behavior, skip it

## Examples: What to Test vs Skip

### DO Test (Business Logic)

```typescript
// GOOD: Test validation rules
function validateNickname(nickname: string) {
  if (nickname.length < 3) return { isValid: false, error: "Too short" };
  if (!/^[a-zA-Z0-9_-]+$/.test(nickname))
    return { isValid: false, error: "Invalid characters" };
  return { isValid: true };
}

it("should reject short nicknames", () => {
  expect(validateNickname("ab").isValid).toBe(false);
});
```

```typescript
// GOOD: Test data transformation
function formatUserProfile(profile: any) {
  return {
    displayName: profile.name || "Unknown User",
    nickname: profile.userHandle?.nickname || "nickname-not-set",
  };
}
```

### DON'T Test (Framework Behavior)

```typescript
// BAD: Testing React hooks
expect(useCoState).toHaveBeenCalledWith("profile-id");

// BAD: Testing HTTP requests
expect(fetch).toHaveBeenCalledWith("/api/register");

// BAD: Testing property access
expect(profile.name).toBe("John Doe");
```

## Proven Results

**Our "simplify-first" approach eliminated 197 over-engineered tests across three packages:**

- **Profile-App**: 360 → 168 tests (192 removed)
- **Shared-Schemas**: 17 → 12 tests (5 removed)
- **Profile-Worker**: 32 tests (kept - already well-designed)

**Total**: 409 → 212 tests (48% reduction, 100% business logic coverage maintained)

---

## Common Patterns

### Good Test Pattern

```typescript
// Extract business logic, test it simply
function calculateSyncState(currentState: string, action: string) {
  switch (action) {
    case "start":
      return "syncing";
    case "success":
      return "saved";
    case "error":
      return "error";
    default:
      return currentState;
  }
}

it("should transition states correctly", () => {
  expect(calculateSyncState("saved", "start")).toBe("syncing");
});
```

### Bad Test Pattern

```typescript
// BAD: Testing framework behavior
const mockUseCoState = vi.fn();
const mockUseAccount = vi.fn();
// ... 50 lines of mocking setup
expect(mockUseCoState).toHaveBeenCalledWith("profile-id");
```

## When to Write Tests

**Simple decision tree:**

1. **Is this MY business logic?** → Test it
2. **Is this framework behavior?** → Skip it
3. **Not sure?** → Probably framework, skip it

**Examples:**

- Validation rules, data transformation, error recovery
- React hooks, HTTP requests, database operations

---

## Quick Setup

### Test File Structure

```
src/
├── lib/
│   └── __tests__/       # Business logic tests
└── components/
    └── __tests__/       # Component logic tests (rare)
```

### Test Template

```typescript
describe("Module Name - Business Logic", () => {
  it("should handle valid input", () => {
    const result = myBusinessFunction(validInput);
    expect(result.isValid).toBe(true);
  });

  it("should reject invalid input", () => {
    const result = myBusinessFunction(invalidInput);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Expected error message");
  });
});
```

---

## How to Use & Run Tests

### Running Tests

**All packages:**

```bash
# From project root
pnpm test --run
```

**Individual packages:**

```bash
cd packages/profile-app && pnpm test --run

cd packages/shared-schemas && pnpm test --run

cd packages/profile-worker && pnpm test --run
```

**Watch mode during development:**

```bash
pnpm test --watch
```

### Writing New Tests

**1. Create test file:**

```bash
# For business logic
src/lib/validation/__tests__/myLogic.test.ts

# For component logic (rare)
src/components/myComponent/__tests__/myComponent.test.tsx
```

**2. Use our template:**

```typescript
import { describe, it, expect } from "vitest";

describe("MyModule - Business Logic", () => {
  it("should handle valid input", () => {
    const result = myBusinessFunction(validInput);
    expect(result.isValid).toBe(true);
  });
});
```

**3. Focus on business logic:**

- Validation rules, data transformation, error recovery
- React hooks, HTTP requests, property access

### Performance Expectations

- **Total suite**: <3 seconds
- **Individual packages**: <2 seconds each
- **Single test file**: <100ms

If tests are slower, you're probably testing framework behavior.

---

## Key Takeaways

**Our proven approach:**

1. **Test business logic** - validation, transformation, error recovery
2. **Trust the framework** - React, Jazz, HTTP, databases work correctly
3. **Quality over quantity** - 212 focused tests > 409 scattered tests
4. **Fast execution** - All tests complete in <3 seconds

**When in doubt:** If you're not sure whether to test something, it's probably framework behavior - skip it.

---

## FAQ

**Q: Should I test this validation function?**
A: If it contains business rules → Yes

**Q: Should I test this API call?**
A: Test business logic that processes the response, not the HTTP request

**Q: Should I test this React component?**
A: Only if it has complex display logic (rare)

**Q: Should I test error handling?**
A: Test error recovery decisions, not that errors occur

---
