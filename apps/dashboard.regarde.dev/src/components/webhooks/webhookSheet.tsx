"use client";

import { useState } from "react";

import type { TWebhook, TRegardeApp } from "@regarde-dev/core";
import { SidePanel } from "@regarde/ui/sidePanel";

import { WebhookForm } from "./webhookForm";

interface WebhookSheetProps {
  mode: "create" | "edit";
  webhook?: TWebhook;
  appId: string;
  app: TRegardeApp;
  onSuccess?: () => void;
  showCloseButton?: boolean;
}

export function WebhookSheet({
  mode,
  webhook,
  appId,
  app,
  onSuccess: onSuccessProp,
  showCloseButton = true,
}: WebhookSheetProps): React.ReactElement {
  const [key, setKey] = useState(0);

  const handleSuccess = (): void => {
    setKey((prev) => prev + 1);
    onSuccessProp?.();
  };

  const handleClose = (): void => {
    onSuccessProp?.();
  };

  return (
    <>
      <SidePanel.Header>
        {showCloseButton && (
          <SidePanel.CloseButton onClick={handleClose} />
        )}
        <SidePanel.Title>
          {mode === "create" ? "Create Webhook" : `Edit: ${webhook?.name ?? "Webhook"}`}
        </SidePanel.Title>
      </SidePanel.Header>

      <SidePanel.Content>
        <WebhookForm
          key={key}
          mode={mode}
          webhook={webhook}
          appId={appId}
          app={app}
          onSuccess={handleSuccess}
          onCancel={handleClose}
        />
      </SidePanel.Content>
    </>
  );
}
