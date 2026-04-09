"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableRowActions,
  DataTableEmptyState,
  DataTableBadgeCell,
  DataTableDateCell,
} from "@regarde/ui/data-table";
import { Button } from "@regarde/ui/button";
import { Switch } from "@regarde/ui/switch";
import type { TWebhook } from "@regarde-dev/core";
import { toggleWebhookStatus } from "@regarde-dev/core";
import { getWebhookUrl } from "#lib/config/api";

interface TWebhooksTableProps {
  webhooks: TWebhook[];
  appId: string;
  isLoading?: boolean;
  onEdit: (webhook: TWebhook) => void;
  onCreate: () => void;
  onNavigate: (webhookId: string) => void;
}

const columnHelper = createColumnHelper<TWebhook>();

export function WebhooksTable({
  webhooks,
  appId,
  isLoading = false,
  onEdit,
  onCreate,
  onNavigate,
}: TWebhooksTableProps): React.ReactElement {
  // Filter loaded webhooks with type predicate
  const data = useMemo((): TWebhook[] => {
    return webhooks.filter(
      (w): w is TWebhook => w !== null && w.$isLoaded === true
    );
  }, [webhooks]);

  // Column definitions
  const columns = useMemo(
    () => [
      // Name column with URL below (like the screenshot)
      columnHelper.accessor("name", {
        header: "Name",
        cell: ({ row }) => {
          const webhook = row.original;
          const endpointUrl = getWebhookUrl(
            webhook.provider,
            appId,
            webhook.$jazz.id
          );
          // Truncate URL to fit (similar to screenshot)
          const truncatedUrl =
            endpointUrl.length > 50
              ? `${endpointUrl.slice(0, 50)}...`
              : endpointUrl;

          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium text-foreground truncate">
                {webhook.name}
              </span>
              <span className="font-mono text-xs text-muted-foreground truncate">
                {truncatedUrl}
              </span>
            </div>
          );
        },
      }),

      // Provider column with badge
      columnHelper.accessor("provider", {
        header: "Provider",
        cell: ({ getValue }) => {
          const provider = getValue();
          return (
            <DataTableBadgeCell
              value={provider}
              getVariant={(p) => (p === "stripe" ? "info" : "default")}
            />
          );
        },
      }),

      // Environment column with badge
      columnHelper.accessor("environment", {
        header: "Environment",
        cell: ({ getValue }) => {
          const environment = getValue();
          return (
            <DataTableBadgeCell
              value={environment}
              getVariant={(e) => (e === "production" ? "success" : "warning")}
            />
          );
        },
      }),

      // Enabled column with switch
      columnHelper.accessor("isEnabled", {
        header: "Enabled",
        cell: ({ getValue, row }) => {
          const isEnabled = getValue();
          const webhook = row.original;

          const handleToggle = async (checked: boolean): Promise<void> => {
            try {
              await toggleWebhookStatus(webhook, checked);
              toast.success(
                `Webhook "${webhook.name}" ${checked ? "enabled" : "disabled"}`
              );
            } catch (error) {
              toast.error(
                `Failed to ${checked ? "enable" : "disable"} webhook "${webhook.name}"`
              );
            }
          };

          return (
            <div
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggle}
                variant={isEnabled ? "success" : "destructive"}
                size="default"
              />
            </div>
          );
        },
      }),

      // Created column with relative date
      // TODO: when hovered, shows the iso date w/ a tooltip. Should it be clickable? copy icon à la zed?s
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: ({ getValue }) => {
          const timestamp = getValue();
          return (
            <DataTableDateCell
              date={timestamp}
              format="relative"
              variant="muted"
            />
          );
        },
      }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const webhook = row.original;
          const endpointUrl = getWebhookUrl(
            webhook.provider,
            appId,
            webhook.$jazz.id
          );

          return (
            <DataTableRowActions
              row={webhook}
              actions={[
                {
                  id: "edit",
                  label: "Edit",
                  onClick: onEdit,
                },
                {
                  id: "copy",
                  label: "Copy endpoint URL",
                  onClick: async () => {
                    await navigator.clipboard.writeText(endpointUrl);
                  },
                },
              ]}
            />
          );
        },
      }),
    ],
    [appId, onEdit]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Loading state
  if (isLoading === true) {
    return <DataTableEmptyState variant="loading" />;
  }

  // Empty state
  if (data.length === 0) {
    return (
      <DataTableEmptyState
        variant="empty"
        title="No webhooks configured"
        description="Create your first webhook to start receiving payment events."
        action={<Button onClick={onCreate}>Create Webhook</Button>}
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
                      header.getContext()
                    )
                  : null}
              </DataTableHead>
            ))}
          </DataTableRow>
        ))}
      </DataTableHeader>
      <DataTableBody>
        {table.getRowModel().rows.map((row) => (
          <DataTableRow
            key={row.id}
            className="cursor-pointer"
            onClick={() => onNavigate(row.original.$jazz.id)}
          >
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

WebhooksTable.displayName = "WebhooksTable";
