# @regarde/sdk

Regarde SDK for React and Preact with registration key logic.

## Installation

```bash
pnpm add @regarde/sdk
```

### For React users

```bash
pnpm add react
```

### For Preact users

```bash
pnpm add preact
```

## Usage

### React

```typescript
import { useRegistrationKey } from '@regarde/sdk/react';

function MyComponent() {
  const { key, isLoading, error, generateKey } = useRegistrationKey();
  
  return (
    <div>
      <button onClick={generateKey}>Generate Key</button>
      {key && <p>Key: {key}</p>}
    </div>
  );
}
```

### Preact

```typescript
import { useRegistrationKey } from '@regarde/sdk/preact';

function MyComponent() {
  const { key, isLoading, error, generateKey } = useRegistrationKey();
  
  return (
    <div>
      <button onClick={generateKey}>Generate Key</button>
      {key && <p>Key: {key}</p>}
    </div>
  );
}
```

## Features

- Separate entry points for React and Preact
- Tree-shaking enabled - only bundle what you use
- TypeScript support with full type definitions
- No cross-framework pollution - React users don't load Preact code and vice versa

## Development

```bash
# Build the package
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test
```

