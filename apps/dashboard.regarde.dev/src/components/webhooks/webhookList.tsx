"use client";

import type { TWebhook } from "@regarde-dev/core";

import { WebhookListItem } from "./webhookListItem";

interface WebhookListProps {
  webhooks: TWebhook[];
  appId: string;
  onEdit: (webhook: TWebhook) => void;
  onCreate: () => void;
  onNavigate: (webhookId: string) => void;
}

export function WebhookList({
  webhooks,
  appId,
  onEdit,
  onCreate,
  onNavigate,
}: WebhookListProps): React.ReactElement {
  return (
    <div className="w-full h-full overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center border-b border-border bg-background px-4 py-2">
        <div className="flex flex-2 items-center min-w-0">
          <span className="text-xs font-mono text-muted-foreground">Name</span>
        </div>
        <div className="flex w-20 items-center justify-center shrink-0">
          <span className="text-xs font-mono text-muted-foreground">Provider</span>
        </div>
        <div className="flex w-24 items-center justify-center shrink-0">
          <span className="text-xs font-mono text-muted-foreground">Environment</span>
        </div>
        <div className="flex w-16 items-center justify-center shrink-0">
          <span className="text-xs font-mono text-muted-foreground">Enabled</span>
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
          webhooks.map((webhook) => (
            <WebhookListItem
              key={webhook.$jazz.id}
              webhook={webhook}
              appId={appId}
              onEdit={onEdit}
              onNavigate={onNavigate}
            />
          ))
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
