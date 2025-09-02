# Testing Examples & Patterns

> **Quick reference for implementing our right-sized testing philosophy**

This document provides concrete examples and copy-paste patterns for maintaining our focused testing approach.

---

## Test Template Patterns

### 1. Business Logic Function Testing

```typescript
/**
 * Template for testing pure business logic functions
 */
import { describe, it, expect } from "vitest";

// Simple business logic function to test
function validateBusinessRule(input: any) {
  const errors: string[] = [];

  // YOUR validation logic here
  if (!input.required) errors.push("Required field missing");
  if (input.value < 0) errors.push("Value must be positive");

  return {
    isValid: errors.length === 0,
    errors,
  };
}

describe("Business Rule Validation - Your Logic", () => {
  it("should accept valid input", () => {
    const validInput = { required: "value", value: 10 };
    const result = validateBusinessRule(validInput);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject invalid input with specific errors", () => {
    const invalidInput = { value: -5 };
    const result = validateBusinessRule(invalidInput);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Required field missing");
    expect(result.errors).toContain("Value must be positive");
  });

  it("should handle edge cases", () => {
    const edgeCase = { required: "", value: 0 };
    const result = validateBusinessRule(edgeCase);

    // Test YOUR specific edge case logic
    expect(result.isValid).toBe(true); // or false, depending on YOUR rules
  });
});
```

### 2. Error Recovery Logic Testing

```typescript
/**
 * Template for testing error recovery and retry logic
 */
function determineRecoveryAction(errorType: string, attemptCount: number) {
  const strategies = {
    network: { maxRetries: 3, backoffMs: 1000 },
    validation: { maxRetries: 0, backoffMs: 0 },
    permission: { maxRetries: 1, backoffMs: 2000 },
  };

  const strategy = strategies[errorType] || strategies["network"];
  const shouldRetry = attemptCount < strategy.maxRetries;

  return {
    shouldRetry,
    backoffMs: shouldRetry ? strategy.backoffMs * attemptCount : 0,
    giveUp: !shouldRetry,
  };
}

describe("Error Recovery Logic - Your Strategy", () => {
  it("should retry network errors with backoff", () => {
    const result = determineRecoveryAction("network", 1);

    expect(result.shouldRetry).toBe(true);
    expect(result.backoffMs).toBe(1000);
    expect(result.giveUp).toBe(false);
  });

  it("should not retry validation errors", () => {
    const result = determineRecoveryAction("validation", 0);

    expect(result.shouldRetry).toBe(false);
    expect(result.giveUp).toBe(true);
  });

  it("should stop retrying after max attempts", () => {
    const result = determineRecoveryAction("network", 3);

    expect(result.shouldRetry).toBe(false);
    expect(result.giveUp).toBe(true);
  });
});
```

### 3. Data Transformation Testing

```typescript
/**
 * Template for testing data formatting and transformation
 */
function formatDataForDisplay(rawData: any) {
  return {
    displayName: rawData.name || "Unknown",
    formattedDate: rawData.timestamp
      ? new Date(rawData.timestamp).toLocaleDateString()
      : "No date",
    itemCount: rawData.items?.length || 0,
    status: rawData.active ? "Active" : "Inactive",
  };
}

describe("Data Formatting - Your Transform Logic", () => {
  it("should format complete data correctly", () => {
    const rawData = {
      name: "Test Item",
      timestamp: 1640995200000, // Jan 1, 2022
      items: ["item1", "item2"],
      active: true,
    };

    const result = formatDataForDisplay(rawData);

    expect(result.displayName).toBe("Test Item");
    expect(result.formattedDate).toBe("1/1/2022");
    expect(result.itemCount).toBe(2);
    expect(result.status).toBe("Active");
  });

  it("should handle missing data gracefully", () => {
    const incompleteData = { active: false };
    const result = formatDataForDisplay(incompleteData);

    expect(result.displayName).toBe("Unknown");
    expect(result.formattedDate).toBe("No date");
    expect(result.itemCount).toBe(0);
    expect(result.status).toBe("Inactive");
  });
});
```

### 4. Performance Boundary Testing

```typescript
/**
 * Template for testing performance boundaries of YOUR logic
 */
function processLargeDataset(items: any[]) {
  const startTime = performance.now();

  // YOUR processing logic
  const processed = items.map((item) => ({
    ...item,
    processed: true,
    timestamp: Date.now(),
  }));

  const endTime = performance.now();
  const processingTime = endTime - startTime;

  // YOUR business rules for performance
  if (processingTime > 1000) {
    throw new Error("Processing took too long");
  }

  return {
    processed,
    processingTime,
    itemCount: items.length,
  };
}

describe("Performance Boundaries - Your Processing Logic", () => {
  it("should process normal datasets efficiently", () => {
    const normalDataset = Array(100).fill({ id: 1, name: "item" });
    const result = processLargeDataset(normalDataset);

    expect(result.itemCount).toBe(100);
    expect(result.processingTime).toBeLessThan(100); // YOUR performance requirement
    expect(result.processed).toHaveLength(100);
  });

  it("should handle large datasets within limits", () => {
    const largeDataset = Array(1000).fill({ id: 1, name: "item" });

    expect(() => processLargeDataset(largeDataset)).not.toThrow();
  });

  it("should reject datasets that exceed YOUR limits", () => {
    // Test YOUR business rule about maximum size
    const oversizedDataset = Array(10000).fill({ id: 1, name: "item" });

    // This depends on YOUR specific business rules
    expect(() => processLargeDataset(oversizedDataset)).toThrow(
      "Processing took too long",
    );
  });
});
```

