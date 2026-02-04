# Authentication Reference

Authentication patterns for Regarde SDK.

## Overview

Regarde uses two authentication methods:

- **Passphrase**: For CLI authentication (word-based recovery phrases)
- **RegardeTokenAuth Token**: 24-hour expiring tokens for API authentication

## Authentication Methods

| Method     | Description             | Use Case                              |
| ---------- | ----------------------- | ------------------------------------- |
| Passphrase | Word-based recovery     | CLI login                             |
| Token      | 24-hour expiring tokens | API authentication (RegardeTokenAuth) |

## Anonymous Authentication

Default state on first visit. Creates local account that can be upgraded.

```typescript
// Detect anonymous state
import { useAgent, useIsAuthenticated } from "jazz-tools/react";

function AuthState() {
  const agent = useAgent();
  const isAuthenticated = useIsAuthenticated();

  const isAnonymous = agent.$type$ === "Account" && !isAuthenticated;

  return <div>{isAnonymous ? "Anonymous" : "Authenticated"}</div>;
}
```

## Passphrase Authentication (CLI)

Bitcoin-style word phrases for authentication. Used in Regarde CLI.

### Wordlist Setup

```typescript
// wordlist.ts - Use BIP39 wordlist or custom
export const wordlist = [
  "abandon",
  "ability",
  "able", // ... 2048+ words
  // Must be at least 2048 unique words (power of 2)
];
```

### CLI Implementation

```typescript
import { usePassphraseAuth } from "jazz-tools/react";
import { wordlist } from "./wordlist";

function CLIAuth() {
  const auth = usePassphraseAuth({ wordlist });
  const [input, setInput] = useState("");

  if (auth.state === "signedIn") {
    return <div>Welcome! Your passphrase: {auth.passphrase}</div>;
  }

  return (
    <div>
      <h3>Sign Up</h3>
      <p>Save this passphrase securely:</p>
      <textarea readOnly value={auth.passphrase} rows={5} />
      <button onClick={() => auth.signUp()}>I have saved my passphrase</button>

      <h3>Log In</h3>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your passphrase"
        rows={5}
      />
      <button onClick={() => auth.logIn(input)}>Log In</button>
    </div>
  );
}
```

### Passphrase API

```typescript
const auth = usePassphraseAuth({ wordlist });

// Properties
auth.passphrase; // Current recovery phrase (read-only)
auth.state; // "idle" | "loading" | "signedIn" | "error"
auth.error; // Error message if any

// Methods
auth.signUp(); // Create new account with generated passphrase
auth.logIn(passphrase); // Log in with existing passphrase
auth.logOut(); // Log out
```

### Regarde SDK Wrapper: useRegardeAuth

Regarde SDK provides a wrapper hook `useRegardeAuth` that simplifies passphrase authentication with BIP39 wordlist and automatic SDK initialization.

```typescript
import { useRegardeAuth } from "@regarde-dev/core/react";

function RegardeCLIAuth() {
  const { state, signUp, logIn, logOut, account, regardeSDK } = useRegardeAuth();
  const [input, setInput] = useState("");

  const isSignedIn = state === "signedIn";

  if (isSignedIn === true) {
    const hasSdk = regardeSDK !== null && regardeSDK.$isLoaded === true;
    return (
      <div>
        <div>Authenticated as {account?.profile.name}</div>
        {hasSdk === true && <div>SDK Version: {regardeSDK.version}</div>}
        <button onClick={logOut}>Log Out</button>
      </div>
    );
  }

  return (
    <div>
      <h3>Sign Up</h3>
      <button
        onClick={async () => {
          const passphrase = await signUp("my-username");
          alert(`SAVE THIS PASSPHRASE:\n${passphrase}`);
        }}
      >
        Create Account
      </button>

      <h3>Log In</h3>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your BIP39 passphrase"
        rows={5}
      />
      <button onClick={() => logIn(input)}>Log In</button>
    </div>
  );
}
```

#### useRegardeAuth API

```typescript
const { state, signUp, logIn, logOut, account, regardeSDK } = useRegardeAuth();

// Properties
state; // "anonymous" | "signedIn" (binary state, no loading)
account; // Loaded RegardeAccount | null
regardeSDK; // Loaded RegardeSDK | null

// Methods
signUp(userName: string): Promise<string>; // Returns BIP39 passphrase
logIn(passphrase: string): Promise<void>;
logOut(): void;
```

#### Key Features

- **BIP39 Wordlist**: Uses english wordlist from @scure/bip39
- **Automatic SDK Init**: RegardeSDK initialized via RegardeAccount.withMigration
- **Binary State**: Only "anonymous" | "signedIn" (no loading state exposed)
- **Passphrase Return**: signUp() returns the generated passphrase for user ownership
- **Deep Resolution**: Automatically resolves account.root["regarde-sdk"] with auth, myApps, myUserHandle, myPayments
- **Explicit Loading**: Returns null for account/regardeSDK until loaded (check with `$isLoaded === true`)

### Security Warning

**IMPORTANT**: The recovery passphrase is the ONLY way to access an account. If compromised, it CANNOT be changed. Users must:

