import type { RegisterAppResponse } from "#/lib/api/registerApp";
import { PaymentProvider } from "./stepConfig";
import { Check, Clipboard, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "#ui/button";
import { Input } from "#ui/input";

interface StepResultProps {
  status: "idle" | "loading" | "success" | "error";
  result?: RegisterAppResponse;
  error?: string | null;
  onRetry: () => void;
  onGoToDashboard: () => void;
  paymentProvider?: PaymentProvider;
  hasWebhookSecret?: boolean;
}

function CopyableField({
  label,
  value,
  isSecret = false,
}: {
  label: string;
  value: string;
  isSecret?: boolean;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail - user can select and copy manually
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <Input
          type={isSecret ? "password" : "text"}
          value={value}
          readOnly
          className="pr-10 font-mono text-sm"
          onFocus={(e) => {
            if (isSecret) {
              e.currentTarget.type = "text";
            }
          }}
          onBlur={(e) => {
            if (isSecret) {
              e.currentTarget.type = "password";
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-7 w-7"
          onClick={handleCopy}
          title={`Copy ${label}`}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function StepResult({
  status,
  result,
  error,
  onRetry,
  onGoToDashboard,
  paymentProvider,
  hasWebhookSecret,
}: StepResultProps): React.ReactElement {
  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparing registration...</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Creating your app and registering with the API...
        </p>
      </div>
    );
  }

  const isLemonSqueezy = paymentProvider === "lemonsqueezy";
  const isStripeOrPolar = paymentProvider === "stripe" || paymentProvider === "polar";

  if (status === "error") {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-destructive/15 p-4">
          <h4 className="mb-2 font-medium text-destructive">Registration Failed</h4>
          <p className="text-sm text-destructive/80">{error ?? "An unexpected error occurred."}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Your app has been created locally but could not be registered with the API. You can retry
          or complete registration later from your app settings.
        </p>
        <Button onClick={onRetry} variant="outline" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const hasResult = result !== undefined;
  if (hasResult === false) {
    return (
      <div className="rounded-md bg-destructive/15 p-4">
        <p className="text-sm text-destructive">Invalid result state</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-green-50 p-4 dark:bg-green-950">
        <h4 className="mb-1 font-medium text-green-800 dark:text-green-200">
          App Registered Successfully
        </h4>
        <p className="text-sm text-green-700 dark:text-green-300">
          {isLemonSqueezy
            ? "Save these credentials securely. You'll need them to configure LemonSqueezy."
            : hasWebhookSecret === true
              ? "Your app is configured and ready to receive webhooks."
              : "Your app is created. Configure the webhook secret to start receiving events."}
        </p>
      </div>

      {isLemonSqueezy && (
        <div className="space-y-3">
          <CopyableField label="App ID" value={result.appId} />
          <CopyableField label="Webhook URL" value={result.webhookUrl} />
          <CopyableField label="Webhook Secret" value={result.webhookSecret} isSecret={true} />
        </div>
      )}

      {isStripeOrPolar && (
        <div className="space-y-3">
          <CopyableField label="App ID" value={result.appId} />
          <CopyableField label="Webhook URL" value={result.webhookUrl} />

          {hasWebhookSecret === true ? (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              <strong>Webhook Secret:</strong> Configured. You can update it in{" "}
              <a
                href={`/app/${result.appId}/settings`}
                className="underline hover:text-green-600"
              >
                Settings
              </a>{" "}
              if needed.
            </div>
          ) : (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <strong>Action Required:</strong> Webhook secret not configured. Add it in{" "}
              <a
                href={`/app/${result.appId}/settings`}
                className="underline hover:text-amber-600"
              >
                Settings
              </a>{" "}
              to receive webhooks.
            </div>
          )}
        </div>
      )}

      {isLemonSqueezy && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <strong>Important:</strong> The webhook secret will not be shown again. Make sure to copy it
          now and paste it into your LemonSqueezy dashboard.
        </div>
      )}

      {isStripeOrPolar && hasWebhookSecret !== true && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <strong>Next Steps:</strong>
          <br />
          1. Go to {paymentProvider === "stripe" ? "Stripe" : "Polar"} Dashboard →{" "}
          {paymentProvider === "stripe"
            ? "Developers → Webhooks"
            : "Settings → Webhooks"}
          <br />
          2. Create endpoint with the URL above
          <br />
          3. Copy the signing secret
          <br />
          4. Paste it in your{" "}
          <a href={`/app/${result.appId}/settings`} className="underline hover:text-blue-600">
            Regarde Settings
          </a>
        </div>
      )}

      <Button onClick={onGoToDashboard} className="w-full">
        Go to Dashboard
      </Button>
    </div>
  );
}
