"use client";

import { useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { toast } from "sonner";

import type { TRegardeApp } from "@regarde-dev/core";
import { createWebhook, STRIPE_SECRET_PREFIX, POLAR_SECRET_PREFIX } from "@regarde-dev/core";
import { Button } from "@regarde/ui/button";
import { Input } from "@regarde/ui/input";
import { Textarea } from "@regarde/ui/textarea";
import { Label } from "@regarde/ui/label";
import { RequiredInput } from "@regarde/ui/required-input";

import {
  webhookFormAtom,
  canSubmitAtom,
  resetWebhookFormAtom,
} from "#atoms/webhookForm";
import { WEBHOOK_NAME_MAX_LENGTH, WEBHOOK_DESCRIPTION_MAX_LENGTH } from "@regarde-dev/core";
import { API_BASE_URL } from "#lib/config/api";

interface CreateWebhookFormProps {
  app: TRegardeApp;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateWebhookForm({
  app,
  onSuccess,
  onCancel,
}: CreateWebhookFormProps): React.ReactElement {
  const [form, setForm] = useAtom(webhookFormAtom);
  const canSubmit = useAtomValue(canSubmitAtom);
  const resetForm = useSetAtom(resetWebhookFormAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const secretValidationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const secretPrefix =
    form.provider === "stripe" ? STRIPE_SECRET_PREFIX : POLAR_SECRET_PREFIX;
  const providerLabel = form.provider === "stripe" ? "Stripe" : "Polar";
  const isSecretEmpty = form.secret.trim().length === 0;
  const isSecretInvalid = isSecretEmpty === false && form.secret.startsWith(secretPrefix) === false;

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setSubmitError(null);

    if (canSubmit === false) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createWebhook(app, {
        name: form.name.trim(),
        description: form.description.trim(),
        provider: form.provider,
        environment: form.environment,
        secret: form.secret.trim(),
        apiBaseUrl: API_BASE_URL,
      });

      toast.success(`Webhook "${form.name.trim()}" created`);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Failed to create webhook:", error);
      setSubmitError("Failed to create webhook. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSecretChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, secret: value }));

    if (secretValidationTimeoutRef.current) {
      clearTimeout(secretValidationTimeoutRef.current);
    }

    if (value.length === 0) {
      return;
    }

    secretValidationTimeoutRef.current = setTimeout(() => {
      if (value.startsWith(secretPrefix) === false) {
        toast.error(
          `Secret must start with '${secretPrefix}' for ${providerLabel} webhooks`
        );
      }
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <RequiredInput
        label="Name"
        isRequired={true}
        isValid={form.name.trim().length > 0}
        htmlFor="name"
      >
        <Input
          id="name"
          value={form.name}
          onChange={updateField("name")}
          placeholder="Production Webhook"
          maxLength={WEBHOOK_NAME_MAX_LENGTH}
        />
      </RequiredInput>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={updateField("description")}
          placeholder="Brief description of this webhook..."
          rows={3}
          maxLength={WEBHOOK_DESCRIPTION_MAX_LENGTH}
        />
      </div>

      {/* Secret */}
      <RequiredInput
        label="Secret"
        isRequired={true}
        isValid={isSecretEmpty === false && isSecretInvalid === false}
        isInvalid={isSecretInvalid}
        htmlFor="secret"
      >
        <Input
          id="secret"
          type="password"
          value={form.secret}
          onChange={handleSecretChange}
          placeholder="whsec_..."
          className="font-mono text-foreground"
        />
      </RequiredInput>

      {/* Provider */}
      <div className="space-y-1.5">
        <Label>Provider</Label>
        <div className="flex gap-1">
          {(["stripe", "polar"] as const).map((p) => (
            <Button
              key={p}
              type="button"
              variant={form.provider === p ? "inverse" : "ghost"}
              size="default"
              onClick={() => setForm((prev) => ({ ...prev, provider: p }))}
              className="flex-1 capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Environment */}
      <div className="space-y-1.5">
        <Label>Environment</Label>
        <div className="flex gap-1">
          {(["production", "sandbox"] as const).map((env) => (
            <Button
              key={env}
              type="button"
              variant={form.environment === env ? "inverse" : "ghost"}
              size="default"
              onClick={() => setForm((prev) => ({ ...prev, environment: env }))}
              className="flex-1 capitalize"
            >
              {env}
            </Button>
          ))}
        </div>
      </div>

      {submitError !== null && (
        <p className="text-sm text-destructive">{submitError}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={canSubmit === false || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Creating..." : "Create Webhook"}
        </Button>
      </div>
    </form>
  );
}

/*
 * SCENARIOS COVERED
 *
 * Validation:
 * - Name: required, max 30 chars (WEBHOOK_NAME_MAX_LENGTH)
 * - Secret: required, must start with provider prefix (whsec_/polar_whs_)
 * - Description: optional, max 120 chars
 *
 * State Management:
 * - Form state via jotai atoms (webhookFormAtom, canSubmitAtom)
 * - Form resets after successful creation
 *
 * Key Behaviors:
 * - Secret validation debounced (500ms) to avoid toast spam
 * - All inputs trimmed before submission
 * - Submit button disabled until all validations pass
 * - Success toast → form reset → callback
 */
