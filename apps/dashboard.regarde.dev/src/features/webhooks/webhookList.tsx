"use client";

import { useState } from "react";
import { Edit2, MoreHorizontal } from "lucide-react";

import type { TWebhook } from "@regarde-dev/core";
import { toggleWebhookStatus, updateWebhook } from "@regarde-dev/core";
import { Button } from "#ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#ui/dropdown-menu";
import { Input } from "#ui/input";
import { Textarea } from "#ui/textarea";
import { getWebhookUrl } from "#lib/config/api";
import { CreateWebhookDialog } from "./createWebhookDialog";

import type { WebhookFormData } from "./types";

interface WebhookListProps {
  webhooks: TWebhook[];
  appId: string;
}

export function WebhookList({
  webhooks,
  appId,
}: WebhookListProps): React.ReactElement {
  const [editingWebhook, setEditingWebhook] = useState<TWebhook | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<WebhookFormData>>({});

  const handleToggle = async (webhook: TWebhook) => {
    if (webhook.$isLoaded === false) return;
    await toggleWebhookStatus(webhook, !webhook.isEnabled);
  };

  const startEdit = (webhook: TWebhook) => {
    if (webhook.$isLoaded === false) return;
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      description: webhook.description,
      environment: webhook.environment,
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (editingWebhook === null || editingWebhook.$isLoaded === false) return;

    const updates: Parameters<typeof updateWebhook>[1] = {};
    if (formData.name !== undefined && formData.name !== editingWebhook.name) {
      updates.name = formData.name;
    }
    if (
      formData.description !== undefined &&
      formData.description !== editingWebhook.description
    ) {
      updates.description = formData.description;
    }
    if (
      formData.environment !== undefined &&
      formData.environment !== editingWebhook.environment
    ) {
      updates.environment = formData.environment;
    }

    if (Object.keys(updates).length > 0) {
      await updateWebhook(editingWebhook, updates);
    }

    setIsEditOpen(false);
    setEditingWebhook(null);
  };

  if (webhooks.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between bg-sidebar-accent px-2 py-1">
          <div className="flex flex-1 items-center">
            <p className="font-mono text-sm text-muted-foreground">Name</p>
          </div>
          <div className="flex flex-1 items-center">
            <p className="font-mono text-sm text-muted-foreground">
              Description
            </p>
          </div>
          <div className="flex w-25 items-center">
            <p className="font-mono text-sm text-muted-foreground">Provider</p>
          </div>
          <div className="flex w-30 items-center">
            <p className="font-mono text-sm text-muted-foreground">
              Environment
            </p>
          </div>
          <div className="flex w-25 items-center">
            <p className="font-mono text-sm text-muted-foreground">Enabled</p>
          </div>
          <div className="flex w-50 items-center">
            <p className="font-mono text-sm text-muted-foreground">Secret</p>
          </div>
          <div className="size-4 shrink-0" />
        </div>
        <div className="border-t" />
        <div className="flex items-center justify-center border-b py-8">
          <p className="font-mono text-sm text-muted-foreground">
            No webhooks configured.
          </p>
        </div>
        <div className="flex items-center justify-end px-2 pb-1.5 pt-3">
          <button className="font-mono text-sm text-[#7d82e8]">
            + Add Webhook
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-sidebar-accent px-2 py-1">
          <div className="flex flex-1 items-center">
            <p className="font-mono text-sm text-muted-foreground">Name</p>
          </div>
          <div className="flex flex-1 items-center">
            <p className="font-mono text-sm text-muted-foreground">
              Description
            </p>
          </div>
          <div className="flex w-25 items-center">
            <p className="font-mono text-sm text-muted-foreground">Provider</p>
          </div>
          <div className="flex w-30 items-center">
            <p className="font-mono text-sm text-muted-foreground">
              Environment
            </p>
          </div>
          <div className="flex w-25 items-center">
            <p className="font-mono text-sm text-muted-foreground">Enabled</p>
          </div>
          <div className="flex w-50 items-center">
            <p className="font-mono text-sm text-muted-foreground">Secret</p>
          </div>
          <div className="size-4 shrink-0" />
        </div>

        <div className="border-t" />

        {/* Webhook Items */}
        <div className="flex flex-col gap-0.5">
          {webhooks.map((webhook, index) => {
            const isLoaded = webhook !== null && webhook.$isLoaded === true;
            if (!isLoaded) return null;

            const fullUrl = getWebhookUrl(
              webhook.provider,
              appId,
              webhook.$jazz.id,
            );

            return (
              <div key={webhook.$jazz.id}>
                <div className="flex items-center justify-between px-2 py-0.5">
                  {/* Name + URL */}
                  <div className="flex flex-1 flex-row items-center self-stretch">
                    <div className="flex flex-1 flex-col justify-center gap-1 pr-1">
                      <p className="font-mono text-sm text-foreground">
                        {webhook.name}
                      </p>
                      <p className="font-mono text-sm text-foreground">
                        {fullUrl}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-1 flex-row items-center self-stretch">
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="font-mono text-sm text-foreground">
                        {webhook.description || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Provider */}
                  <p className="w-25 font-mono text-sm text-foreground capitalize">
                    {webhook.provider}
                  </p>

                  {/* Environment */}
                  <p className="w-30 font-mono text-sm text-foreground">
                    {webhook.environment}
                  </p>

                  {/* Enabled Toggle */}
                  <div className="flex w-25 flex-col items-start">
                    <button
                      onClick={() => handleToggle(webhook)}
                      className={`flex h-3.5 w-5 items-center rounded px-0.5 ${
                        webhook.isEnabled ? "bg-[#068e22]" : "bg-[#e05352]"
                      } ${webhook.isEnabled ? "justify-start" : "justify-end"}`}
                    >
                      <div className="h-2.5 w-1.5 rounded-sm bg-[#fcfcfc]" />
                    </button>
                  </div>

                  {/* Secret */}
                  <p className="w-50 truncate font-mono text-sm text-foreground">
                    {webhook.secret.slice(0, 16)}...
                  </p>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="shrink-0">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(webhook)}>
                        <Edit2 className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {index < webhooks.length - 1 && <div className="border-t" />}
              </div>
            );
          })}
        </div>

        <div className="border-t" />

        {/* Add Webhook Link */}
        <div className="flex items-center justify-end px-2 pb-1.5 pt-3">
          <CreateWebhookDialog />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>Update webhook configuration.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Environment</label>
              <select
                value={formData.environment ?? "production"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    environment: e.target.value as "sandbox" | "production",
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="production">Production</option>
                <option value="sandbox">Sandbox</option>
              </select>
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
