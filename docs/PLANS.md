# Plans Overview

Development plans following ExecPlans format.

---

## Active Plans

Located in: [exec-plans/active/](./exec-plans/active/)

| Plan | Status | Description |
|------|--------|-------------|
| **orchestration-upgrade-v2** | In Progress | Enhanced orchestration system with improved task scheduling and dependency management |
| **orchestration-upgrade** | In Progress | Foundation for orchestration improvements and workflow automation |

---

## Completed Plans

Located in: [exec-plans/completed/](./exec-plans/completed/)

No completed plans yet.

---

## Technical Debt Tracker

**File**: [exec-plans/tech-debt-tracker.md](./exec-plans/tech-debt-tracker.md)

Tracks known technical debt items that need addressing:

- Refactoring candidates
- Deprecated patterns to migrate
- Performance bottlenecks
- Documentation gaps

---

## Plan Format

Each plan follows the ExecPlans structure:

```
exec-plans/
├── active/
│   └── {plan-name}.md      # In-progress initiatives
├── completed/
│   └── {plan-name}.md      # Finished work (reference)
├── tech-debt-tracker.md    # Known debt items
└── {other-plans}.md        # Proposals, RFCs
```

---

## Creating New Plans

1. Create markdown file in `exec-plans/active/`
2. Follow template: objectives, tasks, success criteria
3. Move to `completed/` when finished
4. Update tracker items as they are resolved

---

## Related

- [Design Docs](./design-docs/index.md) - Design principles
- [Specs Index](./specs/index.md) - Package specifications
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
