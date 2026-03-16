# @regarde-dev/core

Client SDK for Regarde. Initializes Jazz-based CoMaps in user accounts, manages registration tokens, provides React hooks, and handles app/payment state.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Development](#development)

## Installation

```bash
pnpm add @regarde-dev/core jazz-tools
```

### For React users

```bash
pnpm add react
```

## Quick Start

```typescript
import { useAccount } from "jazz-tools/react";
import { initRegardeSDK } from "@regarde-dev/core";
import { useRegardeTokenAuth } from "@regarde-dev/core/react";

function App() {
  const { me } = useAccount();
  const regardeAuth = me?.root?.["regarde-sdk"]?.auth;

  const { token, tokenId, refresh, isExpired } = useRegardeTokenAuth(regardeAuth);

  return (
    <div>
      <button onClick={refresh}>
        {isExpired ? "Generate Token" : "Refresh Token"}
      </button>
    </div>
  );
}

// Initialize SDK in your account
await initRegardeSDK({ account: me });
```

## Usage

### 1. Framework-Agnostic Auth

```typescript
import {
  RegardeTokenAuth,
  getRegardeTokenAuth,
  isTokenExpired,
  generateRegardeToken,
  TOKEN_LIFETIME_SECONDS,
} from "@regarde-dev/core";

// Use RegardeTokenAuth schema in your Jazz account
const MyAccountRoot = co.map({
  "regarde-sdk": RegardeSDK,
  "auth.myapp": RegardeTokenAuth,
});

// Generate and store a registration token
const token = await getRegardeTokenAuth({
  loadedRegardeAuthCoMap: account.root["auth.myapp"],
});

// Check if a token is expired
const expired = isTokenExpired({
  expiresAt: 1234567890,
});

// Generate a random token (used internally)
const randomToken = generateRegardeToken(); // 16-character string
```

### 2. React Hook - useRegardeTokenAuth

```typescript
import { useAccount } from "jazz-tools/react";
import { useRegardeTokenAuth } from "@regarde-dev/core/react";

function MyComponent() {
  const { me } = useAccount();
  const regardeAuth = me?.root?.["regarde-sdk"]?.auth;

  const {
    token,
    tokenId,
    expiresAt,
    isExpired,
    refresh,
    isLoading,
    error,
  } = useRegardeTokenAuth(regardeAuth);

  useEffect(() => {
    if (token && tokenId && !isExpired) {
      fetch("https://api.regarde.dev/apps", {
        headers: {
          "X-Regarde-Token": token,
          "X-Regarde-Token-Id": tokenId,
        },
      });
    }
  }, [token, tokenId, isExpired]);

  return (
    <div>
      <button onClick={refresh} disabled={isLoading}>
        {isExpired ? "Generate New Token" : "Refresh Token"}
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### 3. React Hook - useRegardeLemonSqueezyCheckoutLink

```typescript
import { useRegardeLemonSqueezyCheckoutLink } from "@regarde-dev/core/react";

function CheckoutPage({ appId }: { appId: string }) {
  const { generateLemonSqueezyCheckoutLink, isLoading, error } =
    useRegardeLemonSqueezyCheckoutLink(
      appId,
      "my-store", // storeName from lemonsqueezy.com/settings/stores
    );

  const handleCheckout = () => {
    const url = generateLemonSqueezyCheckoutLink({
      variantId: 12345,
      storeDomain: "https://my-store.lemonsqueezy.com",
      customData: { plan: "pro" },
    });
    window.location.href = url;
  };

  if (error) return <div>Error: {error}</div>;
  if (isLoading) return <div>Loading...</div>;

  return <button onClick={handleCheckout}>Subscribe</button>;
}
```

### 5. App Management

```typescript
import { createApp, useMyApps } from "@regarde-dev/core";

// Create a new app
const app = await createApp(me, {
  name: "My App",
  paymentProvider: "stripe",
});

// Query apps using utility hook
const appQuery = useMyApps(me?.root?.["regarde-sdk"]);

// Get all apps
const allApps = await appQuery.getAllApps();

// Get app by ID
const specificApp = await appQuery.getAppById("co_xyz...");

// Get apps by payment provider
const stripeApps = await appQuery.getAppsByProvider("stripe");
```

## Architecture

### Schema Hierarchy

**User-Owned Data**:

- `RegardeAccount` - Root account containing RegardeSDK
- `RegardeSDK` - Main SDK container (v3 structure)
  - `myUserHandle` - UserHandle CoMap (nickname registration)
  - `auth` - RegardeTokenAuth CoMap (token + expiresAt)
  - `myApps` - List of App CoMaps
  - `myPayments` - PaymentEvent maps indexed by provider UUID and App ID
- `App` - User-app definition (name, payment provider config, webhook URL)
- `PaymentEvent` - Individual payment transaction (created by worker)

**Registry-Owned Data** (read-only from client):

- `RegistryAppMetadata` - App verification status and access flags
- `NicknameRegistryCoRecord` - Global nickname → JazzAccountID mapping
- `ReservedNicknamesRegistry` - Reserved nickname categories

### Sync Safety (Critical)

Always wait for sync after CoMap writes before reading:

```typescript
// Write-Wait-Use pattern
const newApp = App.create(
  {
    name: "My App",
    paymentProvider: "stripe",
  },
  { owner: userGroup },
);
await newApp.$jazz.waitForSync(); // REQUIRED before reading

// Create-Set-Sync pattern
const newSDK = RegardeSDK.create(
  { version: 3, auth: regardeAuth, myUserHandle: userHandle },
  { owner: userGroup },
);
root.$jazz.set("regarde-sdk", newSDK);
await newSDK.$jazz.waitForSync();
await account.$jazz.waitForSync();
```

### Loading and Validation

```typescript
// Check if account is loaded
const isValid = account !== null && account.$isLoaded === true;
if (isValid === false) {
  throw new Error("Account must be loaded");
}

// Ensure nested CoMaps are loaded
await account.$jazz.ensureLoaded({
  resolve: {
    root: {
      "regarde-sdk": {
        auth: true,
        myUserHandle: true,
        myApps: { title: true },
      },
    },
  },
});
```

### Boolean Pattern (Explicit Checks)

```typescript
const isAvailable = !existingNickname && !reservation;
const isTokenPresent = token !== null && token.length > 0;
if (isRequired === true) {
  // Do something
}
```

## API Reference

### Auth Module (`@regarde-dev/core`)

#### `RegardeTokenAuth`

Jazz CoMap schema for registration tokens.

```typescript
const RegardeTokenAuth = co.map({
  token: z.string(),
  expiresAt: z.number(),
});
```

#### `getRegardeTokenAuth(params)`

Generates a new registration token and stores it in the provided CoMap.

**Parameters:**

- `loadedRegardeAuthCoMap: Loaded<typeof RegardeTokenAuth>` - The loaded RegardeTokenAuth CoMap

**Returns:** `Promise<string | null>` - The generated token, or null on error

#### `isTokenExpired(regardeAuth)`

Checks if a registration token has expired.

**Parameters:**

- `regardeAuth: { expiresAt: number }` - Object with expiresAt property

**Returns:** `boolean` - True if expired or invalid

#### `generateRegardeToken()`

Generates a random 16-character registration token.

**Returns:** `string` - The generated token

#### `TOKEN_LIFETIME_SECONDS`

Constant for token lifetime (24 hours = 86400 seconds).

### React/Preact Hooks

#### `useRegardeTokenAuth(regardeTokenAuthCoMap)`

**Parameters:**

- `regardeTokenAuthCoMap: Loaded<typeof RegardeTokenAuth> | null | undefined` - The loaded RegardeTokenAuth CoMap

**Returns:** `UseRegardeTokenAuthResult`

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

#### `useRegardeLemonSqueezyCheckoutLink(appId, storeName, storeDomain)`

Generates LemonSqueezy checkout links with Regarde app and user identifiers.

**Parameters:**

- `appId: string` - Regarde App ID used for webhook routing
- `storeName?: string` - Store name from lemonsqueezy.com/settings/stores
- `storeDomain?: string` - Full store domain (e.g., "https://my-store.lemonsqueezy.com")

**Returns:** `UseRegardeLemonSqueezyCheckoutLinkResult`

```typescript
{
  generateLemonSqueezyCheckoutLink: (options: {
    variantId: string | number;
    storeDomain: string;
    customData?: Record<string, string | number>;
  }) => string;
  isLoading: boolean;
  error: string | null;
}
```

### App Management (`@regarde-dev/core`)

#### `createApp(account, appData)`

Creates a new App CoMap in the user's account with payment configuration.

**Parameters:**

```typescript
account: Loaded<RegardeAccount>
appData: {
  name: string;
  description?: string;
  paymentProvider: "lemonsqueezy" | "stripe";
}
```

**Returns:** `Promise<App>` - The created App CoMap

#### `useMyApps(regardeSDK)`

Utility hook for querying user's apps.

**Parameters:**

- `regardeSDK: Loaded<RegardeSDK> | null` - Loaded RegardeSDK instance

**Returns:**

```typescript
{
  getAllApps: () => Promise<App[]>;
  getAppById: (appId: string) => Promise<App | undefined>;
  getAppsByProvider: (paymentProvider: "lemonsqueezy" | "stripe") =>
    Promise<App[]>;
}
```

### SDK Initialization (`@regarde-dev/core`)

#### `initRegardeSDK(params)`

Initializes the RegardeSDK CoMap in the user's account.

**Parameters:**

```typescript
{
  account: Loaded<RegardeAccount>;
}
```

**Returns:** `Promise<void>`

## Development

```bash
# Watch mode with .env.local
pnpm dev

# Production build
pnpm build

# Run tests
pnpm test
```

## Code Style

See [AGENTS.md](AGENTS.md) for comprehensive guidelines:

- **Imports**: External → workspace → aliased (#/) → relative
- **Naming**: camelCase functions, PascalCase types with 'T' prefix
- **Testing**: `should [outcome] when [condition]` naming pattern

### Module Aliases

```typescript
"#schemas"  → src/core/schemas
"#managers" → src/core/managers
"#init"     → src/core/init
"#core"     → src/core
"#frameworks" → src/frameworks
```
