# Regarde Dashboard Implementation Plan

## Overview

Implementation of SDK hooks for Jazz data subscription and dashboard data tables for visualizing Regarde App activity.

**Tech Stack:**
- Vite + TanStack Router + TanStack Table
- Kibo-UI table components (already installed)
- Jazz for real-time data sync
- `@regarde-dev/core` for schema definitions and hooks

---

## Phase 1: SDK Hooks Implementation

### Location
```
packages/sdk/src/frameworks/react/hooks/
```

### Files to Create

#### 1. `useApp.ts`
**Purpose:** Subscribe to a single App CoValue and ensure all event maps are loaded.

**Interface:**
```typescript
export function useApp(appId: string): TApp | null
```

**Implementation Notes:**
- Use `useCoState` from `jazz-tools/react`
- Pass `resolve: { payments: true, subscriptions: true, licenses: true }`
- Returns null while loading

---

#### 2. `usePaymentEvents.ts`
**Purpose:** Subscribe to all PaymentEvents for an App with optional mode filtering.

**Interface:**
```typescript
export function usePaymentEvents(
  appId: string,
  options?: {
    mode?: "test" | "production" | "all"  // default: "all"
  }
): {
  events: TPaymentEvent[]
  isLoading: boolean
}
```

**Implementation Notes:**
- Use `useApp` internally to get App reference
- Access `app.payments.all` record (maps providerUUID → eventId)
- Resolve PaymentEvent CoMaps from IDs using `useCoList`
- Filter by `mode` field if option provided
- Set `isLoading: true` until all CoMaps are loaded

---

#### 3. `useSubscriptionEvents.ts`
**Purpose:** Subscribe to SubscriptionEvent history for an App.

**Interface:**
```typescript
export function useSubscriptionEvents(
  appId: string,
  options?: {
    mode?: "test" | "production" | "all"
    providerSubscriptionId?: string  // Filter by specific subscription
  }
): {
  events: TSubscriptionEvent[]
  isLoading: boolean
}
```

**Implementation Notes:**
- Access `app.subscriptions.all` record
- Resolve SubscriptionEvent CoMaps
- Apply mode filter
- If `providerSubscriptionId` provided, filter by matching field

---

#### 4. `useLicenseEvents.ts`
**Purpose:** Subscribe to LicenseEvent history for an App.

**Interface:**
```typescript
export function useLicenseEvents(
  appId: string,
  options?: {
    mode?: "test" | "production" | "all"
    providerLicenseId?: string  // Filter by specific license
  }
): {
  events: TLicenseEvent[]
  isLoading: boolean
}
```

**Implementation Notes:**
- Access `app.licenses.all` record
- Resolve LicenseEvent CoMaps
- Apply mode filter
- If `providerLicenseId` provided, filter by matching field

---

#### 5. `useActiveSubscriptions.ts`
**Purpose:** Subscribe to current subscription state (mutable), not events.

**Interface:**
```typescript
export function useActiveSubscriptions(
  appId: string
): {
  subscriptions: TSubscription[]  // Current state, not events
  isLoading: boolean
}
```

**Implementation Notes:**
- Access `app.subscriptions.status` record (maps providerSubId → subscriptionId)
- These are `Subscription` CoMaps (mutable state), not `SubscriptionEvent`
- Shows current status, period dates, cancel flags

---

#### 6. `index.ts`
**Purpose:** Export all hooks from `/react` subpath.

**Export Pattern:**
```typescript
export { useApp } from "./useApp"
export { usePaymentEvents } from "./usePaymentEvents"
export { useSubscriptionEvents } from "./useSubscriptionEvents"
export { useLicenseEvents } from "./useLicenseEvents"
export { useActiveSubscriptions } from "./useActiveSubscriptions"
```

**Build Configuration:**
- Ensure hooks are bundled separately in `dist/react.js`
- Update `package.json` exports:
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./react": "./dist/react.js",
    "./preact": "./dist/preact.js"
  }
}
```

---

## Phase 2: Dashboard Routes Implementation

### Location
```
apps/dashboard.regarde.dev/src/routes/
```

### Route Structure

```
routes/
├── __root.tsx                    # Root layout + redirect to first app
└── $appId/
    ├── route.tsx                 # App layout with sidebar
    ├── overview.tsx              # Default view - KPIs + recent activity
    ├── payments.tsx              # Payments table
    ├── subscriptions.tsx         # Subscriptions (active + events)
    └── licenses.tsx              # Licenses table
