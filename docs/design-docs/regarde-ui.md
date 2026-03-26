# Regarde UI

Three-layer system: Base UI primitives in `/base-ui/`, generated shadcn components in `/shadcn-ui/`, branded customizations in `/atoms/`.

## Architecture

```
/base-ui/    → Base UI primitive re-exports (mergeProps, useRender, etc.)
/shadcn-ui/  → Raw shadcn components (generated, pristine)
/atoms/      → Branded components (customized, domain-specific)
```

| Layer         | Contains          | Tooling            | Editable                          |
| ------------- | ----------------- | ------------------ | --------------------------------- |
| `/base-ui/`   | Base UI utilities | Re-exports         | No — thin wrapper layer           |
| `/shadcn-ui/` | shadcn defaults   | `cn()`             | No — regenerate with `shadcn add` |
| `/atoms/`     | Branded variants  | `twMerge()`, `cva` | Yes — this is Regarde code        |

**Critical**: Base UI does NOT export props from `/shadcn-ui/` files. Unlike Radix-based shadcn, adding exports to `/shadcn-ui/` breaks on updates. Import primitive types directly from `@base-ui/react/*` or from `/base-ui/` utilities.

### Prerequisite

1. Verify is a Base UI project by checking `components.json`. THe `style` field should start with `"base-{theme_name}"` (e.g., `"base-vega"`, `"base-nova"`, `"base-maia"`, `"base-lyra"`, `"base-mira"`).
2. Ensure `@base-ui/react` package is installed.

## Naming Conventions

### File Naming

Atoms use **camelCase** for file names:

```
// Good
packages/ui/src/components/atoms/input.tsx
packages/ui/src/components/atoms/select.tsx

// Bad — don't use PascalCase
packages/ui/src/components/atoms/Input.tsx
```

### Import Aliases

When importing from shadcn-ui, use the `as Base{Component}` pattern:

```typescript
// Good — explicit Base prefix
import { Input as BaseInput } from "@/components/shadcn-ui/input"
import { Button as BaseButton } from "@/components/shadcn-ui/button"

// Bad — no alias
import { Input } from "@/components/shadcn-ui/input"
```

This makes it clear when you're using the base shadcn component vs your branded atom.

## Base UI Utilities (`/base-ui/`)

The `/base-ui/` folder contains thin re-exports of Base UI utilities. This provides a single source of truth for Base UI primitives used throughout the UI package.

### Available Utilities

| File                    | Exports                             | Usage                            |
| ----------------------- | ----------------------------------- | -------------------------------- |
| `merge-props.ts`        | `mergeProps`                        | Merge internal and user props    |
| `use-render.ts`         | `useRender`                         | Polymorphic component rendering  |
| `csp-provider.ts`       | `CSPProvider`                       | Content Security Policy provider |
| `direction-provider.ts` | `DirectionProvider`, `useDirection` | RTL/LTR direction handling       |

### Usage in Components

```typescript
// In shadcn-ui components
import { mergeProps } from "@/base-ui/merge-props";
import { useRender } from "@/base-ui/use-render";

// In atoms (for primitive types)
import { Button as ButtonPrimitive } from "@base-ui/react/button";
```

**Note**: Import utilities from `/base-ui/` for consistency, but import primitive components (like `ButtonPrimitive`) directly from `@base-ui/react/*`.

## Styling with Semantic Tailwind Classes

We use semantic Tailwind classes that map to CSS variables. This provides:

- **Theme flexibility**: Change values in one place (CSS variables) without touching component code
- **Dark mode support**: CSS variables can be redefined for dark themes
- **Consistency**: All components use the same semantic tokens

### How It Works

```typescript
// Atoms component uses semantic classes
className={twMerge(
  "bg-input border-border text-foreground",
  "focus-visible:ring-ring focus-visible:ring-1",
  className
)}
```

These classes map to CSS variables defined in the consuming app:

