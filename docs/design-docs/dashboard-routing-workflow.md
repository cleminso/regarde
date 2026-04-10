# Dashboard Routing Workflow

## Overview

This document explains the TanStack Router-based routing system for the dashboard application and provides a step-by-step workflow for creating new routes.

## Architecture

### File-Based Routing

The dashboard uses **TanStack Router's file-based routing system**. Routes are defined by the file structure in `src/routes/`, not by a configuration object.

```
src/routes/
├── __root.tsx                    # Root layout (all routes inherit)
├── index.tsx                     # Landing page ("/")
├── register-app.tsx              # App registration ("/register-app")
└── app/
    └── $appId/                   # Dynamic segment ("/app/:appId/*")
        ├── overview.tsx          # Overview page
        ├── webhooks.tsx          # Webhooks list
        ├── webhook.$webhookId.tsx # Webhook detail
        └── settings.tsx          # Settings page
```

### Route Tree Generation

TanStack Router generates the route tree at build time based on file paths:

| File Path | Route Path | Component |
|-----------|------------|-----------|
| `index.tsx` | `/` | `IndexRoute` |
| `register-app.tsx` | `/register-app` | `RegisterAppPage` |
| `app/$appId/overview.tsx` | `/app/:appId/overview` | `OverviewPage` |
| `app/$appId/webhooks.tsx` | `/app/:appId/webhooks` | `RouteComponent` |
| `app/$appId/webhook.$webhookId.tsx` | `/app/:appId/webhook/:webhookId` | `RouteComponent` |

**Key conventions:**
- `$` prefix = dynamic parameter (`$appId` → `:appId`)
- `.` separator = nested dynamic segments (`webhook.$webhookId` → `/webhook/:webhookId`)
- `index.tsx` = root route of a directory
- `__root.tsx` = parent of all routes

### Layout Hierarchy

Routes inherit layouts through file location:

```
__root.tsx (all routes)
└── app/$appId/__layout.tsx (would wrap all $appId children)
    ├── overview.tsx
    ├── webhooks.tsx
    └── settings.tsx
```

Currently, we use **one layout** (`__root.tsx`) with conditional rendering based on the route path.

### How __root.tsx Works

```typescript
// src/routes/__root.tsx
export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent(): React.ReactElement {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/app/");

  if (isAppRoute) {
    return (
      <SidebarProvider ...>
        <DashboardLayout>
          <DashboardHeader />
          <DashboardBody>
            <Outlet />  {/* Child route renders here */}
          </DashboardBody>
        </DashboardLayout>
      </SidebarProvider>
    );
  }

  return <Outlet />;  {/* Non-app routes (landing, register) */}
}
```

**Key points:**
- `<Outlet />` renders the matched child route's component
- App routes (`/app/*`) get the dashboard layout with sidebar
- Other routes (`/`, `/register-app`) render without layout
- Sidebar state is persisted via cookie

## Navigation System

### Two-Level Navigation

The dashboard has two navigation systems:

1. **Sidebar Navigation** (`DashboardNavigation`)
   - Shows Overview, Webhooks, Settings
   - Reads from `getAppRoutes()` in `lib/navigation/appRoutes.ts`
   - Highlights active route based on URL

2. **Header/Breadcrumb** (`DashboardHeader`)
   - Shows current page title
   - Uses `usePageTitle()` hook from `appRoutes.ts`
   - Reads title from route definition

### Route Definitions (appRoutes.ts)

All route metadata is centralized in `lib/navigation/appRoutes.ts`:

```typescript
export interface TRoute {
  id: string;           // Unique identifier
  title: string;        // Display title (for sidebar/header)
  link: string;         // URL pattern
  if?: boolean | (() => boolean);  // Visibility condition
  checkIsActive?: (pathname: string, appId?: string) => boolean;
}

export function getAppRoutes(appId?: string): TRoute[] {
  return [
    {
      id: "overview",
      title: "Overview",
      link: `/app/${appId}/overview`,
      checkIsActive: (pathname, id) => pathname === `/app/${id}/overview`,
    },
    {
      id: "webhooks",
      title: "Webhooks",
      link: `/app/${appId}/webhooks`,
      checkIsActive: (pathname, id) => pathname.startsWith(`/app/${id}/webhooks`),
    },
    // ... more routes
  ];
}
```

