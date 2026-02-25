import type { ColumnDef } from "@tanstack/react-table";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";

import { ModeBadge } from "#/components/tables/cells/ModeBadge";
import { ProviderBadge } from "#/components/tables/cells/ProviderBadge";
import { StatusBadge } from "#/components/tables/cells/StatusBadge";
import { TimestampCell } from "#/components/tables/cells/TimestampCell";
import { UserId } from "#/components/tables/cells/UserId";
import { Button } from "#/components/ui/button";
import {
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from "#/components/ui/kibo-ui/table";
import type { TLicenseEvent, TPaymentProvider } from "@regarde-dev/core";
import { useLicenseEvents } from "@regarde-dev/core/react";
import type { TMode } from "@regarde-dev/core";

const searchSchema = z.object({
  mode: z.enum(["test", "production", "all"]).optional(),
  providerLicenseId: z.string().optional(),
});

export const Route = createFileRoute("/app/$appId/licenses")({
  component: LicensesPage,
  validateSearch: searchSchema,
});

/**
 * Licenses page with event history.
 *
 * @returns The licenses page component
 */
function LicensesPage(): React.ReactElement {
  const navigate = Route.useNavigate();
  const { appId } = useParams({ strict: false });
  const search = Route.useSearch();
  const mode = search.mode ?? "all";
  const providerLicenseId = search.providerLicenseId;

  // Guard: appId is required
  if (appId === undefined || appId === "") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No app selected</p>
      </div>
    );
  }

  const { events, isLoading } = useLicenseEvents(appId, {
    mode,
    providerLicenseId,
  });

  const columns = useMemo<ColumnDef<TLicenseEvent>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => <TimestampCell value={row.original.timestamp} />,
      },
      {
        accessorKey: "eventType",
        header: "Event Type",
        cell: ({ row }) => <span>{row.original.eventType}</span>,
      },
      {
        accessorKey: "licenseKey",
        header: "License Key",
        cell: ({ row }) => <span>{row.original.licenseKey ?? "—"}</span>,
      },
      {
        accessorKey: "productId",
        header: "Product",
        cell: ({ row }) => <span>{row.original.productId ?? "—"}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "userAccount",
        header: "User",
        cell: ({ row }) => <UserId userId={row.original.userAccount} />,
      },
      {
        accessorKey: "provider",
        header: "Provider",
        cell: ({ row }) => (
          <ProviderBadge provider={row.original.provider as TPaymentProvider} />
        ),
      },
      {
        accessorKey: "mode",
        header: "Mode",
        cell: ({ row }) => <ModeBadge mode={row.original.mode} />,
      },
    ],
    [],
  );

  const handleModeChange = (newMode: TMode | "all"): void => {
    void navigate({ search: (prev) => ({ ...prev, mode: newMode }) });
  };

  const clearFilter = (): void => {
    void navigate({ 
      search: (prev) => {
        const { providerLicenseId: _, ...rest } = prev;
        return rest;
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Licenses</h1>
        <div className="flex gap-2">
          <Button
            variant={mode === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("all")}
          >
            All
          </Button>
          <Button
            variant={mode === "test" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("test")}
          >
            Test
          </Button>
          <Button
            variant={mode === "production" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("production")}
          >
            Production
          </Button>
        </div>
      </div>

      {providerLicenseId && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtered by License ID: {providerLicenseId}</span>
          <Button variant="ghost" size="sm" onClick={clearFilter}>
            Clear Filter
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {events.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No license events yet. Webhooks will appear here when received.
            </p>
          </div>
        ) : (
          <TableProvider columns={columns} data={events} className="h-full">
            <TableHeader>
              {({ headerGroup }) => (
                <TableHeaderGroup headerGroup={headerGroup}>
                  {({ header }) => <TableHead header={header} />}
                </TableHeaderGroup>
              )}
            </TableHeader>
            <TableBody className="overflow-y-auto">
              {({ row }) => (
                <TableRow row={row}>
                  {({ cell }) => <TableCell cell={cell} />}
                </TableRow>
              )}
            </TableBody>
          </TableProvider>
        )}
      </div>
    </div>
  );
}
