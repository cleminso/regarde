"use client";

import { useState } from "react";

import type { TWebhook } from "@regarde-dev/core";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "#ui/sheet";

import { WebhookForm } from "./WebhookForm";

interface WebhookSheetProps {
  mode: "create" | "edit";
  webhook?: TWebhook;
  appId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WebhookSheet({
  mode,
  webhook,
  appId,
  isOpen,
  onClose,
}: WebhookSheetProps): React.ReactElement {
  const [key, setKey] = useState(0);

  const handleSuccess = (): void => {
    // Reset form key to clear state
    setKey((prev) => prev + 1);
    onClose();
  };

  const handleCancel = (): void => {
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Create Webhook" : "Edit Webhook"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Configure a new webhook endpoint for receiving payment events."
              : "Update webhook configuration."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <WebhookForm
            key={key}
            mode={mode}
            webhook={webhook}
            appId={appId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
