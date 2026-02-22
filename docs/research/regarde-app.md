# Regarde Application Architecture Research

**Date**: Analysis conducted February 2026  
**Scope**: Core SDK schemas, initialization, app management, API registration, and dashboard UI  
**Files Analyzed**:
- `packages/sdk/src/core/schemas/regardeUserApp.ts`
- `packages/sdk/src/core/schemas/regardeSDK.ts`
- `packages/sdk/src/core/init/initRegardeSDK.ts`
- `packages/sdk/src/core/managers/app/appManager.ts`
- `packages/api.regarde.dev/src/domains/app/handlers/register.ts`
- `apps/dashboard.regarde.dev/src/components/register-app/*`

---

## Executive Summary

Regarde is a webhook payment receiver service built on Jazz (a local-first sync framework). It normalizes payment events from providers (Stripe, LemonSqueezy, Polar) into unified Jazz CoMaps. The architecture separates user-owned data (App definitions, PaymentEvents) from registry-owned metadata (verification status, nickname registries), with a worker-based API mediating between them.

**Core Innovation**: Stateless 2FA authentication using expiring tokens stored in CoMaps, combined with a hierarchical group permission system that allows the worker to write payment data into user-owned stores while maintaining security boundaries.

---

## 1. Data Schema Architecture

### 1.1 App Schema (User-Owned)

**Location**: `packages/sdk/src/core/schemas/regardeUserApp.ts`

The `App` CoMap is the central entity representing a user's application configured for payment tracking:

```typescript
export const App = co.map({
  name: z.string(),                    // Display name
  description: z.string(),               // Optional description
  ownerAccountId: z.string(),           // Jazz account ID of owner
  paymentProvider: z.enum(["stripe", "polar", "lemonsqueezy"]),
  isEnabled: z.boolean(),               // Active status
  createdAt: z.number(),                // Unix timestamp
  metadata: co.record(z.string(), z.string()), // Key-value metadata
  webhookSecret: z.string(),            // Provider webhook secret
  payments: AppPaymentsSchema,          // Payment event records
  subscriptions: AppSubscriptionsSchema, // Subscription event records
  licenses: AppLicensesSchema,          // License event records
});
```

**Event Record Pattern** (used for payments, subscriptions, licenses):

Each event type uses a nested dual-indexing structure:

```typescript
export const AppPaymentsSchema = co.map({
  all: co.record(z.string(), z.string()),     // providerEventUUID -> PaymentEvent.id
  byUser: co.record(
    z.string(),                              // JazzAccount.id
    co.record(z.string(), z.string())        // providerEventUUID -> PaymentEvent.id
  ),
});
```

**Key Design Rationale**:
- `all`: Global lookup for deduplication by provider UUID
- `byUser`: User-scoped queries to fetch payments per customer
- Provider UUIDs are prefixed (e.g., `stripe_evt_123`) to prevent collisions across providers

---

### 1.2 SDK Container Schema

**Location**: `packages/sdk/src/core/schemas/regardeSDK.ts`

The `RegardeSDK` CoMap serves as the root container for all SDK data within a user's account:

```typescript
export const RegardeSDK = co.map({
  auth: RegardeTokenAuth,               // Authentication token (2FA)
  myApps: co.list(App),                 // List of user's apps
  myPayments: PaymentSchema,           // Global payment records
  mySubscriptions: SubscriptionSchema,   // Global subscription records
  myLicenses: LicenseSchema,           // Global license records
  myUserHandle: UserHandle,            // User profile & nickname
  version: z.number(),                 // Schema version for migrations
});
```

**Global Event Schemas** (different from per-App schemas):

```typescript
export const PaymentSchema = co.map({
  all: co.record(z.string(), z.string()),     // providerUUID -> PaymentEvent.id
  byApp: co.record(
    z.string(),                               // App.id
    co.record(z.string(), z.string())         // providerUUID -> PaymentEvent.id
  ),
});

export const SubscriptionSchema = co.map({
  all: co.record(z.string(), z.string()),
  byApp: co.record(z.string(), co.record(z.string(), z.string())),
  status: co.record(z.string(), z.string()),  // Mutable state tracking
});
```

**Indexing Strategy Comparison**:

| Scope | Schema | Use Case |
|-------|--------|----------|
| **Global (SDK-level)** | `byApp` index | Cross-app queries, admin views |
| **App-level** | `byUser` index | Per-customer queries within app |
| **Both** | `all` index | Deduplication by provider UUID |

---

### 1.3 Authentication Token Schema

