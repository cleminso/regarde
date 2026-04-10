# Data Table Atoms

A collection of atomic components for building data tables with TanStack Table, following the Polar design approach.

## Installation

Dependencies are already included in `@regarde/ui`:

- `@tanstack/react-table`
- `@tanstack/react-virtual`
- `little-timestamp`

## Components

### DataTable

Core table component with compound sub-components for flexible composition.

```tsx
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@regarde/ui/data-table";

<DataTable density="compact" size="sm" isLoading={false}>
  <DataTableHeader>
    <DataTableRow>
      <DataTableHead>Name</DataTableHead>
      <DataTableHead>Status</DataTableHead>
    </DataTableRow>
  </DataTableHeader>
  <DataTableBody>
    <DataTableRow>
      <DataTableCell>Item 1</DataTableCell>
      <DataTableCell>Active</DataTableCell>
    </DataTableRow>
  </DataTableBody>
</DataTable>;
```

**Props:**

- `density`: `"compact" | "default" | "comfortable"`
- `size`: `"sm" | "default" | "lg"`
- `isLoading`: `boolean` - Disables interactions and shows opacity
- `wrapperClassName`: `string` - Container className

### DataTableColumnHeader

Sortable column header for TanStack Table integration.

```tsx
import { DataTableColumnHeader } from "@regarde/ui/data-table";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<TWebhook>();

const columns = [
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    enableSorting: true,
  }),
];
```

### DataTableRowActions

Dropdown menu for row-level actions with async support and per-row customization.

```tsx
import { DataTableRowActions } from "@regarde/ui/data-table"

{
  id: "actions",
  cell: ({ row }) => (
    <DataTableRowActions
      row={row.original}
      actions={[
        {
          id: "view",
          label: "View",
          icon: <Eye className="size-4" />,
          onClick: (webhook) => router.push(`/webhooks/${webhook.$jazz.id}`),
        },
        {
          id: "edit",
          label: "Edit",
          visible: (webhook) => webhook.isEnabled === true,
          onClick: handleEdit,
        },
        { variant: "separator" },
        {
          id: "delete",
          label: "Delete",
          variant: "destructive",
          disabled: (webhook) => webhook.isProtected === true,
          onClick: handleDelete,
        },
      ]}
    />
  ),
}
```

**Action Props:**

- `id`: Unique identifier
- `label`: Display text
- `icon`: Optional icon element
- `variant`: `"default" | "destructive" | "separator"`
- `visible`: Function to conditionally show action
- `disabled`: Function to conditionally disable action
- `onClick`: Handler (can be async)

### DataTableEmptyState

Empty, loading, and error states for tables.

```tsx
import { DataTableEmptyState } from "@regarde/ui/data-table";

// Loading state
{
  isLoading === true && <DataTableEmptyState variant="loading" />;
}

// Empty state
{
  data.length === 0 && (
    <DataTableEmptyState
      variant="empty"
      title="No webhooks"
      description="Get started by creating your first webhook."
      action={<Button>Create Webhook</Button>}
    />
  );
}

// Error state
{
  error !== null && (
    <DataTableEmptyState
      variant="error"
      title="Failed to load"
      description={error.message}
      action={<Button onClick={refetch}>Retry</Button>}
    />
  );
}
```

### DataTableVirtualizer

Virtualization wrapper for large datasets using TanStack Virtual.

```tsx
import { DataTableVirtualizer } from "@regarde/ui/data-table";

<DataTableVirtualizer
  data={rows}
  estimateSize={48}
  containerHeight={600}
  renderRow={(row, index, style) => (
    <DataTableRow key={row.id} style={style}>
      {row.getVisibleCells().map((cell) => (
        <DataTableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </DataTableCell>
      ))}
    </DataTableRow>
  )}
/>;
```

### Formatted Cells

Specialized cells for common data types:

