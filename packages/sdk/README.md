# @regarde-dev/sdk

SDK for building apps with Regarde registration token authentication. Provides framework-agnostic utilities, React/Preact hooks, and a verification API client.

## Installation

```bash
pnpm add @regarde-dev/sdk jazz-tools
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

- **Framework-agnostic auth utilities** - Core registration token logic that works anywhere
- **React and Preact hooks** - Easy integration with your UI framework
- **Verification API client** - Call the central verification server
- **TypeScript support** - Full type definitions included
- **Tree-shaking enabled** - Only bundle what you use
- **Separate entry points** - No cross-framework pollution

## Usage

### 1. Auth Utilities (Framework-agnostic)

```typescript
import {
  RegardeAuth,
  getRegardeAuth,
  isTokenExpired,
  generateRegardeToken,
  TOKEN_LIFETIME_SECONDS,
} from "@regarde-dev/sdk/auth";

// Use the RegardeAuth schema in your Jazz account
const MyAccountRoot = co.map({
  "auth.myapp": RegardeAuth,
  // ... other fields
});

// Generate and store a registration token
const token = await getRegardeAuth({
  loadedRegardeAuthCoMap: account.root["auth.myapp"],
});

// Check if a token is expired
const expired = isTokenExpired(regardeAuth);

// Generate a random token (used internally by getRegardeAuth)
const randomToken = generateRegardeToken();
```

### 2. React Hook

```typescript
import { useAccount } from 'jazz-tools/react';
import { useRegardeAuth } from '@regarde-dev/sdk/react';

function MyComponent() {
  const { me } = useAccount();
  const regardeAuth = me?.root?.['auth.myapp'];

  const {
    token,           // Current token value
    tokenId,         // CoMap ID for API headers
    expiresAt,     // Expiry timestamp
    isExpired,     // Whether token has expired
    refresh,       // Function to regenerate token
    isLoading,     // Refresh in progress
    error          // Error message if any
  } = useRegardeAuth(regardeAuth);

  // Use token in API calls
  useEffect(() => {
    if (token && tokenId && !isExpired) {
      fetch('/api/register', {
        headers: {
          'X-Regarde-Token': token,
          'X-Regarde-Token-Id': tokenId,
        }
      });
    }
  }, [token, tokenId, isExpired]);

  return (
    <div>
      <button onClick={refresh} disabled={isLoading}>
        {isExpired ? 'Generate New Token' : 'Refresh Token'}
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### 3. Preact Hook

```typescript
import { useAccount } from 'jazz-tools/preact';
import { useRegardeAuth } from '@regarde-dev/sdk/preact';

function MyComponent() {
  const { me } = useAccount();
  const regardeAuth = me?.root?.['auth.myapp'];

  const { token, tokenId, refresh, isExpired } = useRegardeAuth(regardeAuth);

  return (
    <div>
      <button onClick={refresh}>
        {isExpired ? 'Generate New Token' : 'Refresh Token'}
      </button>
    </div>
  );
}
```

### 4. Verification API Client

```typescript
import { verifyRegardeAuthViaServer } from "@regarde-dev/sdk/verify";

// Call the central verification server
const result = await verifyRegardeAuthViaServer({
  baseUrl: "https://api.regarde.bio",
  jazzAccountId: "account-123",
  regardeAuth: "abc123...",
  regardeAuthId: "co_xyz...",
  apiToken: "your-api-token",
  signal: abortController.signal, // Optional
});

if (result.isValid) {
  console.log("User authenticated successfully");
} else {
  console.error("Authentication failed:", result.error);
}
```

## API Reference

### Auth Module (`@regarde-dev/sdk/auth`)

#### `RegardeAuth`

Jazz CoMap schema for registration tokens.

```typescript
const RegardeAuth = co.map({
  token: z.string(),
  expiresAt: z.number(),
});
```

#### `getRegardeAuth(params)`

Generates a new registration token and stores it in the provided CoMap.

**Parameters:**

- `loadedRegardeAuthCoMap: Loaded<typeof RegardeAuth>` - The loaded RegardeAuth CoMap

**Returns:** `Promise<string | null>` - The generated token, or null on error

#### `isTokenExpired(regardeAuth)`

Checks if a registration token has expired.

**Parameters:**

- `regardeAuth: any` - Object with `expiresAt` property

**Returns:** `boolean` - True if expired or invalid

#### `generateRegardeAuth()`

Generates a random 16-character registration token.

**Returns:** `string` - The generated token

#### `TOKEN_LIFETIME_SECONDS`

Constant for token lifetime (24 hours = 86400 seconds).

### React/Preact Hooks

#### `useRegardeAuth(regardeAuthCoMap)`

**Parameters:**

- `RegardeAuthCoMap: Loaded<typeof RegardeAuth> | null | undefined` - The loaded RegardeAuth CoMap

**Returns:** `UseRegardeAuthResult`

```typescript
{
  token: string | null;
  tokenId: string | null;
  expiresAt: number | null;
  isExpired: boolean;
  refresh: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

### Verify Module (`@regarde-dev/sdk/verify`)

#### `verifyRegardeAuthViaServer(params)`

**Parameters:**

```typescript
{
  baseUrl: string;              // e.g., 'https://api.regarde.bio'
  jazzAccountId: string;        // User's Jazz account ID
  regardeAuth: string;      // The token value
  regardeAuthId: string;    // CoMap ID
  apiToken: string;               // API token for accessing the verify endpoint
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