**Location**: `packages/sdk/src/core/schemas/regardeTokenAuth.ts`

```typescript
export const RegardeTokenAuth = co
  .map({
    token: z.string(),        // 16-character secure random string
    expiresAt: z.number(),    // Unix timestamp (24-hour lifetime)
  })
  .withMigration((regardeTokenAuth) => {
    // Migration logic ensures backward compatibility
    if (!regardeTokenAuth.$jazz.has("token")) {
      regardeTokenAuth.$jazz.set("token", generateRegardeToken());
    }
    if (!regardeTokenAuth.$jazz.has("expiresAt")) {
      regardeTokenAuth.$jazz.set("expiresAt", 0);
    }
  });
```

**Purpose**: Enables stateless 2FA authentication between client SDK and API worker. The token is:
- Generated client-side by SDK
- Stored in user-owned CoMap
- Sent in HTTP headers to API
- Verified by API loading the CoMap and checking ownership + expiration

---

## 2. SDK Initialization System

### 2.1 InitRegardeSDK Function

**Location**: `packages/sdk/src/core/init/initRegardeSDK.ts` (549 lines)

**Signature**:
```typescript
export const initRegardeSDK = async (
  account: co.loaded<typeof RegardeAccount>,
  mode: "ensure" | "create" = "ensure",
  appId?: ID<typeof App>,
): Promise<co.loaded<typeof RegardeSDK>>
```

**Two-Mode Operation**:

#### Mode 1: "create" (Fresh Setup)

Used when explicitly requesting a new SDK structure. Creates:

1. **User Group** (`userGroup`)
   - Owner: user's account
   - Member: `regardeProfileWorkerGroup` with "writer" role
   - Purpose: Owns UserHandle, Auth, App list

2. **RegardeAdminOtherReadersGroup** (`regardeAdminOtherReadersGroup`)
   - Owner: user's account
   - Member: `regardeProfileWorkerGroup` with "admin" role
   - Purpose: Owns Payment/Subscription/License records
   - **Critical**: User added as "reader" at the end (line 227: `regardeAdminOtherReadersGroup.addMember(account, "reader")`)

3. **Nested Record Structures**
   - Creates individual `co.record` instances for `all` and `byApp` indices
   - Wraps them in parent `co.map` structures
   - Each creation followed by `await $jazz.waitForSync()`

4. **RegardeSDK CoMap**
   - Contains: UserHandle (placeholder data), RegardeTokenAuth (fresh token), empty App list, payment/subscription/license maps
   - Version set to `4` (migration tracking)
   - Owned by `userGroup`

#### Mode 2: "ensure" (Idempotent)

Default mode that:
1. Attempts to load existing `regarde-sdk` from account root
2. If exists and valid: returns it (after token refresh if expired)
3. If missing/invalid: falls back to "create" logic

**Validation Checks** (lines 490-546):
- Auth CoMap must be loaded
- Must have both `token` and `expiresAt` fields
- Token must be non-empty
- If expired: calls `getRegardeTokenAuth()` to refresh

---

### 2.2 Group Permission Hierarchy

**Registry Group** (Hardcoded): `co_zoppoxWWJaHYKPgSgUkuCCXQX21`

```
┌─────────────────────────────────────────────────────────┐
│            REGARDE_REGISTRY_GROUP                        │
│         (Worker-owned, hardcoded ID)                    │
│              ↓ (added as member)                        │
├─────────────────────────────────────────────────────────┤
│  User Group (owner: account)                            │
│  ├── RegardeSDK                                         │
│  │   ├── myUserHandle (UserHandle)                      │
│  │   ├── auth (RegardeTokenAuth)                        │
│  │   └── myApps (List<App>)                             │
│  │       └── App (each with own groups)                 │
│  │                                                       │
│  └── (worker has "writer" access)                       │
│                                                          │
│  RegardeAdminOtherReadersGroup (owner: account)         │
│  ├── myPayments (PaymentSchema)                         │
│  ├── mySubscriptions (SubscriptionSchema)               │
│  └── myLicenses (LicenseSchema)                        │
│      └── Individual record CoMaps                        │
│                                                          │
│  (worker has "admin", account has "reader")             │
└─────────────────────────────────────────────────────────┘
```

**Rationale for Separate Groups**:
- **User Group**: User has full control over their profile, auth tokens, and app list
- **Admin Group**: Worker needs admin access to write payment events, user only needs to read their own payments
- **Security Boundary**: Prevents user from modifying payment history while allowing reads

---

### 2.3 Critical Sync Safety Patterns