1. Store it in a secure location (password manager, safe)
2. Never share it with anyone
3. Understand anyone with the passphrase can access the account

## Token Authentication (RegardeTokenAuth)

24-hour expiring tokens for API authentication. Used for stateless API requests.

### Token Schema

```typescript
const RegardeTokenAuth = co
  .map({
    token: z.string(),
    expiresAt: z.number(),
  })
  .withMigration((regardeAuth) => {
    if (regardeAuth.$jazz.has("token") === false) {
      regardeAuth.$jazz.set("token", generateRegardeToken());
    }
    if (regardeAuth.$jazz.has("expiresAt") === false) {
      regardeAuth.$jazz.set("expiresAt", 0);
    }
  });
```

### Token Generation

```typescript
export const generateRegardeToken = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  const randomValues = crypto.getRandomValues(new Uint8Array(16));

  for (let i = 0; i < 16; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
};

export const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60; // 24 hours
```

### Token Expiration Check

```typescript
export const isTokenExpired = (
  auth: co.loaded<typeof RegardeTokenAuth>,
): boolean => {
  const isAuthLoaded = auth !== null && auth.$isLoaded === true;
  if (isAuthLoaded === false) {
    return true;
  }

  const hasToken = auth.token !== null && auth.token.length > 0;
  const hasExpiresAt = auth.expiresAt > 0;
  const isExpired = Date.now() > auth.expiresAt;

  return hasToken === false || hasExpiresAt === false || isExpired === true;
};
```

### Refresh Token

```typescript
export const getRegardeTokenAuth = async ({
  loadedRegardeAuthCoMap,
}: {
  loadedRegardeAuthCoMap: co.loaded<typeof RegardeTokenAuth>;
}): Promise<string | null> => {
  const isLoaded =
    loadedRegardeAuthCoMap !== null &&
    loadedRegardeAuthCoMap.$isLoaded === true;

  if (isLoaded === false) {
    return null;
  }

  loadedRegardeAuthCoMap.$jazz.set("token", generateRegardeToken());
  loadedRegardeAuthCoMap.$jazz.set(
    "expiresAt",
    Date.now() + TOKEN_LIFETIME_SECONDS * 1000,
  );

  await loadedRegardeAuthCoMap.$jazz.waitForSync();

  return loadedRegardeAuthCoMap.token;
};
```

### React Hook

```typescript
export function useRegardeTokenAuth(
  regardeTokenAuthCoMap: Loaded<typeof RegardeTokenAuth> | null | undefined,
): UseRegardeTokenAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const isCoMapLoaded =
      regardeTokenAuthCoMap !== null &&
      regardeTokenAuthCoMap.$isLoaded === true;

    if (isCoMapLoaded === false) {
      setError("No auth CoMap provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newToken = await getRegardeTokenAuth({
        loadedRegardeAuthCoMap: regardeTokenAuthCoMap,
      });

      const hasNewToken = newToken !== null && newToken.length > 0;
      if (hasNewToken === false) {
        setError("Failed to refresh token");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  }, [regardeTokenAuthCoMap]);

  // Auto-refresh check
  useEffect(() => {
    const isCoMapPresent =
      regardeTokenAuthCoMap !== null && regardeTokenAuthCoMap !== undefined;

    if (isCoMapPresent === true) {
      const isExpired = isTokenExpired(regardeTokenAuthCoMap);
      if (isExpired === true && isLoading === false) {
        refresh();
      }
    }
  }, [regardeTokenAuthCoMap, isLoading, refresh]);

  return {
    token: regardeTokenAuthCoMap?.token ?? null,
    tokenId: regardeTokenAuthCoMap?.$jazz.id ?? null,
    expiresAt: regardeTokenAuthCoMap?.expiresAt ?? null,
    isExpired: regardeTokenAuthCoMap
      ? isTokenExpired(regardeTokenAuthCoMap)
      : true,
    refresh,
    isLoading,
    error,
  };
}
```

### API Usage

```typescript
import { useRegardeTokenAuth } from "@regarde-dev/core/react";

function ApiCaller() {
  const { regardeSDK } = useMyRegardeAccount();
  const { token, tokenId, isExpired, refresh, isLoading, error } =
    useRegardeTokenAuth(regardeSDK?.auth);

  const makeApiCall = useCallback(async () => {
    const hasToken = token !== null && token.length > 0;
    const hasTokenId = tokenId !== null && tokenId.length > 0;
    const hasBoth = hasToken && hasTokenId;

    if (hasBoth === false) return;

    const response = await fetch("/api/action", {
      headers: {
        "X-Regarde-Token": token,
        "X-Regarde-Token-Id": tokenId,
      },
    });

    return response.json();
  }, [token, tokenId]);

  // ...
}
```

## Authentication Flow

1. User generates token via `generateRegardeToken()`
2. Token stored in `account.root["regarde-sdk"].auth`
3. User sends token + CoMap ID in headers (`X-Regarde-Token`, `X-Regarde-Token-Id`)
4. Worker loads `RegardeTokenAuth` using `RegardeTokenAuth.load(id, { loadAs: worker })`
5. Worker loads user account to verify ownership via `canAdmin(regardeAuth)`
6. Worker verifies token matches and hasn't expired
7. Worker performs requested action
8. Worker returns response