```tsx
import {
  DataTableDateCell,
  DataTableNumberCell,
  DataTableCurrencyCell,
  DataTableBadgeCell,
} from "@regarde/ui/data-table"

// Date cell (handles Jazz Unix timestamps)
{
  accessorKey: "timestamp",
  cell: ({ getValue }) => (
    <DataTableDateCell
      date={getValue() as number}
      format="relative"
      variant="muted"
    />
  ),
}

// Number cell
{
  accessorKey: "count",
  cell: ({ getValue }) => (
    <DataTableNumberCell
      value={getValue() as number}
      suffix=" items"
      align="right"
    />
  ),
}

// Currency cell
{
  accessorKey: "amount",
  cell: ({ row }) => (
    <DataTableCurrencyCell
      amount={row.original.amount}
      currency={row.original.currency}
      align="right"
    />
  ),
}

// Badge/status cell
{
  accessorKey: "status",
  cell: ({ getValue }) => (
    <DataTableBadgeCell
      value={getValue() as string}
      getVariant={(status) =>
        status === "active" ? "success" :
        status === "pending" ? "warning" : "default"
      }
    />
  ),
}
```

### FormattedDate (Standalone)

Date formatter atom for use outside tables.

```tsx
import { FormattedDate } from "@regarde/ui/formattedDate";

<FormattedDate
  date={payment.timestamp} // Jazz Unix ms timestamp
  format="relative" // "2h ago", "Jun 1"
  fallback="Pending"
  variant="muted"
/>;
```

**Formats:**

- `relative`: "Just now", "5s ago", "3m ago", "2h ago", "Jun 1"
- `short`: "06/01/2024"
- `long`: "June 1, 2024 at 2:30 PM"
- `iso`: "2024-06-01T14:30:00.000Z"

## Complete Example

```tsx
import { useCoState } from "jazz-tools/react";
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColumnHeader,
  DataTableRowActions,
  DataTableEmptyState,
} from "@regarde/ui/data-table";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { TWebhook, ListOfWebhooks } from "@regarde-dev/core";

const columnHelper = createColumnHelper<TWebhook>();

const columns = [
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  }),
  columnHelper.accessor("provider", {
    header: "Provider",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row.original}
        actions={[
          {
            id: "edit",
            label: "Edit",
            onClick: () => handleEdit(row.original),
          },
          {
            id: "delete",
            label: "Delete",
            variant: "destructive",
            onClick: () => handleDelete(row.original),
          },
        ]}
      />
    ),
  }),
];

function WebhookTable({ app }: { app: TRegardeApp }) {
  const webhooks = useCoState(ListOfWebhooks, app.webhooks.id);
  const isLoading = webhooks === undefined;

  const data = useMemo(() => {
    if (webhooks === undefined || webhooks === null) return [];
    return webhooks.filter(
      (w): w is TWebhook => w !== null && w.$isLoaded === true,
    );
  }, [webhooks]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading === true) {
    return <DataTableEmptyState variant="loading" />;
  }

  if (data.length === 0) {
    return (
      <DataTableEmptyState
        title="No webhooks"
        description="Create your first webhook to get started."
      />
    );
  }

  return (
    <DataTable density="compact">
      <DataTableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <DataTableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <DataTableHead key={header.id}>
                {header.isPlaceholder === false
                  ? flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )
                  : null}
              </DataTableHead>
            ))}
          </DataTableRow>
        ))}
      </DataTableHeader>
      <DataTableBody>
        {table.getRowModel().rows.map((row) => (
          <DataTableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <DataTableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </DataTableCell>
            ))}
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}
```

## Jazz Integration

The data table components are Jazz-agnostic. Convert CoList to arrays before passing:

```typescript
// Subscribe to Jazz CoValue
const webhooks = useCoState(ListOfWebhooks, app.webhooks.id)

// Convert to plain array (required pattern)
const data = useMemo(() => {
  if (webhooks === undefined || webhooks === null) return []
  return webhooks.filter(
    (w): w is TWebhook => w !== null && w.$isLoaded === true
  )
}, [webhooks])

// Pass to table
<DataTable data={data} columns={columns} />
```

## Architecture

Following the Polar approach:

- **Composition over configuration**: Build tables by composing atoms
- **Jazz-agnostic core**: No Jazz dependencies in table components
- **Type-safe**: Full TypeScript support with TanStack Table generics
- **Client-side sorting**: Optimized for Jazz's local-first data
- **Virtualization ready**: Built-in support for large datasets