**Write-Wait-Use** (enforced throughout):
```typescript
const newCoMap = SomeCoMap.create({ ... }, { owner: someGroup });
await newCoMap.$jazz.waitForSync();  // REQUIRED before any read
```

**Create-Set-Sync** (for account root updates):
```typescript
const newSDK = RegardeSDK.create({ ... }, { owner: userGroup });
root.$jazz.set("regarde-sdk", newSDK);
await newSDK.$jazz.waitForSync();    // Wait for the new CoMap
await account.$jazz.waitForSync();    // Wait for root update
```

**Explicit Loaded Checks** (AGENTS.md "Golden Rule"):
```typescript
const isValid = account !== null && account.$isLoaded === true;
if (isValid === false) {
  throw new Error("Account must be loaded");
}
```

---

## 3. App Creation Flow

### 3.1 createApp Function

**Location**: `packages/sdk/src/core/managers/app/appManager.ts` (257 lines)

**Signature**:
```typescript
export const createApp = async (
  account: co.loaded<typeof RegardeAccount>,
  appData: CreateAppParams,
): Promise<TApp>

interface CreateAppParams {
  name: string;
  description?: string;
  paymentProvider: "lemonsqueezy" | "stripe";
}
```

**Execution Flow**:

1. **Load SDK** (lines 41-59)
   - Ensures account root loaded
   - Resolves `regarde-sdk` with all nested fields
   - Validates `myApps` list is loaded

2. **Load Registry Group** (lines 89-106)
   - Loads `REGARDE_REGISTRY_GROUP` as `regardeProfileWorkerGroup`
   - Verifies group loaded successfully

3. **Create Permission Groups** (lines 108-124)
   - Creates `regardeAdminOtherReadersGroup` (owner: account)
   - Adds `regardeProfileWorkerGroup` as "admin"
   - Waits for sync

4. **Create Event Record Maps** (lines 126-196)
   
   **Per-App Payment Records**:
   ```typescript
   const allPaymentsRecord = co.record(z.string(), z.string())
     .create({}, { owner: regardeAdminOtherReadersGroup });
   await allPaymentsRecord.$jazz.waitForSync();
   
   const byUserPaymentsRecord = co.record(z.string(), co.record(z.string(), z.string()))
     .create({}, { owner: regardeAdminOtherReadersGroup });
   await byUserPaymentsRecord.$jazz.waitForSync();
   
   const payments = co.map({
     all: co.record(z.string(), z.string()),
     byUser: co.record(z.string(), co.record(z.string(), z.string())),
   }).create(
     { all: allPaymentsRecord, byUser: byUserPaymentsRecord },
     { owner: regardeAdminOtherReadersGroup }
   );
   await payments.$jazz.waitForSync();
   ```
   
   Same pattern repeated for subscriptions and licenses (lines 150-196)

5. **Create App CoMap** (lines 198-215)
   ```typescript
   const newApp = App.create(
     {
       name: appData.name,
       description: appData.description || "",
       ownerAccountId: account.$jazz.id,
       paymentProvider: appData.paymentProvider,
       isEnabled: false,          // Disabled until API registration
       createdAt: Date.now(),
       metadata: {},
       webhookSecret: "",         // Generated by API during registration
       payments: payments,
       subscriptions: subscriptions,
       licenses: licenses,
     },
     { owner: userGroup }        // App owned by user group
   );
   await newApp.$jazz.waitForSync();
   ```

6. **Add to SDK** (lines 217-219)
   ```typescript
   myApps.$jazz.push(newApp);
   await myApps.$jazz.waitForSync();
   ```

7. **Finalize Permissions** (line 220)
   ```typescript
   regardeAdminOtherReadersGroup.addMember(account, "reader");
   ```

**Key Distinction**: Unlike SDK-level records (which use `byApp` index), App-level records use `byUser` index because:
- SDK-level: Querying "all payments for this app" (byApp makes sense)
- App-level: Querying "all payments by this customer" (byUser makes sense)

---

### 3.2 getMyApps Helper

```typescript
export const getMyApps = async (
  regardeSDK: Loaded<typeof RegardeSDK>,
): Promise<TApp[]> => {
  const myApps = regardeSDK.myApps;
  const myAppsValid = myApps !== null && myApps.$isLoaded === true;
  
  if (myAppsValid === false) {
    return [];
  }
  
  await myApps.$jazz.ensureLoaded({ resolve: { $each: true } });
  
  return Array.from(myApps).filter(
    (app): app is TApp => app !== null && app.$isLoaded === true,
  );
};
```

