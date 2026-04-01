# Playbook: Creating Regarde UI Atoms

Execution patterns for building and using atom components.

## Creating New Atoms

### Checklist

- [ ] Check if shadcn component exists: `ls packages/ui/src/components/shadcn-ui/{component}.tsx`
- [ ] Install if needed: `pnpm dlx shadcn@latest add {component}`
- [ ] Create atom: `packages/ui/src/components/atoms/{component}.tsx`
- [ ] Import with Shad prefix: `import { Component as ShadComponent } from "@/components/shadcn-ui/component"`
- [ ] Define props: `React.ComponentProps<typeof ShadComponent> & { domainProps? }`
- [ ] Explicit ref destructuring in component params
- [ ] Use `cn()` or `twMerge()` appropriately
- [ ] Use semantic Tailwind classes (`bg-input`, `border-border`, etc.)
- [ ] Add minimal JSDoc with @example only
- [ ] Set `displayName`
- [ ] Export: named + default + props type
- [ ] Build package: `pnpm --filter @regarde/ui build`

### Template A: Simple Wrapper with Slots

For components that add slots or minimal styling:

```typescript
import * as React from "react"
import { Input as ShadInput } from "@/components/shadcn-ui/input"
import { cn } from "@/lib/utils"

export type InputProps = React.ComponentProps<typeof ShadInput> & {
  preSlot?: React.ReactNode
  postSlot?: React.ReactNode
}

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
      <ShadInput
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
export default Input
```

### Template B: CVA Variants with Domain Features

For components with multiple visual variants:

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { twMerge } from "tailwind-merge"
import { Button as ShadButton } from "@/components/shadcn-ui/button"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonProps = React.ComponentProps<typeof ShadButton> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }

function Button({
  ref,
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  // CVA handles className internally and always returns a string
  const baseClasses = twMerge(buttonVariants({ variant, size, className }))

  return (
    <ShadButton
      ref={ref}
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size={size} />
          </span>
          <span className="opacity-0">{children}</span>
        </>
      ) : (
        children
      )}
    </ShadButton>
  )
}

Button.displayName = ShadButton.displayName

export default Button
export type { ButtonProps }
```

### Template C: Multi-Variant Export (Raw + Full)

When you need both a simple wrapper and a feature-rich version:

```typescript
import * as React from "react"
import { Button as ShadButton } from "@/components/shadcn-ui/button"
import { cn } from "@/lib/utils"

// Simple wrapper
export type RawButtonProps = React.ComponentProps<typeof ShadButton>

function RawButton({ ref, className, ...props }: RawButtonProps) {
  return (
    <ShadButton
      ref={ref}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    />
  )
}
RawButton.displayName = "RawButton"

// Full featured
export type ButtonProps = RawButtonProps & {
  loading?: boolean
}

function Button({
  ref,
  className,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <RawButton
      ref={ref}
      className={cn("relative", loading && "opacity-70", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner /> : children}
    </RawButton>
  )
}
Button.displayName = "Button"

export { RawButton, Button }
export default Button
```

## Export Conventions

Minimal export pattern:

### Standard Exports (most components)

```typescript
Component.displayName = ShadComponent.displayName;

export default Component;
export type { ComponentProps };
```

### With Raw Variant

When providing both full-featured and raw versions:

```typescript
Component.displayName = ShadComponent.displayName;
RawComponent.displayName = "RawComponent";

export default Component;
export { RawComponent };
export type { ComponentProps };
```

### What's NOT Exported

- **No `componentVariants`** — Keep CVA functions internal (implementation detail)
- **No named component export** — Use default export only

**Why**: Minimal API surface. If you need variants elsewhere, import the component or create a new atom.

### Exception: When to Export Variants

Export variants only when:

- Multiple atoms share the same variant logic (rare)
- Building a theming system that needs runtime access to variants

## When to Use CVA

**Use CVA for:**

- Button (variant, size)
- Badge (variant)
- Any component with 3+ visual states

**Skip CVA for:**

- Input (just adds slots)
- Textarea (styling wrapper only)
- Label (minimal styling)

## Common Mistakes

| Mistake                             | Why It Breaks                           | Fix                                     |
| ----------------------------------- | --------------------------------------- | --------------------------------------- |
| `ComponentProps<"input">`           | Misses shadcn's custom props            | Use `ComponentProps<typeof ShadInput>`  |
| Implicit ref forwarding             | React 19 form incompatibility           | Explicitly destructure `ref` in params  |
| PascalCase atom files               | Inconsistent with codebase              | Use camelCase                           |
| `twMerge(variants, className)`      | twMerge can't handle function className | `twMerge(variants({ ..., className }))` |
| Using `twMerge()` with conditionals | Loses conditional class logic           | Use `cn()` for conditionals             |
| Using `BaseInput` alias             | Confusing — not the actual base         | Use `ShadInput` alias                   |
| Modifying `/shadcn-ui/` files       | Lost on shadcn regeneration             | Customize in `/atoms/` only             |

## Maintenance

### Updating shadcn Components

```bash
# Preview changes before applying
pnpm dlx shadcn@latest add button --diff

# Apply update (overwrites /shadcn-ui/, preserves /atoms/)
pnpm dlx shadcn@latest add button --overwrite

# Update all components
pnpm dlx shadcn@latest add --all --overwrite
```

### Migration from App to UI Package

1. Install raw: `pnpm dlx shadcn@latest add <component>`
2. Create atom wrapper following checklist above
3. Update app imports to `@regarde/ui/components/atoms/<component>`
4. Delete component from app's local UI folder
