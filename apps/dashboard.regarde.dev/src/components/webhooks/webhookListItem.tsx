"use client";

import { MoreHorizontal, Copy } from "lucide-react";

import { getWebhookUrl } from "#lib/config/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@regarde/ui/dropdownMenu";
import { Switch } from "@regarde/ui/switch";
import type { TWebhook } from "@regarde-dev/core";
import { toggleWebhookStatus } from "@regarde-dev/core";

interface WebhookListItemProps {
  webhook: TWebhook;
  appId: string;
  onEdit: (webhook: TWebhook) => void;
  onNavigate: (webhookId: string) => void;
}

export function WebhookListItem({
  webhook,
  appId,
  onEdit,
  onNavigate,
}: WebhookListItemProps): React.ReactElement | null {
  const isLoaded = webhook !== null && webhook.$isLoaded === true;
  if (isLoaded === false) return null;

  const endpointUrl = getWebhookUrl(webhook.provider, appId, webhook.$jazz.id);

  const handleToggle = async (): Promise<void> => {
    await toggleWebhookStatus(webhook, !webhook.isEnabled);
  };

  const handleCopyEndpoint = async (): Promise<void> => {
    await navigator.clipboard.writeText(endpointUrl);
  };

  return (
    <div
      className="flex items-center px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => onNavigate(webhook.$jazz.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onNavigate(webhook.$jazz.id);
        }
      }}
    >
      {/* Name + URL */}
      <div className="flex flex-2 flex-col gap-0.5 min-w-0 pr-4">
        <span className="text-sm font-medium text-foreground truncate">
          {webhook.name}
        </span>
        <span className="text-xs font-mono text-muted-foreground truncate">
          {endpointUrl}
        </span>
      </div>

      {/* Provider */}
      <div className="flex w-20 items-center justify-center shrink-0">
        <span className="text-sm text-foreground capitalize">
          {webhook.provider}
        </span>
      </div>

      {/* Environment */}
      <div className="flex w-24 items-center justify-center shrink-0">
        <span className="text-sm text-foreground capitalize">
          {webhook.environment}
        </span>
      </div>

      {/* Enabled Toggle */}
      <div className="flex w-16 items-center justify-center shrink-0">
        <Switch
          checked={webhook.isEnabled}
          onCheckedChange={handleToggle}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Secret */}
      <div className="flex w-40 items-center min-w-0 pr-4">
        <span className="text-xs font-mono text-foreground truncate">
          {webhook.secret.slice(0, 16)}...
        </span>
      </div>

      {/* Actions */}
      <div className="flex w-10 items-center justify-end shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 hover:bg-accent rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(webhook);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyEndpoint}>
              <Copy className="mr-2 h-4 w-4" />
              Copy endpoint URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