```css
/* apps/dashboard/src/index.css */
@theme {
  --color-input: var(--input);
  --color-border: var(--border);
  --color-foreground: var(--foreground);
  --color-ring: var(--ring);
}

:root {
  --input: oklch(1 0 0);
  --border: oklch(0.922 0 0);
  --foreground: oklch(0.145 0 0);
  --ring: oklch(0.708 0 0);
}
```

### Common Semantic Tokens

| Token | Purpose | Example Usage |
|-------|---------|---------------|
| `bg-input` | Form input backgrounds | `className="bg-input"` |
| `border-border` | Default borders | `className="border-border"` |
| `text-foreground` | Primary text color | `className="text-foreground"` |
| `text-muted-foreground` | Secondary text color | `className="text-muted-foreground"` |
| `bg-background` | Page/component backgrounds | `className="bg-background"` |
| `bg-primary` | Primary action backgrounds | `className="bg-primary"` |
| `text-primary-foreground` | Text on primary backgrounds | `className="text-primary-foreground"` |
| `focus-visible:ring-ring` | Focus ring color | `className="focus-visible:ring-ring"` |

## Creating New `/atoms` Components

### Checklist

- [ ] Install raw component: `pnpm dlx shadcn@latest add <component>`
- [ ] Import component from `/shadcn-ui/` using alias: `import { Component as BaseComponent } from "@/components/shadcn-ui/component"`
- [ ] Import props from primitive: `import { Component as ComponentPrimitive } from "@base-ui/react/component"`
- [ ] Define branded variants with `cva()` (do NOT reuse `/shadcn-ui/` variants)
- [ ] Extend props using `typeof BaseComponent`: `React.ComponentProps<typeof BaseComponent> & { domainProp?: boolean }`
- [ ] Use `twMerge()` for class merging (not `cn()`)
- [ ] Use semantic Tailwind classes (e.g., `bg-input`, `border-border`)
- [ ] Explicitly destructure `ref` for form compatibility with React 19
- [ ] Set `displayName = 'Component'`
- [ ] Export default + named: `export default Component; export { Component }`
- [ ] Export props type: `export type ComponentProps = ...`
- [ ] Add JSDoc with usage example

### Template

```typescript
import * as React from "react"
import { Input as BaseInput } from "@/components/shadcn-ui/input"
import { cn } from "@/lib/utils"

export type InputProps = React.ComponentProps<typeof BaseInput> & {
  preSlot?: React.ReactNode
  postSlot?: React.ReactNode
}

/**
 * Branded input component with domain-specific styling.
 * Explicitly destructures ref for form compatibility with React 19.
 * Uses `typeof BaseInput` to inherit all props from the shadcn base component.
 * @example
 * ```tsx
 * <Input
 *   ref={inputRef}
 *   placeholder="Enter your email"
 *   preSlot={<SearchIcon />}
 * />
 * ```
 */
function Input({
  ref,
  preSlot,
  postSlot,
  className,
  ...props
}: InputProps) {
  return (
    <div className="relative flex w-full">
      {preSlot && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
          {preSlot}
        </div>
      )}
      <BaseInput
        ref={ref}
        className={cn(
          "bg-input border-border text-foreground",
          preSlot && "pl-9",
          postSlot && "pr-9",
          className
        )}
        {...props}
      />
      {postSlot && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
          {postSlot}
        </div>
      )}
    </div>
  )
}

Input.displayName = "Input"
export { Input }
```

### Props Type Pattern

Always use `React.ComponentProps<typeof BaseComponent>` to extend props:

```typescript
// Correct — inherits from the base component
export type InputProps = React.ComponentProps<typeof BaseInput> & {
  preSlot?: React.ReactNode
  postSlot?: React.ReactNode
}

// Incorrect — misses base component's custom props
export type InputProps = React.ComponentProps<"input"> & { ... }

// Incorrect — couples to primitive instead of our wrapper
export type InputProps = InputPrimitive.Props & { ... }
```

**Why `typeof BaseComponent`:**

1. **Inherits wrapper behavior** — If shadcn adds custom props, you get them automatically
2. **Future-proof** — Changes to the base component propagate correctly
3. **Type safety** — Event handlers, refs, and validation states match the actual implementation