---

## Anti-Patterns to Avoid

### Don't Test Framework Behavior

```typescript
// BAD: Testing React rendering
it('should render the component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});

// GOOD: Test YOUR display logic
it('should format greeting correctly', () => {
  const greeting = formatGreeting('World');
  expect(greeting).toBe('Hello, World!');
});
```

### Don't Test Implementation Details

```typescript
// BAD: Testing how it's called
it("should call the function with correct parameters", () => {
  const mockFn = vi.fn();
  myFunction(mockFn);
  expect(mockFn).toHaveBeenCalledWith(expectedParams);
});

// GOOD: Test what it produces
it("should produce correct result", () => {
  const result = myFunction(input);
  expect(result).toEqual(expectedOutput);
});
```

### Don't Test External Dependencies

```typescript
// BAD: Testing database operations
it("should save to database", () => {
  const mockSave = vi.fn();
  database.save = mockSave;
  myFunction();
  expect(mockSave).toHaveBeenCalled();
});

// GOOD: Test YOUR data preparation logic
it("should prepare data for saving", () => {
  const rawData = {
    /* input */
  };
  const prepared = prepareForSave(rawData);
  expect(prepared).toEqual(expectedFormat);
});
```

---

## Utility Patterns

### Mock Data Factories

```typescript
// Create reusable mock data factories
export function createMockUser(overrides = {}) {
  return {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    active: true,
    createdAt: Date.now(),
    ...overrides,
  };
}

export function createMockProfile(overrides = {}) {
  return {
    id: "test-profile-id",
    name: "Test Profile",
    bio: "Test bio",
    projects: [],
    workExp: [],
    socialLinks: {},
    ...overrides,
  };
}

// Usage in tests
it("should handle user with many projects", () => {
  const userWithManyProjects = createMockUser({
    projects: Array(150).fill({ title: "Project" }),
  });

  const result = validateUser(userWithManyProjects);
  expect(result.errors).toContain("Too many projects");
});
```

### Edge Case Testing Patterns

```typescript
// Test boundary conditions systematically
const edgeCases = [
  { input: "", expectedError: "Required field" },
  { input: "a", expectedError: "Too short" },
  { input: "ab", expectedError: "Too short" },
  { input: "abc", expectedValid: true },
  { input: "a".repeat(20), expectedValid: true },
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

### Error Scenario Testing

```typescript
// Test different error scenarios systematically
const errorScenarios = [
  {
    name: "network error",
    error: { type: "network", message: "Connection failed" },
    expectedRetry: true,
    expectedBackoff: 1000,
  },
  {
    name: "validation error",
    error: { type: "validation", message: "Invalid input" },
    expectedRetry: false,
    expectedBackoff: 0,
  },
  {
    name: "permission error",
    error: { type: "permission", message: "Access denied" },
    expectedRetry: false,
    expectedBackoff: 0,
  },
];

errorScenarios.forEach(({ name, error, expectedRetry, expectedBackoff }) => {
  it(`should handle ${name} correctly`, () => {
    const result = handleError(error);

    expect(result.shouldRetry).toBe(expectedRetry);
    expect(result.backoffMs).toBe(expectedBackoff);
  });
});
```

---

## Test File Organization

### Recommended Structure

```
src/
├── components/
│   ├── profile/
│   │   ├── header.tsx
│   │   └── __tests__/
│   │       └── header.test.tsx        # Test display logic only
│   └── editor/
│       ├── form.tsx
│       └── __tests__/
│           └── form.test.tsx          # Test form logic only
├── lib/
│   ├── validation/
│   │   ├── profile.ts
│   │   └── __tests__/
│   │       └── profile.test.ts        # Test validation logic
│   └── utils/
│       ├── formatting.ts
│       └── __tests__/
│           └── formatting.test.ts     # Test utility functions
└── test-utils/
    ├── index.ts                       # Export all test utilities
    ├── mock-data.ts                   # Mock data factories
    └── helpers.ts                     # Test helper functions
```

### Test File Template

```typescript
/**
 * Focused tests for [module] - testing YOUR [specific logic type]
 */

import { describe, it, expect } from "vitest";
import { createMockData } from "../test-utils";

// Import the business logic functions to test
import { functionToTest } from "../module";

describe("[Module Name] - Your [Logic Type]", () => {
  it("should handle valid input correctly", () => {
    // Test the happy path
  });

  it("should reject invalid input with clear errors", () => {
    // Test validation and error handling
  });

  it("should handle edge cases gracefully", () => {
    // Test boundary conditions
  });

  it("should perform within acceptable limits", () => {
    // Test performance boundaries if applicable
  });
});
```

---

## Quick Decision Guide

**Before writing any test, ask:**

1. **Is this testing MY business logic?** → If yes, continue
2. **Is this testing framework behavior?** → If yes, stop
3. **Will this test catch MY bugs?** → If no, reconsider
4. **Is this test simple and focused?** → If no, simplify
5. **Will this test be reliable?** → If no, redesign

**Remember:** The goal is confidence in YOUR code, not comprehensive coverage of everything.

---

_Use these patterns to maintain our right-sized testing philosophy while ensuring comprehensive coverage of business logic._
