"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import type { TWebhook, TPaymentProvider, TRegardeApp } from "@regarde-dev/core";
import {
  createWebhook,
  updateWebhook,
} from "@regarde-dev/core";
import { Button } from "@regarde/ui/button";
import { Input } from "@regarde/ui/input";
import { Textarea } from "@regarde/ui/textarea";
import { Label } from "@regarde/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@regarde/ui/select";
import { getWebhookUrl } from "#lib/config/api";

const PROVIDER_OPTIONS: { value: TPaymentProvider; label: string }[] = [
  { value: "stripe", label: "Stripe" },
  { value: "polar", label: "Polar" },
];

const ENVIRONMENT_OPTIONS: { value: "sandbox" | "production"; label: string }[] = [
  { value: "production", label: "Production" },
  { value: "sandbox", label: "Sandbox" },
];

interface WebhookFormProps {
  mode: "create" | "edit";
  webhook?: TWebhook;
  appId: string;
  app: TRegardeApp;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WebhookForm({
  mode,
  webhook,
  appId,
  app,
  onSuccess,
  onCancel,
}: WebhookFormProps): React.ReactElement {
  const isEdit = mode === "edit";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form field states
  const [provider, setProvider] = useState<TPaymentProvider>(
    isEdit && webhook !== undefined ? webhook.provider : "stripe"
  );
  const [environment, setEnvironment] = useState<"sandbox" | "production">(
    isEdit && webhook !== undefined ? webhook.environment : "production"
  );
  const webhookId = webhook?.$jazz?.id;
  const endpointUrl =
    isEdit && webhook !== undefined && webhookId !== undefined
      ? getWebhookUrl(webhook.provider, appId, webhookId)
      : undefined;

  const handleCopySecret = async (secret: string): Promise<void> => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const secret = formData.get("secret") as string;

    // Validation
    const newErrors: Record<string, string> = {};
    if (name.trim().length === 0) {
      newErrors.name = "Name is required";
    }
    if (secret.trim().length === 0) {
      newErrors.secret = "Secret is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && webhook !== undefined && webhook.$isLoaded === true) {
        // Update existing webhook
        const updates: {
          name?: string;
          description?: string;
          environment?: "sandbox" | "production";
          secret?: string;
        } = {};
        if (name !== webhook.name) updates.name = name;
        if (description !== webhook.description) updates.description = description;
        if (environment !== webhook.environment) updates.environment = environment;
        if (secret !== webhook.secret) updates.secret = secret;

        if (Object.keys(updates).length > 0) {
          await updateWebhook(webhook, updates);
        }
      } else {
        // Create new webhook
        await createWebhook(app, {
          name: name.trim(),
          description: description.trim(),
          provider,
          environment,
          url: getWebhookUrl(provider, appId, crypto.randomUUID()),
          secret,
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save webhook:", error);
      setErrors({
        submit: "Failed to save webhook. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={isEdit ? webhook?.name : ""}
          placeholder="Production Webhook"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Provider */}
      <div className="space-y-1.5">
        <Label>
          Provider
        </Label>
        <Select
          value={provider}
          onValueChange={(value) => setProvider(value as TPaymentProvider)}
          disabled={isEdit}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.provider && (
          <p className="text-xs text-destructive">{errors.provider}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={isEdit ? webhook?.description : ""}
          placeholder="Brief description of this webhook..."
          rows={3}
        />
      </div>

      {/* Environment */}
      <div className="space-y-1.5">
        <Label>
          Environment
        </Label>
        <Select
          value={environment}
          onValueChange={(value) => setEnvironment(value as "sandbox" | "production")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select environment" />
          </SelectTrigger>
          <SelectContent>
            {ENVIRONMENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Secret */}
      <div className="space-y-1.5">
        <Label htmlFor="secret">
          Secret
        </Label>
        <div className="flex gap-2">
          <Input
            id="secret"
            name="secret"
            type="password"
            defaultValue={isEdit ? webhook?.secret : ""}
            placeholder="whsec_..."
            className="font-mono flex-1"
          />
          {isEdit && webhook !== undefined && (
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={() => handleCopySecret(webhook.secret)}
            >
              {copiedSecret ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        {errors.secret && (
          <p className="text-xs text-destructive">{errors.secret}</p>
        )}
      </div>

      {/* Endpoint URL (show in edit mode) */}
      {isEdit && endpointUrl !== undefined && (
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
              onClick={() => handleCopySecret(endpointUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Submit Error */}
      {errors.submit !== undefined && (
        <p className="text-sm text-destructive">{errors.submit}</p>
      )}

      {/* Actions */}
      <div className="flex w-auto gap-2">
        <Button type="submit" size="icon-lg" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Webhook"}
        </Button>
        <Button type="button" variant="outline" size="icon-lg" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
