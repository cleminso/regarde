"use client";

import { useState } from "react";
import { Plus, RefreshCw, Check, Copy } from "lucide-react";

import type { TApp, TPaymentProvider } from "@regarde-dev/core";
import {
  createWebhook,
  generateWebhookSecret,
  PAYMENT_PROVIDERS,
} from "@regarde-dev/core";
import { Button } from "#ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#ui/dialog";
import { Input } from "#ui/input";
import { Textarea } from "#ui/textarea";
import { getWebhookUrl } from "#lib/config/api";

import type { WebhookFormData } from "./types";

const PROVIDER_LABELS: Record<TPaymentProvider, string> = {
  lemonsqueezy: "LemonSqueezy",
  stripe: "Stripe",
  polar: "Polar",
};

const PROVIDER_INSTRUCTIONS: Record<TPaymentProvider, string> = {
  lemonsqueezy:
    "We'll generate a webhook secret for you. Copy the URL to your LemonSqueezy dashboard.",
  stripe:
    "Create a webhook endpoint in your Stripe dashboard first, then paste the signing secret here.",
  polar:
    "Create a webhook endpoint in your Polar dashboard first, then paste the signing secret here.",
};

const INITIAL_FORM_DATA: WebhookFormData = {
  name: "",
  description: "",
  provider: "lemonsqueezy",
  environment: "production",
  secret: "",
};

interface CreateWebhookDialogProps {
  app: TApp | null | undefined;
}

export function CreateWebhookDialog({
  app,
}: CreateWebhookDialogProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<WebhookFormData>(INITIAL_FORM_DATA);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAppValid =
    app !== null && app !== undefined && app.$isLoaded === true;

  const handleGenerateSecret = () => {
    const secret = generateWebhookSecret();
    setGeneratedSecret(secret);
  };

  const handleCopySecret = async (secret: string) => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleSubmit = async () => {
    if (isAppValid === false) return;

    setIsSubmitting(true);

    try {
      const isLemonSqueezy = formData.provider === "lemonsqueezy";
      const secret = isLemonSqueezy
        ? (generatedSecret ?? generateWebhookSecret())
        : formData.secret;

      const url = getWebhookUrl(app.$jazz.id);

      await createWebhook(app, {
        name: formData.name,
        description: formData.description,
        provider: formData.provider,
        environment: formData.environment,
        url,
        secret,
      });

      setIsOpen(false);
      setFormData(INITIAL_FORM_DATA);
      setGeneratedSecret(null);
    } catch (error) {
      console.error("Failed to create webhook:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.name.trim().length > 0 &&
    (formData.provider === "lemonsqueezy" || formData.secret.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Configure a new webhook endpoint for receiving payment events.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Provider selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <select
              value={formData.provider}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  provider: e.target.value as TPaymentProvider,
                  secret: "",
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PAYMENT_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {PROVIDER_LABELS[provider]}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {PROVIDER_INSTRUCTIONS[formData.provider]}
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Production Webhook"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this webhook..."
              rows={2}
            />
          </div>

          {/* Environment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Environment</label>
            <select
              value={formData.environment}
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

          {/* Secret handling */}
          {formData.provider === "lemonsqueezy" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook Secret</label>
              {generatedSecret ? (
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={generatedSecret}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopySecret(generatedSecret)}
                  >
                    {copiedSecret ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleGenerateSecret}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Secret
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Copy this secret to your LemonSqueezy dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Webhook Secret <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                value={formData.secret}
                onChange={(e) =>
                  setFormData({ ...formData, secret: e.target.value })
                }
                placeholder={
                  formData.provider === "stripe"
                    ? "whsec_..."
                    : "From Polar dashboard"
                }
              />
              <p className="text-xs text-muted-foreground">
                Paste the signing secret from your{" "}
                {PROVIDER_LABELS[formData.provider]} dashboard.
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className="w-full"
          >
            {isSubmitting ? "Creating..." : "Create Webhook"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
