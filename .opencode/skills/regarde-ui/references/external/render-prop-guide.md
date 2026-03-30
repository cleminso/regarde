# Render Prop vs asChild

Guide to composition patterns for changing element types and composing components.

## The Difference

| Feature | Radix UI (asChild) | Base UI (render) |
|---------|-------------------|------------------|
| **Syntax** | `asChild` boolean prop | `render` element prop |
| **API** | `<Button asChild><Link /></Button>` | `<Button render={<Link />} />` |
| **Props merging** | Automatic via Slot | Via `useRender` hook |
| **Ref handling** | Slot clones ref | `useRender` merges refs |
| **Framework** | Works with Radix | Works with Base UI |

## Regarde Context

Regarde uses **Base UI** (via shadcn), which uses the `render` prop pattern, not `asChild`.

### Radix Pattern (Don't Use)

```typescript
// Radix UI pattern - NOT used in Regarde
<Dialog.Trigger asChild>
  <Button>Open Dialog</Button>
</Dialog.Trigger>

// Button with asChild
<Button asChild>
  <a href="/docs">Documentation</a>
</Button>
```

### Base UI Pattern (Use This)

```typescript
// Base UI pattern - USE this in Regarde
<Dialog.Trigger render={<Button />}>Open Dialog</Dialog.Trigger>

// Button as link
<Button render={<a href="/docs" />}>Documentation</Button>
```

## Common Use Cases

### 1. Button as Link

```typescript
// Internal navigation
<Button render={<Link to="/dashboard" />} variant="ghost">
  Dashboard
</Button>

// External link
<Button render={<a href="https://example.com" target="_blank" />}>
  External Link
</Button>
```

### 2. Custom Trigger Components

```typescript
// Menu trigger with custom button
<Menu.Trigger render={<MyButton variant="primary" size="lg" />}>
  Open Menu
</Menu.Trigger>

// Dialog trigger
<Dialog.Trigger render={<Button variant="outline">Open</Button>}>
  Open Dialog
</Dialog.Trigger>
```

### 3. Nested Composition

Compose multiple components together:

```typescript
<Dialog.Root>
  <Tooltip.Root>
    <Tooltip.Trigger
      render={
        <Dialog.Trigger
          render={
            <Menu.Trigger render={<Button>Actions</Button>}>
              Open Menu
            </Menu.Trigger>
          }
        />
      }
    />
  </Tooltip.Root>
</Dialog.Root>
```

## How It Works

### The `render` Prop

Base UI's `render` prop accepts a React element:

```typescript
// Component receives render prop
interface ButtonProps {
  render?: React.ReactElement
  children?: React.ReactNode
}

// Implementation uses useRender hook
function Button({ render, children, ...props }) {
  const element = useRender({
    defaultTagName: 'button',
    render,
    props: mergeProps(defaultProps, props),
  })
  
  return element
}
```

### Props Merging

When using `render`, props are merged:

```typescript
<Button 
  className="custom-class" 
  onClick={handleClick}
  render={<a href="/path" className="link-class" />}
>
  Click me
</Button>

// Result: <a href="/path" className="link-class custom-class" onClick={handleClick}>
// Props from render element take precedence for conflicts
```

### Ref Handling

`useRender` automatically merges refs:

```typescript
const buttonRef = useRef<HTMLButtonElement>(null)

// Both refs work - internal and external
<Button ref={buttonRef} render={<a href="/docs" />}>
  Documentation
</Button>
```

## When to Use Render Prop

### Use `render` when:

1. **Changing element type:**
   ```typescript
   <Button render={<a href="/" />}>Home</Button>
   ```

2. **Composing with custom components:**
   ```typescript
   <Menu.Trigger render={<MyButton variant="primary" />}>
     Open
   </Menu.Trigger>
   ```

3. **Wrapping multiple components:**
   ```typescript
   <Tooltip.Trigger render={<Dialog.Trigger render={<Button />} />} />
   ```

### Don't use `render` when:

1. **Just adding props:**
   ```typescript
   // Don't do this
   <Button render={<button disabled />}>
   
   // Do this instead
   <Button disabled>
   ```

2. **Simple styling:**
   ```typescript
   // Don't do this
   <Button render={<button className="custom" />}>
   
   // Do this instead
   <Button className="custom">
   ```

## Migration from asChild

If you have code using Radix's `asChild`:

```typescript
// Before (Radix)
<Button asChild>
  <Link to="/dashboard">Dashboard</Link>
</Button>

// After (Base UI)
<Button render={<Link to="/dashboard" />}>
  Dashboard
</Button>
```

**Key differences:**
- `render` takes an element (`<Link />`), not children
- Children become the content, not the rendered element
- Props merge the same way

## Custom Components with Render

If building a custom component that needs render support:

```typescript
import { useRender } from "@/base-ui/use-render"
import { mergeProps } from "@/base-ui/merge-props"

interface MyComponentProps extends useRender.ComponentProps<'div'> {
  variant?: 'default' | 'primary'
}

function MyComponent({ 
  render, 
  variant = 'default',
  className,
  ...props 
}: MyComponentProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps(
      { 
        className: cn(
          variant === 'primary' && 'bg-primary',
          className
        )
      },
      props
    ),
  })
}
```

**Note:** Most Regarde atoms wrap shadcn components, which already handle render props. You rarely need to implement this yourself.

## References

- Base UI `useRender` docs: https://base-ui.com/react/utils/use-render
- Base UI `mergeProps` docs: https://base-ui.com/react/utils/merge-props
- `../composition-patterns.md` — Choosing the right pattern
