# Project Rules & Guidelines

This directory contains our strategic guidelines and philosophies for maintaining code quality and development practices.

## 📋 Available Guidelines

### [Testing Philosophy](./testing.md)

**Our "right-sized testing" approach that achieves comprehensive business logic coverage while avoiding over-engineering.**

- Core philosophy: "Test YOUR logic, trust the framework"
- Complete test suite runs fast
- 100% pass rate with no flaky tests

**Key sections:**

- What to test vs what to avoid
- Practical patterns and examples
- Strategic lessons from critical analysis
- Implementation guidelines

### [Testing Examples & Patterns](./testing-examples.md)

**Concrete examples and copy-paste patterns for implementing our testing philosophy.**

- Test template patterns for common scenarios
- Anti-patterns to avoid
- Utility patterns and mock data factories
- Quick decision guide for new tests

## Quick Reference

### When to Test

**Test YOUR business logic:**

- Validation rules and constraints
- Data transformation logic
- Error recovery workflows
- Performance boundaries

### When NOT to Test

**Trust the framework:**

- Jazz synchronization
- React rendering
- HTTP handling
- Database operations

### Decision Tree

```
New Test Idea → Is this YOUR business logic?
                ↓ YES              ↓ NO
            Write focused test   Trust framework
```

## Getting Started

1. **Read the [Testing Philosophy](./testing.md)** to understand our approach
2. **Use the [Examples & Patterns](./testing-examples.md)** for implementation
3. **Follow the decision tree** when adding new tests
4. **Maintain the balance** between coverage and simplicity

## Key Principles

> **"Test how YOUR code responds to framework events, not whether the framework produces those events correctly."**

- Focus on business logic, not framework behavior
- Keep tests simple and fast
- Document business rules through tests
- Resist over-engineering pressure
- Maintain high reliability with minimal complexity

---

_These guidelines reflect our successful implementation of enterprise-grade testing that balances comprehensive coverage with maintainability and speed._