**Why centralize?**
- Single source of truth for route metadata
- Navigation updates automatically when routes change
- Active state logic defined once, used everywhere

## Workflow: Creating a New Route

### Step 1: Create the Route File

Create a new file in the appropriate directory under `src/routes/`.

**Location matters:**
- Root-level routes (no sidebar): `src/routes/my-route.tsx`
- App-scoped routes (with sidebar): `src/routes/app/$appId/my-route.tsx`

**Example:** Adding an "Integrations" page

```typescript
// src/routes/app/$appId/integrations.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$appId/integrations")({
  component: IntegrationsPage,
});

function IntegrationsPage(): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="font-mono text-sm text-muted-foreground">
        Integrations page
      </p>
    </div>
  );
}
```

### Step 2: Add Route to Navigation (if needed)

If this route should appear in the sidebar, add it to `appRoutes.ts`:

```typescript
// src/lib/navigation/appRoutes.ts
export function getAppRoutes(appId?: string): TRoute[] {
  return [
    // ... existing routes
    {
      id: "integrations",
      title: "Integrations",
      link: `${baseRoute}/integrations`,
      if: appId !== undefined,
      checkIsActive: (pathname: string, id?: string) => {
        if (!id) return false;
        return pathname.startsWith(`/app/${id}/integrations`);
      },
    },
  ];
}
```

**Why?** The sidebar automatically renders all routes from `getAppRoutes()`. No need to touch `DashboardNavigation.tsx`.

### Step 3: Create Page Component (if complex)

For simple pages, inline the component in the route file (like Step 1).

For complex pages, create a separate component:

```typescript
// src/components/integrations/integrationsPage.tsx
"use client";

import { useRegardeApp } from "@regarde-dev/core";

interface IntegrationsPageProps {
  appId: string;
}

export function IntegrationsPage({ appId }: IntegrationsPageProps): React.ReactElement {
  const app = useRegardeApp(appId);
  // Complex logic, state, effects here
  
  return (
    <div>...</div>
  );
}
```

Then import in route file:

```typescript
// src/routes/app/$appId/integrations.tsx
import { IntegrationsPage } from "#components/integrations/integrationsPage";

export const Route = createFileRoute("/app/$appId/integrations")({
  component: RouteComponent,
});

function RouteComponent(): React.ReactElement {
  const { appId } = Route.useParams();
  return <IntegrationsPage appId={appId} />;
}
```

### Step 4: Handle Parameters

For dynamic parameters (IDs), use the `$` prefix in the filename:

```
webhook.$webhookId.tsx → /app/:appId/webhook/:webhookId
```

Access in component:

```typescript
const { appId, webhookId } = Route.useParams();
```

### Step 5: Add Navigation Links (if needed)

Use TanStack Router's `Link` component:

```typescript
import { Link } from "@tanstack/react-router";

<Link to="/app/$appId/integrations" params={{ appId }}>
  Go to Integrations
</Link>
```

Or use the route's generated types (type-safe):

```typescript
<Link to="/app/$appId/integrations" params={{ appId: app.$jazz.id }}>
```

## Best Practices

### 1. Keep Route Files Thin

Route files should handle:
- URL parameter extraction
- Route-level guards (auth checks)
- Component mounting

**Not:**
- Complex business logic (move to page components)
- State management (move to hooks)
- Data fetching (use Jazz hooks in page components)

### 2. Use Path Aliases

```typescript
// Good
import { DashboardLayout } from "#layout/dashboardLayout";
import { WebhookListPage } from "#components/webhooks/webhooksListPage";

// Avoid
import { DashboardLayout } from "../../../components/layout/dashboardLayout";
```

