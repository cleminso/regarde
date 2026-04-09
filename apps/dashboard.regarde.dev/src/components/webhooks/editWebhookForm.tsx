"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import type { TWebhook } from "@regarde-dev/core";
import { Button } from "@regarde/ui/button";
import { Input } from "@regarde/ui/input";
import { Textarea } from "@regarde/ui/textarea";
import { Label } from "@regarde/ui/label";
import { getWebhookUrl } from "#lib/config/api";

interface EditWebhookFormProps {
  webhook: TWebhook;
  appId: string;
}

export function EditWebhookForm({
  webhook,
  appId,
}: EditWebhookFormProps): React.ReactElement {
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const isLoaded = webhook !== null && webhook.$isLoaded === true;
  const webhookId = webhook.$jazz.id;
  const endpointUrl = isLoaded ? getWebhookUrl(webhook.provider, appId, webhookId) : "";

  // Direct mutation handlers via Jazz
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (isLoaded === false) return;
    webhook.$jazz.set("name", e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    if (isLoaded === false) return;
    webhook.$jazz.set("description", e.target.value);
  };

  const handleEnvironmentChange = (value: "sandbox" | "production"): void => {
    if (isLoaded === false) return;
    webhook.$jazz.set("environment", value);
  };

  const handleSecretChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (isLoaded === false) return;
    webhook.$jazz.set("secret", e.target.value);
  };

  const handleCopySecret = async (): Promise<void> => {
    if (isLoaded === false) return;
    await navigator.clipboard.writeText(webhook.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyUrl = async (): Promise<void> => {
    await navigator.clipboard.writeText(endpointUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
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
        <div className="flex gap-2">
          <Input
            id="secret"
            type="password"
            value={webhook.secret}
            onChange={handleSecretChange}
            placeholder="whsec_..."
            className="font-mono flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={handleCopySecret}
          >
            {copiedSecret ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
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
          <Input
            value={endpointUrl}
            readOnly
            className="font-mono text-xs flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={handleCopyUrl}
          >
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
