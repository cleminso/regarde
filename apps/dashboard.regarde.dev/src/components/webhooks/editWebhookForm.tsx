"use client";

import { Button } from "@regarde/ui/button";
import { Input } from "@regarde/ui/input";
import { SensitiveInput } from "@regarde/ui/input-sensitive";
import { Label } from "@regarde/ui/label";
import { Switch } from "@regarde/ui/switch";
import { Textarea } from "@regarde/ui/textarea";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getWebhookUrl } from "#lib/config/api";
import type { TWebhook } from "@regarde-dev/core";
import { toggleWebhookStatus, updateWebhook } from "@regarde-dev/core";

interface EditWebhookFormProps {
  webhook: TWebhook;
  appId: string;
}

export function EditWebhookForm({ webhook, appId }: EditWebhookFormProps): React.ReactElement {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const isLoaded = webhook !== null && webhook.$isLoaded === true;
  const webhookId = webhook.$jazz.id;
  const endpointUrl = isLoaded ? getWebhookUrl(webhook.provider, appId, webhookId) : "";

  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (isLoaded === false) return;
    await updateWebhook(webhook, { name: e.target.value });
  };

  const handleDescriptionChange = async (e: React.ChangeEvent<HTMLTextAreaElement>): Promise<void> => {
    if (isLoaded === false) return;
    await updateWebhook(webhook, { description: e.target.value });
  };

  const handleEnvironmentChange = async (value: "sandbox" | "production"): Promise<void> => {
    if (isLoaded === false) return;
    await updateWebhook(webhook, { environment: value });
  };

  const handleSecretChange = async (value: string): Promise<void> => {
    if (isLoaded === false) return;
    await updateWebhook(webhook, { secret: value });
  };

  const handleCopySecret = (): void => {
    toast.success("Secret copied to clipboard");
  };

  const handleCopyUrl = async (): Promise<void> => {
    await navigator.clipboard.writeText(endpointUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleToggleEnabled = async (checked: boolean): Promise<void> => {
    if (isLoaded === false) return;
    try {
      await toggleWebhookStatus(webhook, checked);
      toast.success(`Webhook "${webhook.name}" ${checked ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error(`Failed to ${checked ? "enable" : "disable"} webhook "${webhook.name}"`);
    }
  };

  if (isLoaded === false) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enabled */}
      <div className="flex items-center justify-between">
        <Label htmlFor="enabled" className="text-sm">
          Enabled
        </Label>
        <Switch
          id="enabled"
          checked={webhook.isEnabled}
          onCheckedChange={handleToggleEnabled}
          variant={webhook.isEnabled ? "success" : "destructive"}
        />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={webhook.name}
          onChange={handleNameChange}
          placeholder="Production Webhook"
        />
      </div>

      {/* Secret */}
      <div className="space-y-1.5">
        <Label htmlFor="secret">Secret</Label>
        <SensitiveInput
          id="secret"
          value={webhook.secret}
          onValueChange={handleSecretChange}
          onCopy={handleCopySecret}
          placeholder="whsec_..."
          className="font-mono"
          autoComplete="off"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={webhook.description}
          onChange={handleDescriptionChange}
          placeholder="Brief description of this webhook..."
          rows={3}
        />
      </div>

      {/* Environment */}
      <div className="space-y-1.5">
        <Label>Environment</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={webhook.environment === "production" ? "inverse" : "ghost"}
            size="default"
            onClick={() => handleEnvironmentChange("production")}
            className="flex-1"
          >
            Production
          </Button>
          <Button
            type="button"
            variant={webhook.environment === "sandbox" ? "inverse" : "ghost"}
            size="default"
            onClick={() => handleEnvironmentChange("sandbox")}
            className="flex-1"
          >
            Sandbox
          </Button>
        </div>
      </div>

      {/* Endpoint URL */}
      <div className="space-y-1.5">
        <Label>Endpoint URL</Label>
        <div className="flex gap-2">
          <Input value={endpointUrl} readOnly className="font-mono text-xs flex-1" />
          <Button type="button" variant="outline" size="icon-lg" onClick={handleCopyUrl}>
            {copiedUrl ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Use this URL in your {webhook.provider} dashboard.
        </p>
      </div>
    </div>
  );
}
