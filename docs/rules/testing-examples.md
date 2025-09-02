# Testing Examples & Patterns

> **Copy-paste examples from our proven approach**

**Results**: Eliminated 197 over-engineered tests (48% reduction) while maintaining 100% business logic coverage.

---

## Test Business Logic

### Validation Rules

```typescript
// GOOD: Test validation logic
function validateNickname(nickname: string) {
  if (nickname.length < 3) return { isValid: false, error: "Too short" };
  if (!/^[a-zA-Z0-9_-]+$/.test(nickname))
    return { isValid: false, error: "Invalid characters" };
  return { isValid: true };
}

it("should reject short nicknames", () => {
  expect(validateNickname("ab").isValid).toBe(false);
  expect(validateNickname("ab").error).toBe("Too short");
});
```

### Data Transformation

```typescript
// GOOD: Test formatting logic
function formatUserProfile(profile: any) {
  return {
    displayName: profile.name || "Unknown User",
    nickname: profile.userHandle?.nickname || "nickname-not-set",
    projectCount: profile.projects?.length || 0,
  };
}

it("should format profile correctly", () => {
  const profile = { name: "John", projects: ["p1", "p2"] };
  const result = formatUserProfile(profile);

  expect(result.displayName).toBe("John");
  expect(result.projectCount).toBe(2);
});
```

### Error Recovery

```typescript
// GOOD: Test error decisions
function determineRetryStrategy(errorType: string, attemptCount: number) {
  if (errorType === "validation") return { shouldRetry: false };
  return { shouldRetry: attemptCount < 3, backoffMs: 1000 * attemptCount };
}

it("should not retry validation errors", () => {
  expect(determineRetryStrategy("validation", 0).shouldRetry).toBe(false);
});
```

## Don't Test Framework Behavior

### What We Removed (Examples from our cleanup)

```typescript
// BAD: Testing React rendering (removed 86 tests like this)
it('should render the component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});

// BAD: Testing property access (removed 45 tests like this)
it('should have correct profile name', () => {
  expect(profile.name).toBe("John Doe");
});

// BAD: Testing JavaScript operators (removed 66 tests like this)
it('should detect changes correctly', () => {
  expect(oldValue !== newValue).toBe(true); // Testing !== operator!
});
```

### What We Kept (Real business logic)

```typescript
// GOOD: Testing OUR validation rules
it("should reject invalid nicknames", () => {
  expect(validateNickname("a@b").isValid).toBe(false);
});

// GOOD: Testing OUR data transformation
it("should format display names correctly", () => {
  expect(formatDisplayName(null)).toBe("Unknown User");
});
```

## Test Templates

### Basic Test Template

```typescript
import { describe, it, expect } from "vitest";

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

### Edge Case Testing

```typescript
// Test boundary conditions systematically
const edgeCases = [
  { input: "", expectedError: "Required field" },
  { input: "ab", expectedError: "Too short" },
  { input: "abc", expectedValid: true },
  { input: "a".repeat(21), expectedError: "Too long" },
];

edgeCases.forEach(({ input, expectedError, expectedValid }) => {
  it(`should handle "${input}" correctly`, () => {
    const result = validateInput(input);

    if (expectedError) {
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(expectedError);
    } else {
      expect(result.isValid).toBe(true);
    }
  });
});
```

### Mock Data Factory

```typescript
// Create reusable test data
export function createMockProfile(overrides = {}) {
  return {
    id: "test-profile-id",
    name: "Test User",
    bio: "Test bio",
    projects: [],
    ...overrides,
  };
}

// Usage
it("should handle user with many projects", () => {
  const user = createMockProfile({
    projects: Array(150).fill({ title: "Project" }),
  });

  const result = validateUser(user);
  expect(result.errors).toContain("Too many projects");
});
```

---

## Quick Decision Guide

**Before writing any test, ask:**

1. **Is this MY business logic?** → Test it
2. **Is this framework behavior?** → Skip it
3. **Not sure?** → Probably framework, skip it

---

## Our Proven Results

**Eliminated 197 over-engineered tests across three packages:**

- **Profile-App**: 360 → 168 tests (192 removed)
- **Shared-Schemas**: 17 → 12 tests (5 removed)
- **Profile-Worker**: 32 tests (kept - already well-designed)

**Key insight**: Most "business logic" tests were actually testing JavaScript operators (`!==`, `?.`, `&&`) and framework behavior.

**Result**: 48% reduction in tests, 100% business logic coverage maintained, <3 second test execution.

---

_These patterns reflect our successful implementation that eliminated nearly 200 over-engineered tests while maintaining comprehensive business logic protection._
