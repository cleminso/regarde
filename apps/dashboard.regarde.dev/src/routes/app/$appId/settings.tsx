import { useState } from "react";
import { Navigate, createFileRoute, useParams } from "@tanstack/react-router";
import { AlertCircle, Check, Copy, Edit2, RefreshCw, Plus } from "lucide-react";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";
import { getWebhookUrl } from "#/lib/config/api";
import { Button } from "#ui/button";
import { Input } from "#ui/input";
import { Textarea } from "#ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#ui/dialog";
import { Switch } from "#ui/switch";
import {
  createWebhook,
  updateWebhook,
  regenerateSecret,
  toggleWebhookStatus,
  generateWebhookSecret,
  type TPaymentProvider,
  type TWebhook,
  PAYMENT_PROVIDERS,
} from "@regarde-dev/core";

export const Route = createFileRoute("/app/$appId/settings")({
  component: SettingsPage,
});

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

interface WebhookFormData {
  name: string;
  description: string;
  provider: TPaymentProvider;
  environment: "sandbox" | "production";
  secret: string;
}

const INITIAL_FORM_DATA: WebhookFormData = {
  name: "",
  description: "",
  provider: "lemonsqueezy",
  environment: "production",
  secret: "",
};

function SettingsPage(): React.ReactElement {
  const { selectedApp, isAccountReady, myApps } = useMyRegardeAccount();
  const params = useParams({ strict: false });
  const appId = params?.appId as string | undefined;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<TWebhook | null>(null);
  const [formData, setFormData] = useState<WebhookFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Loading state - account not ready yet
  if (isAccountReady === false) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  // Handle missing appId - redirect to first app if available
  if (appId === undefined && myApps && myApps.length > 0) {
    const firstAppId = myApps[0].$jazz.id;
    return (
      <Navigate to="/app/$appId/settings" params={{ appId: firstAppId }} />
    );
  }

  const isAppValid =
    selectedApp !== null &&
    selectedApp !== undefined &&
    selectedApp.$isLoaded === true;
  const webhooks = isAppValid ? selectedApp.webhooks || [] : [];

  // Sort webhooks: enabled first, then by creation date (newest first)
  const sortedWebhooks = [...webhooks].sort((a, b) => {
    const isALoaded = a !== null && a.$isLoaded === true;
    const isBLoaded = b !== null && b.$isLoaded === true;
    if (!isALoaded || !isBLoaded) return 0;
    if (a.isEnabled === b.isEnabled) {
      return b.createdAt - a.createdAt;
    }
    return a.isEnabled === true ? -1 : 1;
  });

  const handleCreateWebhook = async () => {
    if (isAppValid === false) return;

    setIsSubmitting(true);

    try {
      const isLemonSqueezy = formData.provider === "lemonsqueezy";
      const secret = isLemonSqueezy
        ? (generatedSecret ?? generateWebhookSecret())
        : formData.secret;

      const url = getWebhookUrl(
        formData.provider,
        selectedApp.$jazz.id,
        "[webhook-id]", // Will be replaced with actual ID after creation
      );

      await createWebhook(selectedApp, {
        name: formData.name,
        description: formData.description,
        provider: formData.provider,
        environment: formData.environment,
        url,
        secret,
      });

      setIsCreateModalOpen(false);
      setFormData(INITIAL_FORM_DATA);
      setGeneratedSecret(null);
    } catch (error) {
      console.error("Failed to create webhook:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateWebhook = async () => {
    if (editingWebhook === null || editingWebhook.$isLoaded === false) return;

    setIsSubmitting(true);

    try {
      const updates: Partial<{
        name: string;
        description: string;
        environment: "sandbox" | "production";
      }> = {};

      if (formData.name !== editingWebhook.name) {
        updates.name = formData.name;
      }

      if (formData.description !== editingWebhook.description) {
        updates.description = formData.description;
      }

      if (formData.environment !== editingWebhook.environment) {
        updates.environment = formData.environment;
      }

      if (Object.keys(updates).length > 0) {
        await updateWebhook(editingWebhook, updates);
      }

      setIsEditModalOpen(false);
      setEditingWebhook(null);
      setFormData(INITIAL_FORM_DATA);
    } catch (error) {
      console.error("Failed to update webhook:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleWebhook = async (webhook: TWebhook) => {
    if (webhook.$isLoaded === false) return;

    try {
      await toggleWebhookStatus(webhook, !webhook.isEnabled);
    } catch (error) {
      console.error("Failed to toggle webhook:", error);
    }
  };

  const handleRegenerateSecret = async (webhook: TWebhook) => {
    if (webhook.$isLoaded === false) return;

    try {
      const newSecret = await regenerateSecret(webhook);
      setGeneratedSecret(newSecret);
    } catch (error) {
      console.error("Failed to regenerate secret:", error);
    }
  };

  const openEditModal = (webhook: TWebhook) => {
    if (webhook.$isLoaded === false) return;

    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      description: webhook.description,
      provider: webhook.provider,
      environment: webhook.environment,
      secret: webhook.secret,
    });
    setGeneratedSecret(null);
    setIsEditModalOpen(true);
  };

  const handleCopyUrl = async (url: string, webhookId: string) => {
    const fullUrl = url.replace("[webhook-id]", webhookId);
    await navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(webhookId);

    const COPY_FEEDBACK_DELAY_MS = 2000;
    setTimeout(() => setCopiedUrl(null), COPY_FEEDBACK_DELAY_MS);
  };

  const handleCopySecret = async (secret: string) => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);

    const COPY_FEEDBACK_DELAY_MS = 2000;
    setTimeout(() => setCopiedSecret(false), COPY_FEEDBACK_DELAY_MS);
  };

  const handleGenerateSecret = () => {
    const secret = generateWebhookSecret();
    setGeneratedSecret(secret);
  };

  const isCreateFormValid =
    formData.name.trim().length > 0 &&
    (formData.provider === "lemonsqueezy" || formData.secret.length > 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-gray-600">Configure {selectedApp?.name}</p>

      {selectedApp && (
        <div className="mt-6 space-y-6">
          {/* App Details section */}
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">App Details</h2>
            <dl className="mt-2 space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="text-sm font-medium">{selectedApp.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="text-sm font-medium">
                  {selectedApp.isEnabled ? "Enabled" : "Disabled"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Webhooks section */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Webhooks</h2>
              <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Webhook</DialogTitle>
                    <DialogDescription>
                      Configure a new webhook endpoint for receiving payment
                      events.
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
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
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
                            environment: e.target.value as
                              | "sandbox"
                              | "production",
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
                        <label className="text-sm font-medium">
                          Webhook Secret
                        </label>
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
                          Webhook Secret{" "}
                          <span className="text-destructive">*</span>
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
                      onClick={handleCreateWebhook}
                      disabled={isSubmitting || !isCreateFormValid}
                      className="w-full"
                    >
                      {isSubmitting ? "Creating..." : "Create Webhook"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Webhooks table */}
            <div className="mt-4">
              {sortedWebhooks.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No webhooks configured yet.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add a webhook to start receiving payment events.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedWebhooks.map((webhook) => {
                      const isLoaded =
                        webhook !== null && webhook.$isLoaded === true;
                      if (!isLoaded) return null;

                      return (
                        <TableRow
                          key={webhook.$jazz.id}
                          className={!webhook.isEnabled ? "opacity-50" : ""}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{webhook.name}</div>
                              {webhook.description && (
                                <div className="text-xs text-muted-foreground">
                                  {webhook.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                              {PROVIDER_LABELS[webhook.provider]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                webhook.environment === "production"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {webhook.environment === "production"
                                ? "Production"
                                : "Sandbox"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                {webhook.url.length > 40
                                  ? `${webhook.url.slice(0, 40)}...`
                                  : webhook.url}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleCopyUrl(webhook.url, webhook.$jazz.id)
                                }
                              >
                                {copiedUrl === webhook.$jazz.id ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={webhook.isEnabled}
                              onCheckedChange={() =>
                                handleToggleWebhook(webhook)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(webhook)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Webhook Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>Update webhook configuration.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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

            {/* Provider (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Input value={PROVIDER_LABELS[formData.provider]} disabled />
            </div>

            {/* Secret management */}
            {editingWebhook && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook Secret</label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={
                      formData.provider === "lemonsqueezy" && generatedSecret
                        ? generatedSecret
                        : formData.secret
                    }
                    onChange={(e) =>
                      formData.provider !== "lemonsqueezy" &&
                      setFormData({ ...formData, secret: e.target.value })
                    }
                    disabled={
                      formData.provider === "lemonsqueezy" && !generatedSecret
                    }
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleCopySecret(generatedSecret || formData.secret)
                    }
                  >
                    {copiedSecret ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formData.provider === "lemonsqueezy" && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      editingWebhook && handleRegenerateSecret(editingWebhook)
                    }
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Secret
                  </Button>
                )}
              </div>
            )}

            <Button
              onClick={handleUpdateWebhook}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
