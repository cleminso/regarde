"use client";

import { MoreHorizontal, Copy } from "lucide-react";

import type { TWebhook } from "@regarde-dev/core";
import { toggleWebhookStatus } from "@regarde-dev/core";
import { Badge } from "@regarde/ui/components/atoms/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#ui/dropdown-menu";
import { Switch } from "#ui/switch";
import { getWebhookUrl } from "#lib/config/api";

interface WebhookListProps {
  webhooks: TWebhook[];
  appId: string;
  onEdit: (webhook: TWebhook) => void;
  onCreate: () => void;
}

export function WebhookList({
  webhooks,
  appId,
  onEdit,
  onCreate,
}: WebhookListProps): React.ReactElement {
  const handleToggle = async (webhook: TWebhook): Promise<void> => {
    await toggleWebhookStatus(webhook, !webhook.isEnabled);
  };

  const handleCopyEndpoint = async (webhook: TWebhook): Promise<void> => {
    const url = getWebhookUrl(webhook.provider, appId, webhook.$jazz.id);
    await navigator.clipboard.writeText(url);
  };

  const getProviderVariant = (
    provider: string
  ): "stripe" | "polar" | "default" => {
    if (provider === "stripe") return "stripe";
    if (provider === "polar") return "polar";
    return "default";
  };

  const getEnvironmentVariant = (
    environment: string
  ): "production" | "sandbox" | "default" => {
    if (environment === "production") return "production";
    if (environment === "sandbox") return "sandbox";
    return "default";
  };

  return (
    <div className="w-full overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center border-b border-border bg-background px-4 py-2">
        <div className="flex flex-2 items-center min-w-0">
          <span className="text-xs font-mono text-muted-foreground">Name</span>
        </div>
        <div className="flex flex-1 items-center min-w-0">
          <span className="text-xs font-mono text-muted-foreground">
            Description
          </span>
        </div>
        <div className="flex w-20 items-center justify-center shrink-0">
          <span className="text-xs font-mono text-muted-foreground">
            Provider
          </span>
        </div>
        <div className="flex w-24 items-center justify-center shrink-0">
          <span className="text-xs font-mono text-muted-foreground">
            Environment
          </span>
        </div>
        <div className="flex w-16 items-center justify-center shrink-0">
          <span className="text-xs font-mono text-muted-foreground">
            Enabled
          </span>
        </div>
        <div className="flex w-40 items-center min-w-0">
          <span className="text-xs font-mono text-muted-foreground">Secret</span>
        </div>
        <div className="w-10 shrink-0" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {webhooks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm font-mono text-muted-foreground">
              No webhooks configured.
            </span>
          </div>
        ) : (
          webhooks.map((webhook) => {
            const isLoaded = webhook !== null && webhook.$isLoaded === true;
            if (isLoaded === false) return null;

            const endpointUrl = getWebhookUrl(
              webhook.provider,
              appId,
              webhook.$jazz.id
            );

            return (
              <div
                key={webhook.$jazz.id}
                className="flex items-center px-4 py-3 hover:bg-accent/50 transition-colors"
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

                {/* Description */}
                <div className="flex flex-1 items-center min-w-0 pr-4">
                  <span className="text-sm text-foreground truncate">
                    {webhook.description || "-"}
                  </span>
                </div>

                {/* Provider */}
                <div className="flex w-20 items-center justify-center shrink-0">
                  <Badge variant={getProviderVariant(webhook.provider)}>
                    {webhook.provider.charAt(0).toUpperCase() +
                      webhook.provider.slice(1)}
                  </Badge>
                </div>

                {/* Environment */}
                <div className="flex w-24 items-center justify-center shrink-0">
                  <Badge
                    variant={getEnvironmentVariant(webhook.environment)}
                  >
                    {webhook.environment.charAt(0).toUpperCase() +
                      webhook.environment.slice(1)}
                  </Badge>
                </div>

                {/* Enabled Toggle */}
                <div
                  className="flex w-16 items-center justify-center shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(webhook);
                  }}
                >
                  <Switch
                    checked={webhook.isEnabled}
                    onCheckedChange={() => handleToggle(webhook)}
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
                    <DropdownMenuTrigger>
                      <button className="p-1 hover:bg-accent rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(webhook)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCopyEndpoint(webhook)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy endpoint URL
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center border-t border-border px-4 py-3">
        <button
          onClick={onCreate}
          className="text-sm font-mono text-primary hover:text-primary/80 transition-colors"
        >
          + Add Webhook
        </button>
      </div>
    </div>
  );
}
