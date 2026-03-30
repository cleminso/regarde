# Creating Atoms

Guide for building branded atom components.

## When to Create Atoms

**Create atoms when:**

- Wrapping shadcn components with Regarde branding
- Adding pre/post slots to inputs
- Adding domain-specific props (loading states)
- Creating reusable components across features

**Don't create atoms when:**

- Component is feature-specific (build in app)
- Component combines multiple atoms (that's a molecule)
- Component has complex business logic (keep atoms presentational)

## File Structure

```
packages/ui/src/components/
├── atoms/
│   ├── button.tsx
│   ├── input.tsx
│   └── badge.tsx
└── shadcn-ui/
    ├── button.tsx
    └── input.tsx
```

## Domain Features to Consider

### Slots

For inputs and buttons that need icons:

```typescript
export type InputProps = React.ComponentProps<typeof ShadInput> & {
  preSlot?: React.ReactNode; // Icon before input
  postSlot?: React.ReactNode; // Action after input
};
```

### Loading States

For buttons that trigger async operations:

```typescript
export type ButtonProps = React.ComponentProps<typeof ShadButton> & {
  loading?: boolean;
};
// Shows spinner overlay when loading
```

**Note**: Jazz mutations are synchronous, but external API calls (payment providers) need loading states.

## Props Pattern

Always extend from the shadcn component:

```typescript
// ✓ Good — inherits shadcn behavior
export type InputProps = React.ComponentProps<typeof ShadInput> & {
  preSlot?: React.ReactNode
}

// ✗ Bad — misses shadcn additions
export type InputProps = React.ComponentProps<"input"> & { ... }

// ✗ Bad — couples to primitive
export type InputProps = InputPrimitive.Props & { ... }
```

## Ref Handling

Explicitly destructure `ref` for React 19 compatibility:

```typescript
function Input({ ref, className, ...props }: InputProps) {
  return <ShadInput ref={ref} className={className} {...props} />
}
```

## Class Merging

### Use `cn()` for conditionals:

```typescript
className={cn(
  "bg-input border-border",
  preSlot && "pl-9",        // conditional
  postSlot && "pr-9",       // conditional
  className
)}
```

### Use `twMerge()` for CVA:

```typescript
// Pass className to CVA, not twMerge directly
// CVA handles className internally and always returns a string
const baseClasses = twMerge(buttonVariants({ variant, size, className }));

// WRONG - twMerge can't handle function className from Base UI
// const baseClasses = twMerge(buttonVariants({ variant, size }), className);
```

## Styling

Use semantic Tailwind classes that map to CSS variables:

```typescript
className={cn(
  "bg-input border-border text-foreground",
  "focus-visible:ring-ring focus-visible:ring-1",
  className
)}
```

**Never use hardcoded colors** — always use semantic tokens.

## Exports

Minimal export pattern:

### Standard Component

```typescript
Component.displayName = ShadComponent.displayName

export default Component
export type { ComponentProps }
```

### With Raw Variant

```typescript
Component.displayName = ShadComponent.displayName
RawComponent.displayName = "RawComponent"

export default Component
export { RawComponent }
export type { ComponentProps }
```

### What's NOT Exported

- **No named component export** — Use default export only
- **No CVA variant functions** — Keep `buttonVariants` internal (implementation detail)

**Why minimal exports?**
- Smaller API surface
- Variants are implementation details
- If you need variants elsewhere, import the component or create a new atom

### Exception

Only export variants when multiple atoms share the same variant logic (rare).

## Examples

See `references/playbook.md` for complete code templates:

- Template A: Simple wrapper with slots
- Template B: CVA variants with domain features
- Template C: Multi-variant export (Raw + Full)

## References

- `references/playbook.md` — Code templates and execution patterns
- `references/official/architecture.md` — Three-layer system