**Note**: The commented note (lines 255-257) clarifies that finding a specific app doesn't need a new function:
```typescript
// const myApps = await getMyApps(regardeSDK);
// const app = myApps.find(a => a.$jazz.id === appId);
```

---

## 4. API Registration Handler

### 4.1 registerAppHandler

**Location**: `packages/api.regarde.dev/src/domains/app/handlers/register.ts` (218 lines)

**Signature** (Curried Handler Pattern):
```typescript
export const registerAppHandler = (
  appsRecord: TAllRegistryAppsSchema,      // Registry-level apps index
  appsByUserRecord: TAppsByUserRecord,     // Per-user app lists
  worker: Loaded<typeof RegistryWorkerAccount>,  // Worker account
) => {
  return async (c: any) => {  // Hono context
    // Handler implementation
  };
};
```

**Curried Pattern Benefits**:
- Dependencies (registries, worker) injected at initialization time
- Handler receives only request context `c`
- Enables testing with mock dependencies
- Eliminates global state

---

### 4.2 Execution Flow

**Step 1: Header Validation** (lines 26-48)
```typescript
const regardeAuth = c.req.header("X-Regarde-Token");
const regardeAuthId = c.req.header("X-Regarde-Token-Id");

const isRegardeAuthHeaderExists = regardeAuth !== null && regardeAuth !== undefined;
if (isRegardeAuthHeaderExists === false) {
  return c.json({ error: "Missing registration token header" }, 401);
}
```

**Step 2: Parse Request Body** (line 50)
```typescript
const { appId, jazzAccountId } = await c.req.json();
```

**Step 3: Authentication Verification** (lines 53-70)
```typescript
const verificationResult = await verifyRegardeAuth(
  jazzAccountId,
  regardeAuth,
  regardeAuthId,
  worker,
);

const isAuthenticationValid = verificationResult.isValid === true;
if (isAuthenticationValid === false) {
  return c.json({ error: `Authentication failed: ${verificationResult.error}` }, 403);
}
```

**Step 4: Load and Verify App** (lines 73-87)
```typescript
const app = await App.load(appId, {
  loadAs: worker,     // Load using worker's permissions
  resolve: true,
});

const isAppLoaded = app !== null && app.$isLoaded === true;
if (isAppLoaded === false) {
  return c.json({ error: "App not found" }, 404);
}
```

**Step 5: Load User Account** (lines 90-103)
```typescript
const userAccount = await co.account().load(jazzAccountId, {
  loadAs: worker,
});

const isUserAccountLoaded = userAccount !== null && userAccount.$isLoaded === true;
if (isUserAccountLoaded === false) {
  return c.json({ error: "User account not found" }, 404);
}
```

**Step 6: Verify Admin Permissions** (lines 106-126)
```typescript
const isUserCanAdminApp = userAccount.canAdmin(app);
if (isUserCanAdminApp === false) {
  return c.json(
    { error: "Permission denied: User does not have admin access to the App" },
    403
  );
}
```

**Step 7: Load Registry Group** (lines 129-147)
```typescript
const registryProfileWorkerGroup = await co.group().load(workerId, {
  loadAs: worker,
});

const isRegistryGroupLoaded = registryProfileWorkerGroup.$isLoaded === true;
if (isRegistryGroupLoaded === false) {
  return c.json({ error: "Failed to load registry owner group" }, 500);
}
```

**Step 8: Generate/Retrieve Webhook Secret** (lines 149-159)
```typescript
const isWebhookSecretExists =
  app.webhookSecret !== null && 
  app.webhookSecret !== undefined && 
  app.webhookSecret !== "";

if (isWebhookSecretExists === false) {
  webhookSecret = randomBytes(20).toString("hex");  // 40-character hex
  app.$jazz.set("webhookSecret", webhookSecret);
  await app.$jazz.waitForSync();
} else {
  webhookSecret = app.webhookSecret;
}
```

**Step 9: Create Registry Metadata** (lines 163-177)
```typescript
const metadata = RegistryAppMetadata.create(
  {
    app: app,                    // Reference to user-owned App
    isVerified: true,            // Registry verification status
    hasAccess: false,            // Access control flag
    webhookConfigured: false,    // Provider webhook setup status
    createdAt: Date.now(),
    version: 1,
  },
  registryProfileWorkerGroup,    // Worker-owned group
);

appsRecord.$jazz.set(appId, metadata);
await appsRecord.$jazz.waitForSync();
```