## Worker Token Verification

```typescript
async function verifyToken(req: Request, worker: Account) {
  const token = req.headers.get("X-Regarde-Token");
  const tokenId = req.headers.get("X-Regarde-Token-Id");

  const hasToken = token !== null && token.length > 0;
  const hasTokenId = tokenId !== null && tokenId.length > 0;
  const hasBothHeaders = hasToken && hasTokenId;

  if (hasBothHeaders === false) {
    throw new Error("Missing auth headers");
  }

  const regardeAuth = await RegardeTokenAuth.load(tokenId, { loadAs: worker });
  const isAuthLoaded = regardeAuth !== null && regardeAuth.$isLoaded === true;

  if (isAuthLoaded === false) {
    throw new Error("Invalid token ID");
  }

  const tokenMatches = regardeAuth.token === token;
  if (tokenMatches === false) {
    throw new Error("Token mismatch");
  }

  const isExpired = Date.now() > regardeAuth.expiresAt;
  if (isExpired === true) {
    throw new Error("Token expired");
  }

  // Verify ownership
  const userAccount =
    await regardeAuth.$jazz.owner.$jazz.owner.$jazz.ensureLoaded();
  const isUserLoaded = userAccount !== null && userAccount.$isLoaded === true;
  const canAdmin =
    isUserLoaded === true ? userAccount.canAdmin(regardeAuth) : false;

  if (canAdmin === false) {
    throw new Error("Ownership verification failed");
  }

  return { regardeAuth, userAccount };
}
```

## Guest Mode

Read-only access without account. Not typically used in Regarde.

```typescript
import { JazzReactProvider } from "jazz-tools/react";

function App() {
  return (
    <JazzReactProvider
      sync={...}
      guestMode={true} // Enable guest mode
    >
      <MyApp />
    </JazzReactProvider>
  );
}
```

## Authentication States

Detect and handle different auth states.

```typescript
import { useAgent, useIsAuthenticated } from "jazz-tools/react";

function AuthAware() {
  const agent = useAgent();
  const isAuthenticated = useIsAuthenticated();

  const isGuest = agent.$type$ !== "Account";
  const isAnonymous = agent.$type$ === "Account" && !isAuthenticated;

  if (isGuest) {
    return <GuestView />;
  }

  if (isAnonymous) {
    return <AnonymousView />;
  }

  return <AuthenticatedView />;
}
```

## Best Practices

### 1. Use Passphrase for CLI

```typescript
// CLI uses passphrase for authentication
const auth = usePassphraseAuth({ wordlist });

// Store passphrase securely after signup
console.log("SAVE THIS PASSPHRASE:", auth.passphrase);
```

### 2. Handle Token Expiration

```typescript
const { token, isExpired, refresh, isLoading } = useRegardeTokenAuth(auth);

// Auto-refresh before expiration
useEffect(() => {
  const expiresSoon =
    expiresAt !== null && Date.now() > expiresAt - 5 * 60 * 1000; // 5 min buffer

  if (expiresSoon === true && isLoading === false) {
    refresh();
  }
}, [expiresAt, isLoading, refresh]);
```

### 3. Store Token Securely

```typescript
// Token is in RegardeTokenAuth CoMap (already secure via Jazz)
// Never store in localStorage/sessionStorage separately
const regardeAuth = RegardeTokenAuth.create({ ... }, { owner: userGroup });
await regardeAuth.$jazz.waitForSync();
```

### 4. Verify Token on Worker

```typescript
// Server-side verification with explicit checks
async function verifyToken(req: Request, worker: Account) {
  const token = req.headers.get("X-Regarde-Token");
  const tokenId = req.headers.get("X-Regarde-Token-Id");

  const hasBoth = token !== null && tokenId !== null;
  if (hasBoth === false) {
    throw new Error("Missing auth headers");
  }

  const auth = await RegardeTokenAuth.load(tokenId, { loadAs: worker });
  const isLoaded = auth !== null && auth.$isLoaded === true;

  if (isLoaded === false) {
    throw new Error("Invalid token");
  }

  const tokenValid = auth.token === token;
  const notExpired = Date.now() <= auth.expiresAt;

  if (tokenValid === false || notExpired === false) {
    throw new Error("Token invalid or expired");
  }

  return auth;
}
```

### 5. Use Wordlist for Passphrase

```typescript
// Use BIP39 wordlist or custom
// Minimum 2048 unique words (power of 2)
export const wordlist = [...]; // 2048+ words
```

### 6. Warn Users About Recovery Keys

```typescript
// Display prominently in CLI
console.log("╔════════════════════════════════════════════════════════╗");
console.log("║  WARNING: This passphrase is your ONLY recovery method ║");
console.log("║  If lost, your account CANNOT be recovered            ║");
console.log("║  Store it securely - it CANNOT be changed if leaked   ║");
console.log("╚════════════════════════════════════════════════════════╝");
console.log("\nYour passphrase:", passphrase);
```
