# Design Documents

Catalogue of Regarde design principles and patterns.

---

## Documents

### [Core Beliefs](./core-beliefs.md)
**Description**: Foundational principles guiding technical decisions. Covers codebase longevity, boolean pattern origins, explicit over implicit, self-documenting code, type safety, and local-first philosophy.

**Status**: Verified
**Last Reviewed**: 2025-03-17

---

### [Code Style](./code-style.md)
**Description**: Comprehensive style guide enforced by oxlint. Boolean patterns, MaybeLoaded pattern, type predicates, naming conventions, import order, Tailwind guidelines, and commenting standards.

**Status**: Verified
**Last Reviewed**: 2025-03-17

---

### [Jazz Patterns](./jazz-patterns.md)
**Description**: Practical patterns for working with Jazz. Sync safety (Write-Wait-Use), authentication flow, schema usage, group permissions, variable naming conventions, and loading patterns.

**Status**: Verified
**Last Reviewed**: 2025-03-17

---

### [Data Ownership](./data-ownership.md)
**Description**: Clear ownership boundaries for data integrity and security. User-owned data, worker-owned data (user READ access), registry-owned data (worker only), and common mistakes to avoid.

**Status**: Verified
**Last Reviewed**: 2025-03-17

---

## Quick Reference

| Document | Focus | When to Read |
|----------|-------|--------------|
| Core Beliefs | Philosophy | Before making architectural decisions |
| Code Style | Implementation | Daily reference while coding |
| Jazz Patterns | Jazz-specific | When implementing Jazz features |
| Data Ownership | Security model | Before creating new schemas |

## Related

- [Architecture Overview](../ARCHITECTURE.md) - System architecture
- [Specs Index](../specs/index.md) - Package specifications
- [PLANS.md](../PLANS.md) - Active development plans
