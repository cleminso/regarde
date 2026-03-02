import { useState } from "react";

import { Navigate, createFileRoute, useParams } from "@tanstack/react-router";
import { AlertCircle, Check, Copy } from "lucide-react";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";
import { getWebhookUrl } from "#/lib/config/api";
import { Button } from "#ui/button";
import { Input } from "#ui/input";

export const Route = createFileRoute("/app/$appId/settings")({
  component: SettingsPage,
});

function SettingsPage(): React.ReactElement {
  const { selectedApp, isAccountReady, myApps } = useMyRegardeAccount();
  const params = useParams({ strict: false });
  const appId = params?.appId as string | undefined;

  const [isEditingSecret, setIsEditingSecret] = useState(false);
  const [newSecret, setNewSecret] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [copiedUrl, setCopiedUrl] = useState(false);

  const isProviderRequiringSecret =
    selectedApp?.paymentProvider === "stripe" ||
    selectedApp?.paymentProvider === "polar";

  const isWebhookSecretMissing =
    selectedApp?.webhookSecret === null ||
    selectedApp?.webhookSecret === undefined ||
    selectedApp?.webhookSecret === "";

  const shouldShowSecretWarning =
    isProviderRequiringSecret === true && isWebhookSecretMissing === true;

  /**
   * Saves the webhook secret to the app's Jazz CoMap.
   * Only works for apps where the user has admin permissions.
   * Sets saveStatus to indicate progress and completion.
   *
   * @throws Never throws - errors are caught and logged, saveStatus set to "error"
   */
  const handleSaveSecret = async () => {
    const isAppValid =
      selectedApp !== null &&
      selectedApp !== undefined &&
      selectedApp.$isLoaded === true;

    if (isAppValid === false) return;

    setSaveStatus("saving");

    try {
      selectedApp.$jazz.set("webhookSecret", newSecret.trim());
      await selectedApp.$jazz.waitForSync();

      setSaveStatus("saved");
      setIsEditingSecret(false);
      setNewSecret("");

      const STATUS_RESET_DELAY_MS = 2000;
      setTimeout(() => setSaveStatus("idle"), STATUS_RESET_DELAY_MS);
    } catch (error) {
      console.error("Failed to save webhook secret:", error);
      setSaveStatus("error");
    }
  };

  /**
   * Copies the webhook URL to the system clipboard.
   * URL format: https://api.regarde.dev/v1/webhooks/{provider}/{appId}/{webhookId}
   * Shows visual feedback for 2 seconds after copying.
   *
   * @throws Never throws - silently fails if clipboard API unavailable
   */
  const handleCopyUrl = async () => {
    const isAppExists = selectedApp !== undefined && selectedApp !== null;
    if (isAppExists === false) return;

    const url = getWebhookUrl(
      selectedApp.paymentProvider,
      selectedApp.$jazz.id,
    );
    await navigator.clipboard.writeText(url);
    setCopiedUrl(true);

    const COPY_FEEDBACK_DELAY_MS = 2000;
    setTimeout(() => setCopiedUrl(false), COPY_FEEDBACK_DELAY_MS);
  };

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-gray-600">Configure {selectedApp?.name}</p>

      {selectedApp && (
        <div className="mt-6 space-y-6">
          {/* Warning banner for missing stripe/polar secret */}
          {shouldShowSecretWarning === true && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  Webhook Secret Required
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  Your {selectedApp.paymentProvider} webhook secret is not
                  configured. Webhooks will not be processed until you add it
                  below.
                </p>
              </div>
            </div>
          )}

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
              <div>
                <dt className="text-sm text-gray-500">Payment Provider</dt>
                <dd className="text-sm font-medium capitalize">
                  {selectedApp.paymentProvider}
                </dd>
              </div>
            </dl>
          </div>

          {/* Webhook Configuration section */}
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Webhook Configuration</h2>

            <div className="mt-4 space-y-4">
              {/* Webhook URL */}
              <div>
                <label className="text-sm text-gray-500">Webhook URL</label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={getWebhookUrl(
                      selectedApp.paymentProvider,
                      selectedApp.$jazz.id,
                    )}
                    readOnly
                    className="bg-muted font-mono text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                    {copiedUrl ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Copy this URL to your {selectedApp.paymentProvider} dashboard
                </p>
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="text-sm text-gray-500">Webhook Secret</label>

                {isEditingSecret === false ? (
                  (() => {
                    const hasSecret =
                      selectedApp.webhookSecret !== null &&
                      selectedApp.webhookSecret !== undefined &&
                      selectedApp.webhookSecret.length > 0;

                    return (
                      <div className="mt-1 flex gap-2">
                        <Input
                          type={hasSecret === true ? "password" : "text"}
                          value={
                            hasSecret === true
                              ? selectedApp.webhookSecret
                              : "Not configured"
                          }
                          readOnly
                          className={`bg-muted ${hasSecret === false ? "text-gray-400 italic" : ""}`}
                        />
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingSecret(true)}
                        >
                          {hasSecret === true ? "Edit" : "Add"}
                        </Button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="mt-1 space-y-2">
                    <Input
                      type="password"
                      value={newSecret}
                      onChange={(e) => setNewSecret(e.target.value)}
                      placeholder={
                        selectedApp.paymentProvider === "stripe"
                          ? "whsec_... (from Stripe dashboard)"
                          : selectedApp.paymentProvider === "polar"
                            ? "From Polar dashboard"
                            : "New secret"
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveSecret}
                        disabled={
                          newSecret.trim().length === 0 ||
                          saveStatus === "saving"
                        }
                      >
                        {saveStatus === "saving"
                          ? "Saving..."
                          : saveStatus === "saved"
                            ? "Saved!"
                            : saveStatus === "error"
                              ? "Error!"
                              : "Save Secret"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsEditingSecret(false);
                          setNewSecret("");
                          setSaveStatus("idle");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    {saveStatus === "error" && (
                      <p className="text-sm text-red-600">
                        Failed to save. Please try again.
                      </p>
                    )}
                  </div>
                )}

                {/* Provider-specific help text */}
                {selectedApp.paymentProvider === "lemonsqueezy" && (
                  <p className="mt-2 text-sm text-gray-600">
                    This secret was generated by Regarde. If you rotate it here,
                    make sure to update it in your LemonSqueezy dashboard too.
                  </p>
                )}
                {selectedApp.paymentProvider === "stripe" && (
                  <p className="mt-2 text-sm text-gray-600">
                    Find this in your Stripe Dashboard → Developers → Webhooks →
                    [Your Endpoint] → Signing secret. It starts with{" "}
                    <code className="bg-muted rounded px-1">whsec_</code>.
                  </p>
                )}
                {selectedApp.paymentProvider === "polar" && (
                  <p className="mt-2 text-sm text-gray-600">
                    Find this in your Polar Dashboard → Settings → Webhooks →
                    [Your Endpoint].
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
