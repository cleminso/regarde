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
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import type {
  TSubscription,
  TSubscriptionEvent,
  TPaymentProvider,
} from "@regarde-dev/core";
import {
  useSubscriptionEvents,
  useActiveSubscriptions,
} from "@regarde-dev/core/react";
import type { TMode } from "@regarde-dev/core";

const searchSchema = z.object({
  view: z.enum(["active", "events"]).optional(),
  mode: z.enum(["test", "production", "all"]).optional(),
  providerSubscriptionId: z.string().optional(),
});

export const Route = createFileRoute("/app/$appId/subscriptions")({
  component: SubscriptionsPage,
  validateSearch: searchSchema,
});

/**
 * Subscriptions page with active subs and events.
 *
 * @returns The subscriptions page component
 */
function SubscriptionsPage(): React.ReactElement {
  const navigate = Route.useNavigate();
  const { appId } = useParams({ strict: false });
  const search = Route.useSearch();
  const view = search.view ?? "active";
  const mode = search.mode ?? "all";
  const providerSubscriptionId = search.providerSubscriptionId;

  // Guard: appId is required
  if (appId === undefined || appId === "") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No app selected</p>
      </div>
    );
  }

  const { subscriptions, isLoading: isLoadingActive } =
    useActiveSubscriptions(appId);
  const { events, isLoading: isLoadingEvents } = useSubscriptionEvents(appId, {
    mode,
    providerSubscriptionId,
  });

  const isLoading = view === "active" ? isLoadingActive : isLoadingEvents;

  const activeColumns = useMemo<ColumnDef<TSubscription>[]>(
    () => [
      {
        accessorKey: "providerSubscriptionId",
        header: "Subscription ID",
        cell: ({ row }) => (
          <span>{row.original.providerSubscriptionId.substring(0, 16)}...</span>
        ),
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
        accessorKey: "currentPeriod",
        header: "Current Period",
        cell: ({ row }) => {
          const start = new Date(
            row.original.currentPeriodStart,
          ).toLocaleDateString();
          const end = new Date(
            row.original.currentPeriodEnd,
          ).toLocaleDateString();
          return `${start} - ${end}`;
        },
      },
      {
        accessorKey: "planId",
        header: "Plan",
        cell: ({ row }) => <span>{row.original.planId}</span>,
      },
      {
        accessorKey: "provider",
        header: "Provider",
        cell: ({ row }) => (
          <ProviderBadge provider={row.original.provider as TPaymentProvider} />
        ),
      },
    ],
    [],
  );

  const eventsColumns = useMemo<ColumnDef<TSubscriptionEvent>[]>(
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
        accessorKey: "providerSubscriptionId",
        header: "Subscription ID",
        cell: ({ row }) => (
          <span>{row.original.providerSubscriptionId.substring(0, 16)}...</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "currentPeriodStart",
        header: "Period Start",
        cell: ({ row }) =>
          row.original.currentPeriodStart
            ? new Date(row.original.currentPeriodStart).toLocaleDateString()
            : "—",
      },
      {
        accessorKey: "currentPeriodEnd",
        header: "Period End",
        cell: ({ row }) =>
          row.original.currentPeriodEnd
            ? new Date(row.original.currentPeriodEnd).toLocaleDateString()
            : "—",
      },
      {
        accessorKey: "planId",
        header: "Plan",
        cell: ({ row }) => <span>{row.original.planId ?? "—"}</span>,
      },
      {
        accessorKey: "mode",
        header: "Mode",
        cell: ({ row }) => <ModeBadge mode={row.original.mode} />,
      },
    ],
    [],
  );

  const handleViewChange = (newView: "active" | "events"): void => {
    void navigate({ search: (prev) => ({ ...prev, view: newView }) });
  };

  const handleModeChange = (newMode: TMode | "all"): void => {
    void navigate({ search: (prev) => ({ ...prev, mode: newMode }) });
  };

  const clearFilter = (): void => {
    void navigate({ 
      search: (prev) => {
        const { providerSubscriptionId: _, ...rest } = prev;
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

  // Separate table components for each view to avoid type conflicts
  const ActiveSubscriptionsTable = () => (
    <TableProvider
      columns={activeColumns as ColumnDef<TSubscription>[]}
      data={subscriptions}
      className="h-full"
    >
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
  );

  const SubscriptionEventsTable = () => (
    <TableProvider
      columns={eventsColumns as ColumnDef<TSubscriptionEvent>[]}
      data={events}
      className="h-full"
    >
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
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <div className="flex items-center gap-4">
          {view === "events" && (
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
          )}
          <Tabs
            value={view}
            onValueChange={(v) => handleViewChange(v as "active" | "events")}
          >
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {providerSubscriptionId && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtered by Subscription ID: {providerSubscriptionId}</span>
          <Button variant="ghost" size="sm" onClick={clearFilter}>
            Clear Filter
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {view === "active" ? (
          subscriptions.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                No active subscriptions found.
              </p>
            </div>
          ) : (
            <ActiveSubscriptionsTable />
          )
        ) : events.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No subscription events yet. Webhooks will appear here when
              received.
            </p>
          </div>
        ) : (
          <SubscriptionEventsTable />
        )}
      </div>
    </div>
  );
}
