# AGENTS.md - Navigation Entry Point

This file is your map. For detailed guidance, follow the links.

## Quick Commands

```bash
pnpm --filter <package> dev         # Dev mode
pnpm --filter <package> build       # Build package
pnpm format-and-lint                # Check style
pnpm format-and-lint:fix            # Auto-fix style
```

## Where to Look Next

| Question | Go To |
|----------|-------|
| "What is our philosophy?" | [docs/design-docs/core-beliefs.md](docs/design-docs/core-beliefs.md) |
| "How do I write code?" | [docs/design-docs/code-style.md](docs/design-docs/code-style.md) |
| "What are the architectural domains?" | [ARCHITECTURE.md](ARCHITECTURE.md) |
| "How do Jazz CoMaps work?" | [docs/design-docs/jazz-patterns.md](docs/design-docs/jazz-patterns.md) |
| "What are we building now?" | [docs/PLANS.md](docs/PLANS.md) |
| "What invariants must I enforce?" | [docs/RELIABILITY.md](docs/RELIABILITY.md) |
| "How do we handle types & errors?" | [docs/DESIGN.md](docs/DESIGN.md) |

## Package-Specific Guidance

Each package has a local AGENTS.md (max 50 lines) pointing to specs:

- `packages/sdk/` - See [docs/specs/sdk-public-api.md](docs/specs/sdk-public-api.md)
- `packages/api.regarde.dev/` - See [docs/specs/api-server.md](docs/specs/api-server.md)
- `packages/admin/` - See [docs/specs/admin-operations.md](docs/specs/admin-operations.md)
- `apps/dashboard.regarde.dev/` - See [docs/specs/dashboard-app.md](docs/specs/dashboard-app.md)

## Invariant Checklist (Before Commit)

- [ ] Boolean checks use `=== true/false`, never implicit truthiness
- [ ] Jazz writes followed by `waitForSync()` before reads
- [ ] Types use 'T' prefix (enforced by oxlint)
- [ ] **No `any` types used**
- [ ] **Explicit return types on public functions**
- [ ] **Zod validation for all external inputs**
- [ ] Public SDK functions have JSDoc