```

---

### File: `__root.tsx`

**Responsibilities:**
1. Load user's apps via existing SDK hook
2. Redirect to `/$firstAppId/overview` if apps exist
3. Show "Create your first app" message if no apps

**Route Config:**
- No parameters
- Always redirects to a specific app

---

### File: `$appId/route.tsx`

**Layout Structure:**
```tsx
<div className="flex h-screen overflow-hidden">
  {/* Sidebar Navigation */}
  <aside className="w-64 flex-shrink-0 border-r">
    <nav>
      <Link to="/$appId/overview">Overview</Link>
      <Link to="/$appId/payments">Payments</Link>
      <Link to="/$appId/subscriptions">Subscriptions</Link>
      <Link to="/$appId/licenses">Licenses</Link>
    </nav>
  </aside>
  
  {/* Main Content */}
  <div className="flex-1 flex flex-col min-w-0">
    <header className="h-16 flex-shrink-0 border-b">
      {/* App Selector Dropdown */}
      {/* Per-Table Mode Filter (All/Test/Production) */}
    </header>
    <main className="flex-1 overflow-hidden p-6">
      <Outlet />
    </main>
  </div>
</div>
```

**Notes:**
- Mode filter is per-table, not global
- Store mode preference in URL search params per route
- App selector uses `useMyRegardeAccount()` to list user's apps

---

### File: `$appId/overview.tsx`

**Content:**
1. KPI Cards (Revenue, Active Subscriptions, Active Licenses)
2. Recent Activity section - last 5 events from each type

**KPI Implementation:**
- Use `usePaymentEvents`, `useActiveSubscriptions`, `useLicenseEvents`
- Calculate aggregates client-side from loaded data
- Show "Loading..." while data loads

**Recent Activity:**
- Combine last 5 items from each event type
- Sort by timestamp
- Show event type badge

---

### File: `$appId/payments.tsx`

**State:**
- Mode filter: `search.mode` ("all" | "test" | "production")

**Data Loading:**
```tsx
const { events, isLoading } = usePaymentEvents(appId, { mode: search.mode })
```

**Table Columns:**

| Column | Type | Cell Content |
|--------|------|--------------|
| Date | number (timestamp) | Localized date, UTC tooltip on hover |
| Amount | string | `${amount} ${currency}` |
| Status | enum | Badge: succeeded (green), failed (red), refunded (orange), pending (yellow) |
| Provider | enum | Badge: stripe, polar, lemonsqueezy |
| Mode | enum | Badge: test (orange), production (subtle) |
| User | string | Truncated Jazz ID, clickable link to customer page |
| Subscription | string | If `providerSubscriptionId` exists: link to `/subscriptions?providerSubscriptionId=xxx` with truncated ID. Else: `—` |
| License | string | If `providerLicenseId` exists: link to `/licenses?providerLicenseId=xxx` with truncated ID. Else: `—` |

**Empty State:**
```
No payment events yet. Webhooks will appear here when received.
```

**Loading State:**
```
Loading...
```

---

### File: `$appId/subscriptions.tsx`

**State:**
- Mode filter: `search.mode`
- View toggle: `search.view` ("active" | "events")
- Filter from payment link: `search.providerSubscriptionId`

**Two Views:**

**1. Active Subscriptions (Default)**
```tsx
const { subscriptions, isLoading } = useActiveSubscriptions(appId)
```

Columns:
| Column | Type |
|--------|------|
| Provider ID | string (truncated) |
| Status | enum Badge |
| User | string (Jazz ID) |
| Current Period | Date range |
| Plan ID | string |
| Provider | Badge |
| Last Payment | Link to payment |

**2. Subscription Events**
```tsx
const { events, isLoading } = useSubscriptionEvents(appId, { 
  mode: search.mode,
  providerSubscriptionId: search.providerSubscriptionId 
})
```

Columns:
| Column | Type |
|--------|------|
| Date | timestamp |
| Event Type | enum (created, updated, canceled) |
| Provider ID | string |
| Status | enum at time of event |
| Period | Date range |
| Plan | string |

**Empty State:**
```
No subscription events yet. Webhooks will appear here when received.
```

---

### File: `$appId/licenses.tsx`

**State:**
- Mode filter: `search.mode`
- Filter from payment link: `search.providerLicenseId`

**Data Loading:**
```tsx
const { events, isLoading } = useLicenseEvents(appId, {
  mode: search.mode,
  providerLicenseId: search.providerLicenseId
})
```

**Table Columns:**

| Column | Type | Notes |
|--------|------|-------|
| Date | timestamp | Event timestamp |
| Event Type | enum | created, updated, revoked |
| License Key | string | For LemonSqueezy |
| Product ID | string | Product being licensed |
| Status | enum | active, inactive, revoked |
| User | string | Jazz ID |
| Provider | Badge | stripe, polar, lemonsqueezy |

**Empty State:**
```
No license events yet. Webhooks will appear here when received.
```

---

## Shared Components

### Location
```
apps/dashboard.regarde.dev/src/components/
```

### Components to Create

#### `components/tables/cells/TimestampCell.tsx`
**Props:** `{ value: number }`
**Behavior:**
- Display: Localized date string
- Tooltip on hover: Full UTC ISO string
- Use browser's `Intl.DateTimeFormat`

#### `components/tables/cells/StatusBadge.tsx`
**Props:** `{ status: PaymentStatus | SubscriptionStatus | LicenseStatus }`
**Behavior:**
- Map status to color variant
- Use shadcn Badge component

#### `components/tables/cells/ProviderBadge.tsx`
**Props:** `{ provider: TPaymentProvider }`
**Behavior:**
- Display provider name with icon
- Consistent styling across tables

#### `components/tables/cells/RelationLink.tsx`
**Props:** `{ type: "subscription" | "license", id?: string, appId: string }`
**Behavior:**
- If `id` provided: Link to respective route with filter param
- If `id` not provided: Show `—`
- Truncate ID for display, show full in tooltip

#### `components/layout/AppSelector.tsx`
**Purpose:** Dropdown to switch between user's apps
**Data:** `useMyRegardeAccount()` → `account.root["regarde-sdk"].myApps`
**Behavior:**
- List all apps with names
- Navigate to selected app's overview on change

#### `components/layout/ModeFilter.tsx`
**Props:** `{ value: Mode, onChange: (mode: Mode) => void }`
**Behavior:**
- Radio group or select: All | Test | Production
- Controlled component - state managed by parent route

---

## Technical Decisions

### Data Loading Strategy

**Real-time Sync:**
- Jazz React hooks (`useCoState`, `useCoList`) automatically re-render on CoValue changes
- No polling or manual refresh needed
- New webhook events appear automatically in tables

**Loading States:**
- Initial load: Show "Loading..." text
- Jazz sync is fast but not instant - brief loading state acceptable
- Once loaded, Jazz maintains subscription for real-time updates

**Error Handling:**
- If App not found: Show "App not found" message
- If Jazz connection fails: Rely on Jazz framework's built-in reconnection

### URL State Management

**Search Params Pattern:**
```
/$appId/payments?mode=test
/$appId/subscriptions?view=events&providerSubscriptionId=sub_123
/$appId/licenses?providerLicenseId=lic_456
```

**Benefits:**
- Bookmarkable filtered views
- Browser back/forward works
- Cross-linking between tables preserves context

### Performance Considerations

**CoValue Loading:**
- Each hook loads only what it needs
- `usePaymentEvents` doesn't load subscriptions
- Jazz batches CoValue subscriptions efficiently

**Table Rendering:**
- Kibo-UI uses standard TanStack Table
- No virtualization in Phase 2 (handle later with TanStack Virtual)
- Use `React.memo` on cell components to prevent unnecessary re-renders

---

## Testing Strategy

### SDK Hooks Testing
- Test data transformation and filtering logic
- Mock Jazz CoValues for predictable test data
- DO NOT test Jazz sync behavior

### Dashboard Testing
- Test table column rendering
- Test URL param handling
- Test empty and loading states

---

## Implementation Order

### Step 1: SDK Hooks
1. Create hook files with interfaces
2. Implement `useApp` (foundation for others)
3. Implement event hooks (`usePaymentEvents`, etc.)
4. Add exports to `index.ts`
5. Test hook returns correctly shaped data

### Step 2: Dashboard Routes
1. Create `__root.tsx` with redirect logic
2. Create `$appId/route.tsx` layout
3. Create cell components
4. Implement `payments.tsx` (most complex table)
5. Implement `subscriptions.tsx` (two views)
6. Implement `licenses.tsx`
7. Implement `overview.tsx`

### Step 3: Integration
1. Wire up all routes
2. Test cross-linking between tables
3. Test mode filtering
4. Verify real-time updates (send test webhook)

---

## Acceptance Criteria

**Phase 1 Complete When:**
- [ ] All 5 hooks exported from `@regarde-dev/core/react`
- [ ] Hooks return correctly typed data
- [ ] Mode filtering works in all event hooks
- [ ] Provider ID filtering works for subscriptions/licenses

**Phase 2 Complete When:**
- [ ] Dashboard redirects to first app automatically
- [ ] Sidebar navigation works between routes
- [ ] Payments table displays all columns correctly
- [ ] Subscription links from Payments work
- [ ] License links from Payments work
- [ ] Mode filter works per-table
- [ ] Empty states show correct messages
- [ ] Real-time updates appear without refresh

---

## Notes

- **No styling focus:** Use default shadcn/Kibo-UI styles
- **No KPI focus:** Overview page has basic structure only
- **No virtualization yet:** Handle large datasets later
- **No manual refresh:** Rely entirely on Jazz real-time sync
- **Export path:** `import { usePaymentEvents } from "@regarde-dev/core/react"`
