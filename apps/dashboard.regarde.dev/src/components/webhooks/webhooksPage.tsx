"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import type { TWebhook } from "@regarde-dev/core";
import { useRegardeApp } from "@regarde-dev/core";
import { SidePanel } from "@regarde/ui/sidePanel";
import { cn } from "@regarde/ui/lib/utils";

import { WebhookList } from "./webhookList";
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
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("flex h-full", open && "gap-1")}>
      <div className={cn("flex-1 min-w-0 overflow-auto bg-background", open && "rounded-tr-xs")}>
        <WebhookList
          webhooks={webhooks}
          appId={appId}
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
