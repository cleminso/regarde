# Dashboard App Specification

## Overview

Administrative interface for Regarde users to manage apps, view payments, configure webhooks, and monitor subscriptions.

**Tech Stack:** React 19 + TypeScript, TanStack Router, Jotai, Tailwind CSS v4, shadcn/ui, Jazz via `@regarde-dev/core`, TanStack Table + Kibo UI.

## Commands

```bash
pnpm dev           # Development (Vite + Agentation MCP)
pnpm build         # Production build
pnpm typecheck     # Type checking
```

## Architecture

```
src/
├── components/       # UI components
│   ├── layout/       # DashboardLayout, sidebar
│   ├── navigation/   # Breadcrumbs, app switcher
│   ├── tables/       # Table cell renderers
│   └── ui/           # shadcn/ui (+ kibo-ui/)
├── features/         # Feature modules
│   └── webhooks/     # Hooks and page components
├── hooks/            # Global hooks
├── lib/              # Utilities
├── routes/           # TanStack Router routes
└── main.tsx          # Entry point
```

### Path Aliases

```typescript
"#ui": "./src/components/ui"   // UI components
"#": "./src"                    // General imports
```

## State Management

**Jotai** for UI state, **SDK hooks** for data.

```typescript
import { atom, useAtom } from "jotai";

const sortingAtom = atom<SortingState>([]);
const [sorting, setSorting] = useAtom(sortingAtom);
```

## Routing

File-based routing. Routes auto-generate `routeTree.gen.ts`.

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$appId/webhooks")({
  component: RouteComponent,
});

function RouteComponent(): React.ReactElement {
  const { appId } = Route.useParams();
  return <WebhooksPage appId={appId} />;
}
```

## UI Components

### shadcn/ui

```typescript
import { Button } from "#ui/button";
import { Card, CardHeader } from "#ui/card";
```

### Kibo UI Table

```typescript
import { TableProvider, TableHeader, TableBody, TableRow, TableCell } from "#ui/kibo-ui/table";

<TableProvider columns={columns} data={data}>
  <TableHeader>{({ headerGroup }) => (...)}</TableHeader>
  <TableBody>{({ row }) => <TableRow row={row}>...</TableRow>}</TableBody>
</TableProvider>
```

## Data Access

### SDK Hooks - MaybeLoaded Pattern

Uses hooks from `@regarde-dev/core/react` following **MaybeLoaded** pattern from DESIGN.md.

**Single Item:**
```typescript
const app = useRegardeApp(appId);

if (app.$isLoaded === false) {
  switch (app.$jazz.loadingState) {
    case "loading": return <div>Loading...</div>;
    case "unavailable": return <div>Not found</div>;
    case "unauthorized": return <div>No access</div>;
  }
}
```

**Collections:**
```typescript
const { events, isLoading } = useWebhookEvents(appId);
if (isLoading === true) return <LoadingSpinner />;
// events is TWebhookEvent[] (only loaded items)
```

**Available Hooks:** `useRegardeApp`, `useWebhookEvents`, `usePaymentEvents`, `useActiveSubscriptions`, `useInvoices`, `useMyRegardeAccount`.

### Custom Feature Hooks

Define in `features/*/hooks/`:

```typescript
export function useWebhookDeliveries(appId: string) {
  const { events, isLoading } = useWebhookEvents(appId);
  const [filters, setFilters] = useState<DeliveryFilters>(...);
  const filteredDeliveries = useMemo(() => events.filter(...), [events, filters]);
  return { deliveries: events, filteredDeliveries, isLoading, filters, setFilters };
}
```

## Code Style

### Boolean Pattern (CRITICAL)

ALWAYS use explicit `=== true` and `=== false`:

```typescript
// CORRECT
const isLoading = isLoadingWebhooks === true;
if (isLoading === true) { ... }

// INCORRECT
if (isLoading) { ... }
if (!data) { ... }
```

### TypeScript Rules

- **T-Prefix:** Types use `T` prefix (`TWebhook`, `TApp`)
- **No `any`:** Use `unknown` or proper typing
- **Explicit Returns:** Exported functions declare return types
- **Strict Mode:** Full strict TypeScript

## Testing

**Current:** Minimal. Document what SHOULD be tested:

1. Hook logic (filters, sorting)
2. Component rendering (conditional states)
3. Data transformations (metrics calculation)
4. Error boundaries

**Do NOT test:** Jazz sync behavior.

## Key Patterns

### MaybeLoaded Handling

```typescript
const data = useSomeHook(id);
if (data.$isLoaded === false) {
  switch (data.$jazz.loadingState) {
    case "loading": return <Loading />;
    case "unavailable": return <NotFound />;
    case "unauthorized": return <Unauthorized />;
  }
}
return <Component data={data} />;
```

### Loading States

```typescript
const { events, isLoading } = useWebhookEvents(appId);
if (isLoading === true) return <LoadingSpinner />;
```

### Jazz Provider

```typescript
<JazzReactProvider
  AccountSchema={RegardeAccount}
  sync={{ peer: `wss://cloud.jazz.tools/?key=${apiKey}` }}
>
  <RouterProvider router={router} />
</JazzReactProvider>
```

## Development Guidelines

1. **Boolean Pattern** - Explicit `=== true/false` only
2. **SDK Hooks** - Use `@regarde-dev/core/react` for data
3. **Thin Routes** - Delegate to feature components
4. **Feature-First** - Co-locate related files in `features/`
5. **Path Aliases** - Use `#ui/`, `#/`
6. **Type Safety** - No `any`, explicit returns, T-prefix
7. **UI Consistency** - Use shadcn/ui components
8. **Jazz Sync** - Wait for sync after writes (handled in SDK)

---

**Remember:** Follow strict conventions. When in doubt, check existing patterns.
