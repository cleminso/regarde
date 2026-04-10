"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import type { TWebhook } from "@regarde-dev/core";
import { useRegardeApp } from "@regarde-dev/core";
import { SidePanel } from "@regarde/ui/sidePanel";
import { cn } from "@regarde/ui/lib/utils";

import { WebhooksTable } from "./webhooksTable";
import { WebhookSheet } from "./webhookSheet";

interface WebhooksPageProps {
  appId: string;
}

// Inner component that can use the side panel context
function WebhooksPageContent({ appId }: WebhooksPageProps): React.ReactElement {
  const navigate = useNavigate();
  const app = useRegardeApp(appId);
  const { open, onOpenChange } = SidePanel.useSidePanel();
  const [selectedWebhook, setSelectedWebhook] = useState<TWebhook | undefined>(undefined);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [createFormKey, setCreateFormKey] = useState(0);

  const isAppLoaded = app !== null && app !== undefined && app.$isLoaded === true;

  const webhooks = useMemo<TWebhook[]>(() => {
    if (isAppLoaded === false) return [];
    if (app.webhooks === null || app.webhooks === undefined) return [];
    if (app.webhooks.$isLoaded === false) return [];

    return app.webhooks.filter(
      (webhook): webhook is TWebhook =>
        webhook !== null &&
        webhook !== undefined &&
        webhook.$isLoaded === true
    );
  }, [app, isAppLoaded]);

  const handleNavigateToDetail = (webhookId: string): void => {
    navigate({ to: "/app/$appId/webhook/$webhookId", params: { appId, webhookId } });
  };

  const handleCreate = (): void => {
    setMode("create");
    setSelectedWebhook(undefined);
    setCreateFormKey(prev => prev + 1);
    onOpenChange(true);
  };

  const handleEdit = (webhook: TWebhook): void => {
    setMode("edit");
    setSelectedWebhook(webhook);
    onOpenChange(true);
  };

  const handleClose = (): void => {
    onOpenChange(false);
    setSelectedWebhook(undefined);
  };

  if (isAppLoaded === false) {
    return (
      <div className="flex h-full">
        <div className="flex-1 min-w-0 overflow-auto bg-secondary">
          <div className="p-4 space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-secondary/50 rounded animate-pulse" />
              <div className="h-9 w-28 bg-secondary/50 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-secondary/50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full", open && "gap-1")}>
      <div className={cn("flex-1 min-w-0 overflow-auto bg-secondary", open && "rounded-tr-xs")}>
        <WebhooksTable
          webhooks={webhooks}
          appId={appId}
          isLoading={isAppLoaded === false}
          onNavigate={handleNavigateToDetail}
          onCreate={handleCreate}
          onEdit={handleEdit}
        />
      </div>


      <SidePanel>
        <WebhookSheet
          mode={mode}
          webhook={selectedWebhook}
          appId={appId}
          app={app}
          onSuccess={handleClose}
          createFormKey={createFormKey}
        />
      </SidePanel>
    </div>
  );
}

// Outer component that provides the context
export function WebhooksPage({ appId }: WebhooksPageProps): React.ReactElement {
  return (
    <SidePanel.Provider>
      <WebhooksPageContent appId={appId} />
    </SidePanel.Provider>
  );
}
