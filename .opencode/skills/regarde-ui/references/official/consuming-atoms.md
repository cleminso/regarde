# Consuming Atoms

Guide for using Regarde UI atoms in applications.

## Installation

Atoms are available via the `@regarde/ui` package:

```typescript
import { Button } from "@regarde/ui/components/atoms/button"
import { Input } from "@regarde/ui/components/atoms/input"
```

## Import Patterns

### Always import from atoms

```typescript
// ✓ Good
import { Button } from "@regarde/ui/components/atoms/button"

// ✗ Bad — bypasses branding
import { Button } from "@regarde/ui/components/shadcn-ui/button"
import { Button } from "@base-ui/react/button"
```

### When you need types

TypeScript infers types automatically for normal usage. Import props types only for:

```typescript
// 1. Extending the component
import type { ButtonProps } from "@regarde/ui/components/atoms/button"

interface MyButtonProps extends ButtonProps {
  analyticsId?: string
}

// 2. Typing a prop that accepts button props
function ButtonGroup({ buttons }: { buttons: ButtonProps[] }) {
  return buttons.map((props, i) => <Button key={i} {...props} />)
}

// 3. Wrapper components
function IconButton(props: ButtonProps) {
  return <Button {...props} size="icon" />
}
```

## Styling Atoms

### Override via className

All atoms accept a `className` prop that merges with default styles:

```typescript
<Button className="w-full md:w-auto" />
<Input className="bg-red-50" />
```

### Common patterns

```typescript
// Full width on mobile, auto on desktop
<Button className="w-full md:w-auto">Submit</Button>

// Margin and spacing
<Button className="mt-4 ml-2">Save</Button>

// Custom colors (use semantic tokens when possible)
<Input className="border-blue-500 focus-visible:ring-blue-500" />
```

## Theme Customization

### CSS Variables

Apps control theming via CSS variables in their global CSS:

```css
/* apps/dashboard/src/index.css */
@theme {
  --color-input: var(--input);
  --color-border: var(--border);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
}

:root {
  --input: #ffffff;
  --border: #e5e5e5;
  --foreground: #171717;
  --primary: #171717;
}

.dark {
  --input: #262626;
  --border: #404040;
  --foreground: #fafafa;
  --primary: #fafafa;
}
```

Atoms automatically use these values via semantic classes (`bg-input`, `text-foreground`, etc.).

## Using Slots

### Input with icon

```typescript
import { Input } from "@regarde/ui/components/atoms/input"
import { SearchIcon } from "lucide-react"

<Input
  placeholder="Search..."
  preSlot={<SearchIcon className="h-4 w-4" />}
/>
```

### Input with action

```typescript
<Input
  type="password"
  postSlot={
    <button type="button" onClick={toggleVisibility}>
      {visible ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  }
/>
```

## Form Integration

### React 19 form compatibility

All atoms support ref forwarding for form integration:

```typescript
function Form() {
  const inputRef = useRef<HTMLInputElement>(null)
  
  return (
    <form>
      <Input ref={inputRef} name="email" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Controlled components

```typescript
const [value, setValue] = useState("")

<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

## Loading States

Buttons support loading states for async operations:

```typescript
const [isSubmitting, setIsSubmitting] = useState(false)

<Button
  loading={isSubmitting}
  onClick={async () => {
    setIsSubmitting(true)
    await submitForm()
    setIsSubmitting(false)
  }}
>
  Submit
</Button>
```

**Note**: Jazz mutations are synchronous, but external API calls (payment providers) need loading states.

## Compound Components

For complex components like Card:

```typescript
import { Card } from "@regarde/ui/components/atoms/card"

<Card.Root>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>Content here</Card.Content>
</Card.Root>
```

## Best Practices

1. **Import from atoms** — Never import from `/shadcn-ui/` or `@base-ui/react/*`
2. **Use className for overrides** — Tailwind classes merge correctly
3. **Prefer semantic tokens** — Use `bg-input` over `bg-white` when possible
4. **Leverage slots** — Use `preSlot`/`postSlot` for icons instead of absolute positioning
5. **Handle loading states** — Show loading for external API calls

## Troubleshooting

### Styles not applying

Ensure your app's CSS includes the theme variables:

```css
@theme {
  --color-input: var(--input);
  /* ... other mappings */
}
```

### Type errors

Import props types explicitly:

```typescript
import type { InputProps } from "@regarde/ui/components/atoms/input"
```

### Ref not working

Atoms use explicit ref destructuring for React 19. Pass refs normally:

```typescript
const ref = useRef<HTMLInputElement>(null)
<Input ref={ref} />
```