**Step 10: Update Per-User Index** (lines 178-195)
```typescript
const isUserAppsListExists =
  appsByUserRecord[jazzAccountId] !== null && 
  appsByUserRecord[jazzAccountId] !== undefined;

if (isUserAppsListExists === false) {
  appsByUserRecord.$jazz.set(
    jazzAccountId,
    co.list(RegistryAppMetadata).create([], registryProfileWorkerGroup),
  );
  await appsByUserRecord.$jazz.waitForSync();
}

const userAppsList = appsByUserRecord[jazzAccountId];
const isUserAppsListValid = userAppsList !== undefined && userAppsList.$isLoaded === true;

if (isUserAppsListValid === true) {
  userAppsList.$jazz.push(metadata);
  await appsByUserRecord.$jazz.waitForSync();
}
```

**Step 11: Return Response** (lines 197-204)
```typescript
const responseData = {
  appId,
  webhookUrl: `https://api.regarde.dev/webhooks/${app.paymentProvider}/${appId}`,
  webhookSecret,
};

return c.json(responseData, 200);
```

---

### 4.3 Data Ownership Summary

| Data Type | Owner | Created By | Access Pattern |
|-----------|-------|------------|----------------|
| `App` CoMap | User Group | SDK (`createApp`) | User admin, worker writer |
| `PaymentEvent` CoMap | User Group | API (webhook handler) | User reader, worker admin |
| `RegistryAppMetadata` | Registry Group | API (`registerApp`) | Worker full control |
| `RegardeTokenAuth` | User Group | SDK (`initRegardeSDK`) | User admin only |
| `UserHandle` | User Group | SDK (`initRegardeSDK`) | User admin only |
| Nickname registries | Registry Group | API (worker init) | Worker full control |

---

## 5. Dashboard Registration Wizard

### 5.1 Component Architecture

**Location**: `apps/dashboard.regarde.dev/src/components/register-app/`

**Files**:
- `registerAppWizard.tsx` - Main wizard container (284 lines)
- `stepConfig.tsx` - Step 1: App configuration form (115 lines)
- `stepIndicator.tsx` - Visual progress indicator (26 lines)
- `stepResult.tsx` - Step 2: Registration result display (159 lines)

---

### 5.2 RegisterAppWizard Component

**State Management**:
```typescript
interface WizardState {
  step: WizardStep;              // 1 | 2
  formData: AppConfigData;     // { name, paymentProvider, description }
  submissionStatus: SubmissionStatus;  // "idle" | "loading" | "success" | "error"
  result?: RegisterAppResponse; // { appId, webhookUrl, webhookSecret }
  error?: string;
  createdApp?: TApp;           // Reference for retry logic
}
```

**Hooks Used**:
```typescript
const navigate = useNavigate();
const { account, auth, isAccountReady } = useMyRegardeAccount();
const { isExpired, refresh, isLoading: isTokenLoading } = useRegardeTokenAuth(auth);
```

---

### 5.3 Two-Step Flow

#### Step 1: Configuration

**UI**: `StepConfig` component

**Validation** (lines 52-69):
```typescript
const handleContinue = () => {
  const isNameValid = state.formData.name.trim().length > 0;
  if (isNameValid === false) {
    setState((previous) => ({
      ...previous,
      error: "Please enter an app name",
    }));
    return;
  }

  if (isAccountReady === false) {
    setState((previous) => ({
      ...previous,
      error: "Account is still loading. Please wait...",
    }));
    return;
  }

  if (auth === undefined) {
    setState((previous) => ({
      ...previous,
      error: "Authentication not available...",
    }));
    return;
  }

  // Move to step 2 and start submission
  setState((previous) => ({ ...previous, step: 2, error: undefined }));
  
  // setTimeout ensures state update completes before async work
  setTimeout(() => {
    void handleSubmit();
  }, 0);
};
```

**Form Fields** (`stepConfig.tsx`):
- App Name (required, max 50 chars)
- Payment Provider (dropdown: LemonSqueezy, Stripe)
- Description (optional, max 200 chars)

**UX Features**:
- Character counters with amber warning when low
- Inline validation error display
- Disabled Continue button when name empty

---

#### Step 2: Submission & Result

**Submission Handler** (`handleSubmit`, lines 93-154):

```typescript
const handleSubmit = async () => {
  // Guard checks
  if (isAccountReady === false || auth === undefined || account === undefined) {
    setState((previous) => ({
      ...previous,
      submissionStatus: "error",
      error: "Account not ready. Please wait and try again.",
    }));
    return;
  }

  setState((previous) => ({
    ...previous,
    submissionStatus: "loading",
    error: undefined,
  }));

  try {
    // Step 1: Refresh token if expired
    if (isExpired === true) {
      await refresh();
    }

    // Step 2: Create app locally using SDK
    const newApp = await createApp(account, {
      name: state.formData.name.trim(),
      description: state.formData.description.trim(),
      paymentProvider: state.formData.paymentProvider,
    });

    await newApp.$jazz.waitForSync();

    // Store for potential retry
    setState((previous) => ({ ...previous, createdApp: newApp }));

    // Step 3: Register with API
    const result = await registerApp(newApp.$jazz.id, auth, account.$jazz.id);

    setState((previous) => ({
      ...previous,
      submissionStatus: "success",
      result,
    }));
  } catch (error: unknown) {
    // Error handling with specific error types
    const errorMessage =
      error instanceof RegisterAppApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "An unexpected error occurred";

    setState((previous) => ({
      ...previous,
      submissionStatus: "error",
      error: errorMessage,
    }));
  }
};
```

---

### 5.4 Retry Logic

**Smart Retry** (`handleRetry`, lines 156-169):
```typescript
const handleRetry = () => {
  // If we already created the app locally, just retry the API call
  if (state.createdApp !== undefined && state.submissionStatus === "error") {
    setState((previous) => ({
      ...previous,
      submissionStatus: "loading",
      error: undefined,
    }));
    void retryApiCall();
  } else {
    // Otherwise retry the full flow
    void handleSubmit();
  }
};
```

**retryApiCall** (lines 171-217):
- Same validation as initial submit
- Refreshes expired token
- Calls `registerApp()` with stored `createdApp`
- Updates status on success/failure

---

### 5.5 Navigation Handling

```typescript
const handleGoToDashboard = async () => {
  const appId = state.createdApp?.$jazz.id ?? state.result?.appId;
  if (appId !== undefined) {
    // Wait for sync to ensure the new app is available in myApps list
    // This prevents navigation to a route that can't find the app
    await new Promise((resolve) => setTimeout(resolve, 500));
    await navigate({ to: "/app/$appId/overview", params: { appId } });
  }
};
```

**Why 500ms delay?**
- Jazz sync is eventual consistency
- Navigation immediately after registration might fail to find the new app
- Brief delay allows sync to propagate to local Jazz cache

---

### 5.6 StepResult Component

**States Rendered**:

1. **Idle** (initial):
   ```tsx
   <div className="flex flex-col items-center justify-center space-y-4 py-8">
     <Loader2 className="h-8 w-8 animate-spin text-primary" />
     <p className="text-sm text-muted-foreground">Preparing registration...</p>
   </div>
   ```

2. **Loading**:
   - Same spinner with message: "Creating your app and registering with the API..."

3. **Error**:
   - Destructive-styled error box
   - Message: "Your app has been created locally but could not be registered with the API"
   - Retry button with RefreshCw icon

4. **Success**:
   - Green success banner: "Save these credentials securely..."
   - Three `CopyableField` components:
     - App ID (plain text)
     - Webhook URL (plain text)
     - Webhook Secret (password field, focus to reveal)
   - Amber warning: "The webhook secret will not be shown again"
   - "Go to Dashboard" button

**CopyableField UX** (lines 16-74):
- Input field with read-only value
- Copy button positioned absolute right
- Success state: Check icon in green for 2 seconds
- Secret fields: Toggle between password/text on focus/blur

---

## 6. API Client (registerApp.ts)

**Location**: `apps/dashboard.regarde.dev/src/lib/api/registerApp.ts` (141 lines)

**API Base URL**:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
```

