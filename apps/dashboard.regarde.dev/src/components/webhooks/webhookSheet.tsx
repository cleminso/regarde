"use client";

import type { TWebhook, TRegardeApp } from "@regarde-dev/core";
import { SidePanel } from "@regarde/ui/sidePanel";

import { CreateWebhookForm } from "./createWebhookForm";
import { EditWebhookForm } from "./editWebhookForm";

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
  onSuccess,
  showCloseButton = true,
}: WebhookSheetProps): React.ReactElement {
  const isEdit = mode === "edit";
  const title = isEdit ? `Edit ${webhook?.name ?? "Webhook"}` : "Create Webhook";

  const handleCancel = (): void => {
    onSuccess?.();
  };

  return (
    <>
      <SidePanel.Header>
        {showCloseButton && (
          <SidePanel.CloseButton onClick={handleCancel} />
        )}
        <SidePanel.Title>{title}</SidePanel.Title>
      </SidePanel.Header>

      <SidePanel.Content>
        {isEdit && webhook !== undefined ? (
          <EditWebhookForm webhook={webhook} appId={appId} />
        ) : (
          <CreateWebhookForm
            app={app}
            appId={appId}
            onSuccess={() => onSuccess?.()}
            onCancel={handleCancel}
          />
        )}
      </SidePanel.Content>
    </>
  );
}
