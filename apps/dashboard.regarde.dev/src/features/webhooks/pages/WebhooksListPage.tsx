"use client";

import { useState, useMemo } from "react";

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
  const app = useRegardeApp(appId);

  // Check loading states - use type guard pattern for MaybeLoaded
  const isAppLoaded = app !== null && app !== undefined && app.$isLoaded === true;
  
  // Extract webhooks with proper type narrowing
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

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selectedWebhook, setSelectedWebhook] = useState<TWebhook | undefined>(
    undefined
  );

  const handleCreate = (): void => {
    setSheetMode("create");
    setSelectedWebhook(undefined);
    setIsSheetOpen(true);
  };

  const handleEdit = (webhook: TWebhook): void => {
    setSheetMode("edit");
    setSelectedWebhook(webhook);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = (): void => {
    setIsSheetOpen(false);
    setSelectedWebhook(undefined);
  };

  // Handle loading states
  if (isAppLoaded === false) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <WebhookList
          webhooks={webhooks}
          appId={appId}
          onEdit={handleEdit}
          onCreate={handleCreate}
        />
      </div>

      <WebhookSheet
        mode={sheetMode}
        webhook={selectedWebhook}
        appId={appId}
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
      />
    </div>
  );
}