**Request Format**:
```typescript
const response = await fetch(`${API_BASE_URL}/register-app`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Regarde-Token": auth.token,
    "X-Regarde-Token-Id": auth.$jazz.id,
    "X-Jazz-Account-Id": accountId,
  },
  body: JSON.stringify({
    appId,
    jazzAccountId: accountId,
  }),
});
```

**Error Handling** (lines 73-113):
- 401/403 → `AUTH_FAILED`
- 400 → `INVALID_REQUEST`
- 404 → `API_NOT_FOUND`
- 500+ → `SERVER_ERROR`
- Default → `UNKNOWN_ERROR`

**Response Validation** (lines 117-133):
```typescript
const isValidResponse =
  data !== null &&
  typeof data === "object" &&
  "appId" in data &&
  "webhookUrl" in data &&
  "webhookSecret" in data &&
  typeof (data as Record<string, unknown>).appId === "string" &&
  typeof (data as Record<string, unknown>).webhookUrl === "string" &&
  typeof (data as Record<string, unknown>).webhookSecret === "string";
```

---

## 7. Key Architectural Insights

### 7.1 Why Two-Level Indexing?

**SDK-level** (`byApp`):
```
myPayments: {
  all: { "stripe_evt_123": "co_abc123", ... },
  byApp: {
    "co_app456": { "stripe_evt_123": "co_abc123", ... }
  }
}
```

