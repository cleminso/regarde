"use client";

import { useState } from "react";
import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { Copy, Check, RefreshCw } from "lucide-react";

import type { TWebhook, TPaymentProvider } from "@regarde-dev/core";
import {
  updateWebhook,
  generateWebhookSecret,
} from "@regarde-dev/core";
import { Button } from "#ui/button";
import { Input } from "@regarde/ui/components/atoms/Input";
import { Textarea } from "#ui/textarea";
import { getWebhookUrl } from "#lib/config/api";

const PROVIDER_OPTIONS: { value: TPaymentProvider; label: string }[] = [
  { value: "stripe", label: "Stripe" },
  { value: "polar", label: "Polar" },
];

const ENVIRONMENT_OPTIONS: { value: "sandbox" | "production"; label: string }[] =
  [
    { value: "production", label: "Production" },
    { value: "sandbox", label: "Sandbox" },
  ];

interface WebhookFormProps {
  mode: "create" | "edit";
  webhook?: TWebhook;
  appId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WebhookForm({
  mode,
  webhook,
  appId,
  onSuccess,
  onCancel,
}: WebhookFormProps): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = mode === "edit";
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

  const handleGenerateSecret = (): void => {
    const secret = generateWebhookSecret();
    setGeneratedSecret(secret);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const environment = formData.get("environment") as "sandbox" | "production";
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
        if (description !== webhook.description)
          updates.description = description;
        if (environment !== webhook.environment) updates.environment = environment;
        if (secret !== webhook.secret) updates.secret = secret;

        if (Object.keys(updates).length > 0) {
          await updateWebhook(webhook, updates);
        }
      } else {
        // Create new webhook - requires app context
        // This needs to be called from the parent with the app instance
        console.error("Create mode requires app instance - use WebhookSheet");
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
    <Form
      className="space-y-4"
      errors={errors}
      onSubmit={handleSubmit}
    >
      {/* Provider */}
      <Field.Root name="provider" className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Field.Label className="text-sm font-medium">
            Provider <span className="text-destructive">*</span>
          </Field.Label>
        </div>
        <select
          name="provider"
          defaultValue={isEdit ? webhook?.provider : "stripe"}
          disabled={isEdit}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {PROVIDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Field.Error className="text-xs text-destructive" />
      </Field.Root>

      {/* Name */}
      <Field.Root name="name" className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Field.Label className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </Field.Label>
        </div>
        <Input
          name="name"
          defaultValue={isEdit ? webhook?.name : ""}
          placeholder="Production Webhook"
        />
        <Field.Error className="text-xs text-destructive" />
      </Field.Root>

      {/* Description */}
      <Field.Root name="description" className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Field.Label className="text-sm font-medium">Description</Field.Label>
        </div>
        <Textarea
          name="description"
          defaultValue={isEdit ? webhook?.description : ""}
          placeholder="Brief description of this webhook..."
          rows={2}
        />
        <Field.Error className="text-xs text-destructive" />
      </Field.Root>

      {/* Environment */}
      <Field.Root name="environment" className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Field.Label className="text-sm font-medium">
            Environment <span className="text-destructive">*</span>
          </Field.Label>
        </div>
        <select
          name="environment"
          defaultValue={isEdit ? webhook?.environment : "production"}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {ENVIRONMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Field.Error className="text-xs text-destructive" />
      </Field.Root>

      {/* Secret */}
      <Field.Root name="secret" className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Field.Label className="text-sm font-medium">
            Secret <span className="text-destructive">*</span>
          </Field.Label>
        </div>
        <div className="flex gap-2">
          <Input
            name="secret"
            type="password"
            defaultValue={
              isEdit
                ? webhook?.secret
                : generatedSecret ?? ""
            }
            placeholder="whsec_..."
            className="font-mono"
          />
          {isEdit && webhook !== undefined && webhook.secret !== undefined && (
            <Button
              type="button"
              variant="outline"
              size="icon"
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
        {!isEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateSecret}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Secret
          </Button>
        )}
        <Field.Error className="text-xs text-destructive" />
      </Field.Root>

      {/* Endpoint URL (show in edit mode) */}
      {isEdit && endpointUrl !== undefined && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Endpoint URL</label>
          <div className="flex gap-2">
            <Input
              value={endpointUrl}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleCopySecret(endpointUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use this URL in your {webhook?.provider} dashboard.
          </p>
        </div>
      )}

      {/* Submit Error */}
      {errors.submit !== undefined && (
        <p className="text-sm text-destructive">{errors.submit}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting
            ? "Saving..."
            : isEdit
            ? "Save Changes"
            : "Create Webhook"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}
