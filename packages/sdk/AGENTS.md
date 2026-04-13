# SDK Package

## Overview

**@regarde-dev/core** is the client-side SDK for Regarde. Initializes Jazz-based CoMaps in user accounts, manages registration tokens (2FA), provides React hooks, and handles app/payment state. The SDK manages payment provider integrations (Stripe, Polar) with checkout, subscription, and refund operations.

## Quick Commands

```bash
pnpm dev              # Watch mode with .env.local
pnpm build            # Production build
```

## Architecture Notes

| Layer    | Impact                    | Responsibility                                                      |
| -------- | ------------------------- | ------------------------------------------------------------------- |
| Schema   | Define contracts          | Shape the data structure and types                                  |
| Managers | Write/Create and Validate | Gatekeepers, validate business logic before allowing Jazz mutations |
| Hooks    | Read                      | Data fetching by subscribing to jazz CoValue                        |

Schema enforces **constrtaints** = what's valid?
Manager handles **transformations** - how do we {action}?

Flow: Frontend → Managers (validate) → Jazz (persist)
↑ ↓
└────────── Hooks ←────────────┘

## Module Aliases

```typescript
"#schemas"      → src/core/schemas
"#managers"     → src/core/managers
"#init"         → src/core/init
"#core"         → src/core
"#frameworks"   → src/frameworks
```

## Full Specification

See [../../docs/specs/sdk-public-api.md](../../docs/specs/sdk-public-api.md) for complete SDK documentation including:

- Schema hierarchy and managers
- Sync safety patterns
- MaybeLoaded patterns
- Hook operations reference