**App-level** (`byUser`):
```
payments: {
  all: { "stripe_evt_123": "co_abc123", ... },
  byUser: {
    "co_user789": { "stripe_evt_123": "co_abc123", ... }
  }
}
```

**Use Cases**:
- `myPayments.byApp[appId]` → Get all payments for this app (admin view)
- `app.payments.byUser[userId]` → Get all payments by this customer (customer view)
- `*.all[eventUUID]` → Deduplication (prevent double-processing webhooks)

### 7.2 Statelessness via CoMap Storage

Traditional approach would store tokens in:
- Server-side sessions (stateful, scalability issues)
- JWTs in localStorage (security issues, no revocation)

**Regarde Approach**:
- Tokens stored in CoMaps (synced to Jazz network)
- API validates by loading CoMap via ID
- User proves ownership via `canAdmin()` check
- No server-side session state required

### 7.3 Group Hierarchy Complexity

**Trade-off**: Multiple groups add complexity but enable:
- Fine-grained permissions (user can read payments but not forge them)
- Worker can write payments without being account owner
- User retains ownership of their data

**Alternative Simpler Approach** (rejected):
- Single group with user owner
- Worker added as writer
- Problem: Worker could potentially modify user profile or auth tokens

### 7.4 Version Tracking

**RegardeSDK.version = 4**:
- Enables schema migrations
- `RegardeTokenAuth.withMigration()` example
- Future migrations can check version and upgrade data structures

### 7.5 Eventual Consistency Handling

**Pattern**: Always `waitForSync()` after writes, add delays before critical transitions

```typescript
// In wizard
await newApp.$jazz.waitForSync();
// ...
await new Promise((resolve) => setTimeout(resolve, 500));
await navigate({ to: "/app/$appId/overview", params: { appId } });
```

**Why not optimistic navigation?**
- Route `/app/$appId/overview` loads app from `myApps` list
- If sync hasn't completed, app won't be found → 404
- 500ms buffer covers most sync scenarios

---

## 8. Integration Points

### 8.1 Client → SDK

```typescript
import { createApp, initRegardeSDK } from "@regarde-dev/core";

// 1. Initialize SDK (creates CoMaps if missing)
const sdk = await initRegardeSDK(account, "ensure");

// 2. Create app (local only)
const app = await createApp(account, {
  name: "My App",
  paymentProvider: "stripe",
});

// 3. App created but NOT yet registered with API
// isEnabled: false, webhookSecret: ""
```

### 8.2 Client → API

```typescript
import { registerApp } from "#/lib/api/registerApp";

// Call API to register
const result = await registerApp(app.$jazz.id, auth, account.$jazz.id);

// Result contains:
// - webhookUrl: Where provider sends webhooks
// - webhookSecret: For verifying webhook authenticity
```

### 8.3 API → Webhook Processing

When provider sends webhook to `https://api.regarde.dev/webhooks/stripe/{appId}`:

1. API loads App CoMap using `appId`
2. Verifies webhook signature using `webhookSecret`
3. Creates `PaymentEvent` CoMap
4. Updates `app.payments.all[eventUUID]` = paymentEventId
5. Updates `app.payments.byUser[userId][eventUUID]` = paymentEventId
6. Also updates `sdk.myPayments` indices

---

## 9. Security Considerations

### 9.1 Authentication Flow

**Token Generation** (Client):
- 16-character random string
- 24-hour expiration
- Stored in user-owned CoMap

**Token Verification** (API):
1. Load `RegardeTokenAuth` via provided ID
2. Load user account via provided accountId
3. Verify `userAccount.canAdmin(tokenCoMap)` → proves ownership
4. Check `token === providedToken` → prevents replay with different token
5. Check `Date.now() < expiresAt` → prevents expired token use

**Attack Scenarios Prevented**:
- Token theft: Attacker needs access to user's Jazz account
- Replay attack: Token must match stored value exactly
- Impersonation: Attacker cannot create valid tokens without user's private keys

### 9.2 Webhook Security

**Secret Generation**:
```typescript
webhookSecret = randomBytes(20).toString("hex");  // 40 hex chars = 160 bits entropy
```

