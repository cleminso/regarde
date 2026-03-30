# Composition Patterns

Decision matrix for choosing the right composition pattern in Regarde UI.

## Pattern Overview

| Pattern | Use When | Examples | Complexity |
|---------|----------|----------|------------|
| **Compound** | Complex containers with multiple structural parts | Card, Dialog, Sheet, Tabs | Medium |
| **CVA Variants** | Styled primitives with multiple visual states | Button, Badge | Low |
| **Slot Props** | Input adornments and simple extensions | Input (pre/post slots) | Low |
| **Render Prop** | Element type override (link as button) | Button as `<a>` | Low |

## Decision Matrix

### Compound Components

**Use when:**
- Component has multiple distinct structural parts (header, content, footer)
- Parts need independent styling and behavior
- Layout is flexible (parts can be omitted/reordered)
- Common pattern: Dialog, Card, Sheet, Tabs, Breadcrumb

**Structure:**
```typescript
// Export as compound object
export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
  Action: CardAction,
}

// Usage
<Card.Root>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>Content</Card.Content>
  <Card.Footer>
    <Card.Action>Action</Card.Action>
  </Card.Footer>
</Card.Root>
```

**Pros:**
- Clear structure
- Flexible layout
- Self-documenting API

**Cons:**
- More verbose
- More files to maintain

---

### CVA Variants

**Use when:**
- Component has multiple visual states (primary, secondary, destructive)
- Component has size variants (sm, default, lg)
- Simple props control appearance
- Common pattern: Button, Badge

**Structure:**
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Usage
<Button variant="secondary" size="sm">Click</Button>
```

**Pros:**
- Type-safe variants
- Consistent styling
- Easy to extend

**Cons:**
- Limited to visual states
- Not for structural composition

---

### Slot Props

**Use when:**
- Component needs adornments (icons, actions)
- Adornments are optional
- Position matters (before/after)
- Common pattern: Input, Textarea

**Structure:**
```typescript
export type InputProps = React.ComponentProps<typeof ShadInput> & {
  preSlot?: React.ReactNode   // Before input
  postSlot?: React.ReactNode  // After input
}

function Input({ preSlot, postSlot, className, ...props }: InputProps) {
  return (
    <div className="relative">
      {preSlot && <div className="absolute left-3">{preSlot}</div>}
      <ShadInput
        className={cn(preSlot && "pl-9", postSlot && "pr-9", className)}
        {...props}
      />
      {postSlot && <div className="absolute right-3">{postSlot}</div>}
    </div>
  )
}

// Usage
<Input
  placeholder="Search..."
  preSlot={<SearchIcon />}
  postSlot={<ClearButton />}
/>
```

**Pros:**
- Simple API
- Flexible content
- No wrapper elements needed

**Cons:**
- Limited to positioning
- Not for structural changes

---

### Render Prop

**Use when:**
- Need to change the underlying element type
- Composing with custom components
- Shadcn/BaseUI `render` prop pattern
- Common pattern: Button as link, Menu.Trigger

**Structure:**
```typescript
// shadcn provides render prop support
<Button render={<a href="/docs" />}>Documentation</Button>

// Or with custom component
<Menu.Trigger render={<MyButton variant="primary" />}>
  Open Menu
</Menu.Trigger>
```

**Pros:**
- Flexible element type
- Maintains props/events
- Clean composition

**Cons:**
- Less explicit than slots
- Requires ref forwarding

---

## Migration Guidelines

### Standardize on ONE Pattern

Don't mix patterns for the same component type:

✓ **Good:**
```typescript
// All Cards use compound
Card.Root, Card.Header, Card.Content

// All Buttons use CVA
<Button variant="secondary" size="sm" />

// All Inputs use slots
<Input preSlot={<Icon />} />
```

✗ **Bad:**
```typescript
// Mixing patterns
<Card>                    // Flat
  <CardHeader />          // Compound
  <CardContent />         // Compound
</Card>

<Button asChild>          // asChild pattern
  <Link>Click</Link>
</Button>
```

### Choosing for New Components

**Ask these questions:**

1. **Does it have multiple structural parts?** → Compound
2. **Does it have visual states (colors, sizes)?** → CVA
3. **Does it need icons/adornments?** → Slot props
4. **Does it need to render as different elements?** → Render prop

### Pattern by Component Type

| Component | Recommended Pattern | Reason |
|-----------|-------------------|---------|
| Card | Compound | Header/Content/Footer structure |
| Dialog | Compound | Header/Content/Footer/Overlay |
| Sheet | Compound | Header/Content/Footer |
| Tabs | Compound | List/Trigger/Content structure |
| Button | CVA | Multiple variants + sizes |
| Badge | CVA | Multiple color variants |
| Input | Slot props | Pre/post adornments |
| Select | Compound | Trigger/Content/Item structure |
| DropdownMenu | Compound | Complex nested structure |

## References

- `../official/creating-atoms.md` — Implementation details
- `render-prop-guide.md` — Using render prop vs asChild
- Base UI composition docs: https://base-ui.com/react/utils/
