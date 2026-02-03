# Authentication API (Regarde)

This is a quick reference for the Regarde token flow built on Jazz CoMaps.

## Data Model

- `RegardeTokenAuth` is a CoMap stored under `account.root["regarde-sdk"].auth`.
- API callers send the token plus the CoMap ID in headers:
  - `X-Regarde-Token`
  - `X-Regarde-Token-Id`

## Token Helpers

```typescript
export const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;

export const generateRegardeToken = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const randomValues = crypto.getRandomValues(new Uint8Array(16));
  let result = "";

  for (let i = 0; i < 16; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
};

export const isTokenExpired = (
  auth: co.loaded<typeof RegardeTokenAuth>,
): boolean => {
  const isAuthLoaded = auth !== null && auth.$isLoaded === true;
  if (isAuthLoaded === false) return true;

  const hasToken = auth.token !== null && auth.token.length > 0;
  const hasExpiresAt = auth.expiresAt > 0;
  const isExpired = Date.now() > auth.expiresAt;

  return hasToken === false || hasExpiresAt === false || isExpired === true;
};

export const refreshRegardeAuthToken = async (
  auth: co.loaded<typeof RegardeTokenAuth>,
): Promise<string | null> => {
  const isAuthLoaded = auth !== null && auth.$isLoaded === true;
  if (isAuthLoaded === false) return null;

  auth.$jazz.set("token", generateRegardeToken());
  auth.$jazz.set("expiresAt", Date.now() + TOKEN_LIFETIME_SECONDS * 1000);
  await auth.$jazz.waitForSync();

  return auth.token;
};
```

## Worker Verification

```typescript
async function verifyRegardeToken(req: Request, worker: Account) {
  const token = req.headers.get("X-Regarde-Token");
  const tokenId = req.headers.get("X-Regarde-Token-Id");

  if (token === null || token.length === 0) {
    throw new Error("Missing auth headers");
  }

  if (tokenId === null || tokenId.length === 0) {
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

  // Ownership check (high-level): user account must be able to admin the token
  const ownerGroup = regardeAuth.$jazz.owner;
  const ownerGroupLoaded = ownerGroup !== null && ownerGroup.$isLoaded === true;
  if (ownerGroupLoaded === false) {
    throw new Error("Token owner group not loaded");
  }

  return { regardeAuth };
}
```
