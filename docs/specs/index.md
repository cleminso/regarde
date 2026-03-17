# Specifications Index

Cross-reference of packages to their specifications.

---

## Package Specifications

| Package                   | Spec Location                            | Purpose                                           | Grade |
| ------------------------- | ---------------------------------------- | ------------------------------------------------- | ----- |
| **sdk**                   | [sdk-public-api.md](./sdk-public-api.md) | Client-side SDK with Jazz schemas and React hooks | B+    |
| **api.regarde.dev**       | [api-server.md](./api-server.md)         | Stateless Hono API for webhooks and registry      | B     |
| **dashboard.regarde.dev** | [dashboard-app.md](./dashboard-app.md)   | Web dashboard for app management                  | C+    |

---

## Specification Details

### SDK Public API

**File**: [sdk-public-api.md](./sdk-public-api.md)

Public interface for `@regarde-dev/core`. Handles app lifecycle, token generation, payment operations, and React hooks.

**Key Sections**:

- Schema hierarchy (user-owned and worker-owned)
- Manager functions reference
- React hooks specification
- Error handling patterns

---

### API Server

**File**: [api-server.md](./api-server.md)

Stateless Hono-based API server. Token verification, nickname registry, app registration, webhook processing.

**Key Sections**:

- Domain-driven architecture
- Authentication flow
- Webhook handlers by provider
- Rate limiting and middleware

---

### Dashboard App

**File**: [dashboard-app.md](./dashboard-app.md)

Web interface for managing Regarde apps. React 19, TanStack Router, Jotai state management.

**Key Sections**:

- Architecture and routing
- State management patterns
- Table and form components
- Webhook configuration UI

---

## Grade Definitions

| Grade | Meaning                                                    |
| ----- | ---------------------------------------------------------- |
| A     | Production-ready, fully documented, comprehensive tests    |
| B+    | Solid implementation, minor gaps in edge case handling     |
| B     | Good foundation, needs consolidation in some areas         |
| C+    | Basic functionality working, needs polish and completeness |

---

## Related

- [Architecture Overview](../ARCHITECTURE.md) - System architecture and component relationships
- [Design Docs](../design-docs/index.md) - Design principles and patterns
- [PLANS.md](../PLANS.md) - Active development plans
