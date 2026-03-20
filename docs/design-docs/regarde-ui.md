# Regarde UI

Two-layer system: generated shadcn components in `/ui/`, branded customizations in `/atoms/`. Component architecture adapted for Base UI primitives

## Architecture

```
/ui/      → Raw shadcn components (generated, pristine)
/atoms/   → Branded components (customized, domain-specific)
```

| Layer     | Contains         | Tooling            | Editable                          |
| --------- | ---------------- | ------------------ | --------------------------------- |
| `/ui/`    | shadcn defaults  | `cn()`             | No — regenerate with `shadcn add` |
| `/atoms/` | Branded variants | `twMerge()`, `cva` | Yes — this is your code           |

**Critical**: Base UI does NOT export props from `/ui/` files. Unlike Radix-based shadcn, adding exports to `/ui/` breaks on updates. Import primitive types directly from `@base-ui/react/*`.

## Creating New `/atoms` Components

### Checklist

- [ ] Install raw component: `pnpm dlx shadcn@latest add <component>`
- [ ] Import component from `/ui/`: `import { Component as BaseComponent } from "@/components/ui/component"`
- [ ] Import props from primitive: `import { Component as ComponentPrimitive } from "@base-ui/react/component"`
- [ ] Define branded variants with `cva()` (do NOT reuse `/ui/` variants)
- [ ] Extend props: `ComponentPrimitive.Props & { domainProp?: boolean }`
- [ ] Use `twMerge()` for class merging (not `cn()`)
- [ ] Set `displayName = 'Component'`
- [ ] Export default + named: `export default Component; export { Component }`
- [ ] Export props type: `export type ComponentProps = ...`
- [ ] Add JSDoc with usage example

### Template

````typescript
import { Component as BaseComponent } from "@/components/ui/component"
import { Component as ComponentPrimitive } from "@base-ui/react/component"
import { cva, type VariantProps } from "class-variance-authority"
import { twMerge } from "tailwind-merge"
import React from "react"

const componentVariants = cva("base-classes", {
  variants: {
    variant: { default: "..." },
    size: { default: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
})

/**
 * Branded component with domain-specific props.
 * @example
 * ```tsx
 * <Component variant="primary" onClick={handle}>
 *   Click me
 * </Component>
 * ```
 */
const Component = ({
  ref,
  className,
  variant = "default",
  size = "default",
  // domain props here
  ...props
}: ComponentPrimitive.Props &
  VariantProps<typeof componentVariants> & {
    ref?: React.RefObject<HTMLElement>
    // domain prop types
  }) => {
  const baseClasses = twMerge(
    componentVariants({ variant, size })
    // additional branded classes
  )

  return <BaseComponent ref={ref} className={baseClasses} {...props} />
}

Component.displayName = "Component"

export default Component
export { Component, componentVariants }
export type ComponentProps = ComponentPrimitive.Props &
  VariantProps<typeof componentVariants> & {
    // domain prop types
  }
````

## Using `/atoms` Components

### Checklist

- [ ] Import from atoms, never from `/ui/` directly
- [ ] Use named imports: `import { Button } from "@regarde/ui/components/atoms/Button"`
- [ ] Use props type when needed: `import type { ButtonProps } from "@regarde/ui/components/atoms/Button"`
- [ ] Never import from `@base-ui/react/*` in app code — always go through atoms

### Import Patterns

```typescript
// Good
import { Button } from "@regarde/ui/components/atoms/Button";
import type { ButtonProps } from "@regarde/ui/components/atoms/Button";

// Bad — bypasses branding
import { Button } from "@regarde/ui/components/ui/button";
import { Button } from "@base-ui/react/button";
```

## Key Patterns

### ClassName Handling

Base UI's `className` accepts `string | ((state) => string)`. `twMerge()` only handles strings. Solution: compute string classes in atoms, let `/ui/` handle function merging.

```typescript
// Atoms: only pass strings to twMerge
const baseClasses = twMerge(
  buttonVariants({ variant, size }),
  fullWidth ? "w-full" : ""
)

// Pass to BaseButton — it handles function className internally
<BaseButton className={baseClasses} {...props} />
```

### Compound Components

For Card, Select, Tabs — wrap each sub-component:

```typescript
export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Content: CardContent,
};
```

### Color Tokens

Define in consuming app's CSS, use in atoms as Tailwind classes:

```css
/* apps/dashboard/src/index.css */
@theme {
  --color-regarde-blue: oklch(0.623 0.214 259.815);
  --color-primary: var(--color-regarde-blue);
}
```

```typescript
// packages/ui/src/components/atoms/Button.tsx
className={twMerge(
  'bg-primary hover:bg-primary/80',  // Uses CSS variable
  className
)}
```

## Technical Details

### Base UI ClassName Type Issue

Base UI's `className` prop accepts both strings AND functions:

```typescript
string | ((state: ButtonState) => string | undefined) | undefined;
```

`twMerge()` only accepts strings. **Never pass `className` to `twMerge`**:

```typescript
// WRONG — twMerge can't handle functions
className={twMerge(
  buttonVariants({ variant, size }),
  className  // Could be a function!
)}

// CORRECT — Compute string classes only
const baseClasses = twMerge(
  buttonVariants({ variant, size }),
  fullWidth ? "w-full" : ""
)
<BaseButton className={baseClasses} {...props} />  // BaseButton handles function className
```

### Color Token Flow

```
atoms/Button.tsx writes: "text-blue-400"
         ↓
Tailwind scans, finds .text-blue-400
         ↓
Generates: .text-blue-400 { color: var(--color-blue-400) }
         ↓
App's globals.css provides: --color-blue-400: oklch(...)
         ↓
Browser renders with that color
```

**UI package has zero CSS files** — only Tailwind classes. Apps control branding via CSS variables.

## Common Mistakes

| Mistake                          | Why It Breaks                 | Correct Approach                         |
| -------------------------------- | ----------------------------- | ---------------------------------------- |
| Adding exports to `/ui/` files   | shadcn updates overwrite them | Import from `@base-ui/react/*`           |
| Using `cn()` in atoms            | Unnecessary complexity        | Use `twMerge()`                          |
| Importing props from `/ui/`      | Base UI doesn't export them   | Import from primitive                    |
| Passing `className` to `twMerge` | Could be a function           | Compute base classes, pass to BaseButton |
| Modifying `/ui/` styling         | Lost on regeneration          | Override in `/atoms/`                    |

## Maintenance Workflow

### Updating shadcn Components

```bash
# Preview changes before applying
pnpm dlx shadcn@latest add button --diff

# Apply update (overwrites /ui/, preserves /atoms/)
pnpm dlx shadcn@latest add button --overwrite

# Update all components at once
pnpm dlx shadcn@latest add --all --overwrite
```

### Migration from App to UI Package

1. Install raw: `pnpm dlx shadcn@latest add <component>`
2. Create atom wrapper following checklist above
3. Update app imports to `@regarde/ui/components/atoms/<Component>`
4. Delete component from app's `/components/ui/`

## References

- [Study: Polar UI Architecture](/docs/research/study-polar-ui-lib.md) — Full research on why we use this pattern
- [shadcn/ui Registry](https://ui.shadcn.com) — Component reference
- [Base UI Documentation](https://base-ui.com) — Primitive behavior
- [Vercel Academy: shadcn/ui](https://vercel.com/academy/shadcn-ui) — Best practices guide