### Ref Handling

Always explicitly destructure `ref` in the component parameters for form compatibility:

```typescript
// Correct — explicit ref destructuring
const Input = ({
  ref,
  className,
  ...props
}: InputProps) => {
  return <BaseInput ref={ref} className={className} {...props} />
}

// Incorrect — ref may not work correctly with forms
const Input = (props: InputProps) => {
  return <BaseInput {...props} />
}
```

This ensures proper ref forwarding for React 19 and form library compatibility.

## Using `/atoms` Components

### Checklist

- [ ] Import from atoms, never from `/shadcn-ui/` directly
- [ ] Use named imports: `import { Button } from "@regarde/ui/components/atoms/button"`
- [ ] Use props type when needed: `import type { ButtonProps } from "@regarde/ui/components/atoms/button"`
- [ ] Never import from `@base-ui/react/*` in app code — always go through atoms

### Import Patterns

```typescript
// Good
import { Button } from "@regarde/ui/components/atoms/button";
import type { ButtonProps } from "@regarde/ui/components/atoms/button";

// Bad — bypasses branding
import { Button } from "@regarde/ui/components/shadcn-ui/button";
import { Button } from "@base-ui/react/button";
```

## Key Patterns

### ClassName Handling

Base UI's `className` accepts `string | ((state) => string)`. `twMerge()` only handles strings. Solution: compute string classes in atoms, let `/shadcn-ui/` handle function merging.

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

### Color Token Flow

```
atoms/input.tsx writes: "bg-input border-border"
         ↓
Tailwind scans, finds .bg-input and .border-border
         ↓
Generates: .bg-input { background-color: var(--color-input) }
           .border-border { border-color: var(--color-border) }
         ↓
App's globals.css provides:
  --color-input: oklch(0.922 0 0);
  --color-border: oklch(0.872 0 0);
         ↓
Browser renders with those colors
```

**UI package has zero CSS files** — only Tailwind classes. Apps control branding via CSS variables.

## Technical Pattern

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

## Common Mistakes

| Mistake                               | Why It Breaks                 | Correct Approach                         |
| ------------------------------------- | ----------------------------- | ---------------------------------------- |
| Adding exports to `/shadcn-ui/` files | shadcn updates overwrite them | Import from `@base-ui/react/*`           |
| Using `cn()` in atoms                 | Unnecessary complexity        | Use `twMerge()`                          |
| Importing props from `/shadcn-ui/`    | Base UI doesn't export them   | Import from primitive                    |
| Passing `className` to `twMerge`      | Could be a function           | Compute base classes, pass to BaseButton |
| Modifying `/shadcn-ui/` styling       | Lost on regeneration          | Override in `/atoms/`                    |
| Using PascalCase for atom files       | Inconsistent with codebase    | Use camelCase (e.g., `input.tsx`)        |
| Forgetting explicit ref destructuring | Form compatibility issues     | Always destructure `ref` in params       |
| Using `ComponentProps<"input">`       | Misses base component props   | Use `ComponentProps<typeof BaseInput>`   |

## Maintenance Workflow

### Updating shadcn Components

```bash
# Preview changes before applying
pnpm dlx shadcn@latest add button --diff

# Apply update (overwrites /shadcn-ui/, preserves /atoms/)
pnpm dlx shadcn@latest add button --overwrite

# Update all components at once
pnpm dlx shadcn@latest add --all --overwrite
```

### Migration from App to UI Package

1. Install raw: `pnpm dlx shadcn@latest add <component>`
2. Create atom wrapper following checklist above
3. Update app imports to `@regarde/ui/components/atoms/<component>` (camelCase)
4. Delete component from app's `/components/shadcn-ui/`

## References

- [shadcn/ui Registry](https://ui.shadcn.com) — Component reference
- [Base UI Documentation](https://base-ui.com) — Primitive behavior
- [Vercel Academy: shadcn/ui](https://vercel.com/academy/shadcn-ui) — Best practices guide
