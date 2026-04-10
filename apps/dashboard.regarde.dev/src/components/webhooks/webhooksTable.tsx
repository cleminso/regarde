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
  DataTableFooter,
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
      columnHelper.accessor("name", {
        header: "Name",
        meta: {
          className: "w-full min-w-[200px]",
        },
        cell: ({ row }) => {
          const webhook = row.original;
          const endpointUrl = getWebhookUrl(
            webhook.provider,
            appId,
            webhook.$jazz.id
          );

          // Split URL into parts for middle truncation
          // Format: {API_BASE_URL}/v1/webhooks/{provider}/{appId}/{webhookId}
          const urlParts = endpointUrl.split('/');
          const webhookId = urlParts[urlParts.length - 1];
          const appIdPart = urlParts[urlParts.length - 2];
          const providerPart = urlParts[urlParts.length - 3];
          const baseUrl = `${urlParts.slice(0, urlParts.length - 3).join('/')}/`;
          const middlePart = `${providerPart}/${appIdPart}/`;

          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium text-foreground truncate">
                {webhook.name}
              </span>
              <div className="font-mono text-xs text-muted-foreground flex overflow-hidden">
                <span className="shrink-0">{baseUrl}</span>

                <span className="min-w-[2.5ch] truncate">{middlePart}</span>
                <span className="shrink-0">{webhookId}</span>
              </div>
            </div>
          );
        },
      }),

      // Provider column with badge
      columnHelper.accessor("provider", {
        header: "Provider",
        meta: {
          className: "w-[100px]",
        },
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
        meta: {
          className: "w-[120px]",
        },
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
        meta: {
          className: "w-[80px]",
        },
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
        meta: {
          className: "w-[100px]",
        },
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
        meta: {
          className: "w-[60px]",
        },
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
    <DataTable density="compact" className="table-fixed">
      <DataTableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <DataTableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <DataTableHead
                key={header.id}
                className={(header.column.columnDef.meta as { className?: string })?.className}
              >
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
              <DataTableCell
                key={cell.id}
                className={(cell.column.columnDef.meta as { className?: string })?.className}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </DataTableCell>
            ))}
          </DataTableRow>
        ))}
      </DataTableBody>
      <DataTableFooter className="bg-transparent">
        <DataTableRow className="hover:bg-transparent border-0">
          <DataTableCell colSpan={columns.length} className="py-2">
            <div className="flex justify-end">
              <Button variant="default" onClick={onCreate}>
                Add Webhook
              </Button>
            </div>
          </DataTableCell>
        </DataTableRow>
      </DataTableFooter>
    </DataTable>
  );
}

WebhooksTable.displayName = "WebhooksTable";
