"use client";

import { useState, useMemo, useRef } from "react";

import type { TWebhook } from "@regarde-dev/core";
import { useRegardeApp } from "@regarde-dev/core";

import { WebhookList } from "../components/WebhookList";
import { WebhookSheet } from "../components/WebhookSheet";

interface WebhooksListPageProps {
  appId: string;
}

export function WebhooksListPage({
  appId,
}: WebhooksListPageProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const app = useRegardeApp(appId);

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

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [selectedWebhook, setSelectedWebhook] = useState<TWebhook | undefined>(undefined);

  const handleCreate = (): void => {
    setPanelMode("create");
    setSelectedWebhook(undefined);
    setIsPanelOpen(true);
  };

  const handleEdit = (webhook: TWebhook): void => {
    setPanelMode("edit");
    setSelectedWebhook(webhook);
    setIsPanelOpen(true);
  };

  const handleClosePanel = (): void => {
    setIsPanelOpen(false);
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
    <div ref={containerRef} className="relative flex h-full gap-1">
      <div className="flex-1 min-w-0 overflow-auto bg-background">
        <WebhookList
          webhooks={webhooks}
          appId={appId}
          onEdit={handleEdit}
          onCreate={handleCreate}
        />
      </div>

      <WebhookSheet
        mode={panelMode}
        webhook={selectedWebhook}
        appId={appId}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        inline
        container={containerRef}
      />
    </div>
  );
}