**Usage**:
- Provider includes secret in webhook signature
- API verifies signature before processing
- Secret only shown once during registration (dashboard warning)

### 9.3 Permission Boundaries

**What User CAN Do**:
- Read their payment history
- Update app metadata (name, description)
- Delete their app (cascades to events?)
- Rotate webhook secret (via re-registration?)

**What User CANNOT Do**:
- Modify payment events (worker-only write access)
- Forge payment history (would need worker's admin access)
- Access other users' data (Jazz group isolation)

**What Worker CAN Do**:
- Write payment events to user-owned CoMaps (via admin permission)
- Read all app metadata (via writer permission on user group)
- Modify registry metadata (owns those CoMaps)

---

## 10. Development Patterns

### 10.1 Explicit Boolean Checks (AGENTS.md "Golden Rule")

```typescript
// Preferred
const isAccountValid = account !== null && account.$isLoaded === true;
if (isAccountValid === false) { ... }

// Avoided
if (!account || !account.$isLoaded) { ... }
```

**Rationale**: Avoids JavaScript's loose truthiness (0, "", false all falsy). Explicit checks prevent bugs with numeric IDs that might be 0.

### 10.2 Logger Usage

```typescript
import { useLogging } from "#core/logger";

const logger = useLogging({
  module: import.meta.filename,  // Auto-populates source location
});

logger.debug({
  message: "Operation completed",
  data: {
    metadata: { operation: "someOperation" },  // Structured context
    jazzId: someCoMap.$jazz.id,
    isLoaded: someCoMap.$isLoaded,
  },
});
```

**Log Levels**: debug (verbose), info, warn, error

### 10.3 Type Safety

**Loaded Type Pattern**:
```typescript
export type TApp = co.loaded<typeof App>;

// Usage: guarantees $isLoaded === true
function processApp(app: TApp) {
  // TypeScript ensures app is loaded
  return app.name;  // No null checks needed
}
```

**Type Prefix Convention**:
- `TApp`, `TRegardeSDK` - Types derived from schemas
- `TAppPaymentsSchema` - Schema-specific types

---

## 11. Open Questions & Future Considerations

### 11.1 Schema Versioning

Current: `version: 4` in RegardeSDK

**Migration Strategy**:
```typescript
if (sdk.version < 4) {
  // Create missing structures
  // Migrate data from old format
  sdk.$jazz.set("version", 4);
}
```

**Challenges**:
- Jazz sync means multiple clients may have different versions
- Migrations must be idempotent
- Race conditions during migration

### 11.2 App Deletion

**Not Implemented** (in analyzed files):
- What happens to PaymentEvents when App deleted?
- Should events be cascade-deleted or orphaned?
- RegistryAppMetadata cleanup?

### 11.3 Webhook Secret Rotation

Current: Secret generated once during registration

**Possible Enhancement**:
- New endpoint: `POST /rotate-secret`
- Regenerates secret, invalidates old one
- Provider must update webhook configuration

### 11.4 Multi-Provider Apps

Current: Single `paymentProvider` per App

**Use Case**: App accepting both Stripe and LemonSqueezy
- Option 1: Create two App CoMaps
- Option 2: Change schema to `paymentProviders: co.list(z.enum(...))`

### 11.5 Subscription State Management

Current: `SubscriptionSchema.status` map tracks mutable state

**Question**: How does this interact with provider webhooks?
- Provider sends `subscription.updated` event
- API updates `status[subscriptionId]` to new CoMap ID
- Client subscribes to changes via Jazz sync

---

## 12. Conclusion

Regarde demonstrates sophisticated local-first architecture using Jazz CoMaps:

**Strengths**:
- Stateless API design eliminates session management complexity
- Fine-grained permissions via hierarchical groups
- Dual indexing enables efficient queries at multiple scopes
- Explicit sync handling prevents race conditions
- Curried handlers enable testable, dependency-injected code

**Complexity Trade-offs**:
- Multiple group types require careful permission auditing
- Write-Wait-Use pattern adds boilerplate but ensures correctness
- Two-step app creation (local + API) complicates error handling
- Eventual consistency requires defensive UI patterns (delays, retries)

**Pattern Applicability**:
These patterns apply to any Jazz-based application requiring:
- Worker-mediated data writes
- User-owned data with admin-controlled sub-resources
- Stateless authentication with local token storage
- Multi-level querying (global + scoped indices)

---

*Report compiled from analysis of 6 core files totaling ~1,400 lines of TypeScript, following explicit boolean patterns and Jazz sync conventions as documented in package AGENTS.md files.*
