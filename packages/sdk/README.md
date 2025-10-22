# @regarde/sdk

SDK for building apps with Jazz registration key authentication. Provides framework-agnostic utilities, React/Preact hooks, and a verification API client.

## Installation

```bash
pnpm add @regarde/sdk jazz-tools
```

### For React users

```bash
pnpm add react
```

### For Preact users

```bash
pnpm add preact
```

## Features

- **Framework-agnostic auth utilities** - Core registration key logic that works anywhere
- **React and Preact hooks** - Easy integration with your UI framework
- **Verification API client** - Call the central verification server
- **TypeScript support** - Full type definitions included
- **Tree-shaking enabled** - Only bundle what you use
- **Separate entry points** - No cross-framework pollution

## Usage

### 1. Auth Utilities (Framework-agnostic)

```typescript
import {
  RegistrationKey,
  getRegistrationKey,
  isKeyExpired,
  generateRegistrationKey,
  KEY_LIFETIME_SECONDS
} from '@regarde/sdk/auth';

// Use the RegistrationKey schema in your Jazz account
const MyAccountRoot = co.map({
  'auth.myapp': RegistrationKey,
  // ... other fields
});

// Generate and store a registration key
const key = await getRegistrationKey({
  loadedRegistrationKeyCoMap: account.root['auth.myapp']
});

// Check if a key is expired
const expired = isKeyExpired(registrationKey);

// Generate a random key (used internally by getRegistrationKey)
const randomKey = generateRegistrationKey();
```

### 2. React Hook

```typescript
import { useAccount } from 'jazz-tools/react';
import { useRegistrationKey } from '@regarde/sdk/react';

function MyComponent() {
  const { me } = useAccount();
  const registrationKey = me?.root?.['auth.myapp'];

  const {
    key,           // Current key value
    keyId,         // CoMap ID for API headers
    expiresAt,     // Expiry timestamp
    isExpired,     // Whether key has expired
    refresh,       // Function to regenerate key
    isLoading,     // Refresh in progress
    error          // Error message if any
  } = useRegistrationKey(registrationKey);

  // Use key in API calls
  useEffect(() => {
    if (key && keyId && !isExpired) {
      fetch('/api/register', {
        headers: {
          'X-Registration-Key': key,
          'X-Registration-Key-Id': keyId,
        }
      });
    }
  }, [key, keyId, isExpired]);

  return (
    <div>
      <button onClick={refresh} disabled={isLoading}>
        {isExpired ? 'Generate New Key' : 'Refresh Key'}
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### 3. Preact Hook

```typescript
import { useAccount } from 'jazz-tools/preact';
import { useRegistrationKey } from '@regarde/sdk/preact';

function MyComponent() {
  const { me } = useAccount();
  const registrationKey = me?.root?.['auth.myapp'];

  const { key, keyId, refresh, isExpired } = useRegistrationKey(registrationKey);

  return (
    <div>
      <button onClick={refresh}>
        {isExpired ? 'Generate New Key' : 'Refresh Key'}
      </button>
    </div>
  );
}
```

### 4. Verification API Client

```typescript
import { verifyRegistrationKeyViaServer } from '@regarde/sdk/verify';

// Call the central verification server
const result = await verifyRegistrationKeyViaServer({
  baseUrl: 'https://api.regarde.bio',
  jazzAccountId: 'account-123',
  registrationKey: 'abc123...',
  registrationKeyId: 'co_xyz...',
  apiKey: 'your-api-key',
  signal: abortController.signal, // Optional
});

if (result.isValid) {
  console.log('User authenticated successfully');
} else {
  console.error('Authentication failed:', result.error);
}
```

## API Reference

### Auth Module (`@regarde/sdk/auth`)

#### `RegistrationKey`
Jazz CoMap schema for registration keys.

```typescript
const RegistrationKey = co.map({
  key: z.string(),
  expiresAt: z.number(),
});
```

#### `getRegistrationKey(params)`
Generates a new registration key and stores it in the provided CoMap.

**Parameters:**
- `loadedRegistrationKeyCoMap: Loaded<typeof RegistrationKey>` - The loaded RegistrationKey CoMap

**Returns:** `Promise<string | null>` - The generated key, or null on error

#### `isKeyExpired(registrationKey)`
Checks if a registration key has expired.

**Parameters:**
- `registrationKey: any` - Object with `expiresAt` property

**Returns:** `boolean` - True if expired or invalid

#### `generateRegistrationKey()`
Generates a random 16-character registration key.

**Returns:** `string` - The generated key

#### `KEY_LIFETIME_SECONDS`
Constant for key lifetime (24 hours = 86400 seconds).

### React/Preact Hooks

#### `useRegistrationKey(registrationKeyCoMap)`

**Parameters:**
- `registrationKeyCoMap: Loaded<typeof RegistrationKey> | null | undefined` - The loaded RegistrationKey CoMap

**Returns:** `UseRegistrationKeyResult`
```typescript
{
  key: string | null;
  keyId: string | null;
  expiresAt: number | null;
  isExpired: boolean;
  refresh: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

### Verify Module (`@regarde/sdk/verify`)

#### `verifyRegistrationKeyViaServer(params)`

**Parameters:**
```typescript
{
  baseUrl: string;              // e.g., 'https://api.regarde.bio'
  jazzAccountId: string;        // User's Jazz account ID
  registrationKey: string;      // The key value
  registrationKeyId: string;    // CoMap ID
  apiKey: string;               // API key for accessing the verify endpoint
  signal?: AbortSignal;         // Optional abort signal
}
```

**Returns:** `Promise<VerificationResult>`
```typescript
{
  isValid: boolean;
  error?: string;
}
```

## Development

```bash
# Build the package
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test
```

## License

ISC

