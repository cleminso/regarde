# Session: regarde-ui-foundations

**Date:** 2026-03-26

## Overview

Established the foundation for Regarde's design system by creating the first branded atom component (Input) with proper patterns. Deeply analyzed Polar's UI architecture and adapted their best practices to our BaseUI + shadcn setup. Migrated WebhookForm to use the new Input atom from @regarde/ui package.

## Files Changed

- **Created:** `packages/ui/src/components/atoms/input.tsx`
- **Renamed:** `packages/ui/src/components/atoms/Badge.tsx` → `badge.tsx`
- **Renamed:** `packages/ui/src/components/atoms/Breadcrumb.tsx` → `breadcrumb.tsx`
- **Renamed:** `packages/ui/src/components/atoms/Card.tsx` → `card.tsx`
- **Renamed:** `packages/ui/src/components/atoms/Dropdown-Menu.tsx` → `dropdownMenu.tsx`
- **Renamed:** `packages/ui/src/components/atoms/ListGroup.tsx` → `listGroup.tsx`
- **Renamed:** `packages/ui/src/components/atoms/Switch.tsx` → `switch.tsx`
- **Renamed:** `packages/ui/src/components/atoms/Tabs.tsx` → `tabs.tsx`
- **Modified:** `packages/ui/src/components/atoms/button.tsx`
- **Modified:** `docs/design-docs/regarde-ui.md`
- **Modified:** `apps/dashboard.regarde.dev/src/features/webhooks/components/WebhookForm.tsx`
- **Modified:** `apps/dashboard.regarde.dev/src/index.css`

## Decisions Made

- Use `React.ComponentProps<typeof BaseComponent>` for props typing — Inherits all base component props including shadcn additions
- Explicit `ref` destructuring in component params — Required for React 19 form compatibility
- Import alias pattern: `import { X as BaseX }` — Clear distinction between base and branded components
- camelCase for atom file names — Matches repo standard (renamed existing PascalCase files)
- Semantic Tailwind classes (`bg-input`, `border-border`) mapped to CSS variables — Enables theming and dark mode
- Follow Polar's minimal atom pattern — Wrap shadcn, add slots, apply branding, don't override everything

## What Worked / Didn't Work

- Researching Polar's codebase revealed their two-layer architecture — Adapted their patterns to our BaseUI setup
- Initial attempt to use `ComponentProps<"input">` was wrong — Would miss shadcn's custom props
- Build system with tsup exports works well — Dashboard can import `@regarde/ui/components/atoms/input`
- Semantic class approach is clean — CSS variables in dashboard's index.css, Tailwind classes in atoms

## Next Steps

1. Create remaining atoms for webhook page: Label, Textarea, Select, Switch, DropdownMenu
2. Migrate all dashboard components from local `#ui/*` imports to `@regarde/ui`
3. Delete dashboard's local `/components/ui/` folder once migration complete
4. Create Textarea atom (similar pattern to Input)
5. Build Select atom from BaseUI primitives (shadcn doesn't have one)