### 3. Consistent Naming

| Route File | Export Name | Pattern |
|------------|-------------|---------|
| `overview.tsx` | `OverviewPage` | PascalCase + Page suffix |
| `webhooks.tsx` | `RouteComponent` or `WebhooksPage` | Consistent within file |
| `index.ts` (component folder) | Named exports | `export { ComponentName }` |

### 4. Parameter Safety

Always validate parameters before use:

```typescript
const { appId } = Route.useParams();

if (!appId) {
  // Handle missing param (redirect or error)
  return <Navigate to="/" />;
}
```

### 5. Route Guards

For routes requiring authentication or specific conditions:

```typescript
export const Route = createFileRoute("/app/$appId/protected")({
  component: ProtectedPage,
  beforeLoad: ({ params }) => {
    // Check permissions before rendering
    if (!hasAccess(params.appId)) {
      throw redirect({ to: "/" });
    }
  },
});
```

## Common Patterns

### Nested Routes

```
src/routes/app/$appId/
├── webhooks/
│   └── index.tsx           # /app/:appId/webhooks
├── webhook.$webhookId/
│   ├── index.tsx           # /app/:appId/webhook/:webhookId
│   └── logs.tsx            # /app/:appId/webhook/:webhookId/logs
```

### Layout Routes

Create a layout that wraps multiple children:

```typescript
// src/routes/app/$appId/_layout.tsx
export const Route = createFileRoute("/app/$appId/_layout")({
  component: AppLayout,
});

function AppLayout(): React.ReactElement {
  return (
    <div className="special-layout">
      <Outlet />
    </div>
  );
}
```

### Lazy Loading

For heavy routes, use lazy loading:

```typescript
export const Route = createFileRoute("/app/$appId/heavy")({
  component: lazy(() => import("./heavyPage")),
});
```

## Troubleshooting

### "Route not found"

- Check file location matches intended URL pattern
- Run `pnpm dev` to regenerate route tree
- Check for typos in `$param` names

### "Component not defined"

- Ensure component is exported correctly
- Check import path uses correct alias
- Verify file name matches export name (case-sensitive)

### Sidebar not showing new route

- Did you add it to `getAppRoutes()` in `appRoutes.ts`?
- Check `if` condition isn't hiding it
- Verify `link` property matches route path

## Summary

The routing system follows this flow:

1. **User navigates** → URL matches file path in `src/routes/`
2. **TanStack Router** → Renders matched route component in `<Outlet />`
3. **__root.tsx** → Wraps with layout (if app route)
4. **Route file** → Extracts params, mounts page component
5. **Page component** → Renders UI, handles business logic
6. **Navigation** → Reads from `appRoutes.ts` for sidebar/header

**Key insight:** Route files are the "adapter" between the URL and your components. Keep them focused on that single responsibility.

## TODO: Skill for Route Scaffolding

Consider creating an agent skill to automate route creation:

### Purpose
Eliminate repetitive steps and reduce errors when creating new dashboard routes.

### Current Pain Points
- Forgetting to add route to `getAppRoutes()` in `appRoutes.ts`
- Inconsistent naming (PascalCase vs camelCase, "Page" suffix)
- Mismatch between file path and route definition
- Manual boilerplate writing

### Proposed Skill: `create-dashboard-route`

**Input:**
- Route name: "integrations"
- Path pattern: `/app/$appId/integrations`
- Sidebar navigation: yes (default)
- Page complexity: simple | complex

**Actions:**
1. Create route file at `src/routes/app/$appId/integrations.tsx`
2. Add entry to `getAppRoutes()` in `appRoutes.ts`
3. Create page component in `src/components/integrations/` (if complex)
4. Update component index exports
5. Run `pnpm dev` to regenerate route tree

**Triggers:**
- "create new route"
- "add dashboard page"
- "scaffold route"

**Decision:** Not implemented yet. Current team size doesn't justify the maintenance overhead. Revisit when route creation frequency increases or team grows.
