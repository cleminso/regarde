import { PAYMENT_PROVIDERS, type TPaymentProvider } from "@regarde-dev/core";
import { getWebhookUrlPreview } from "#/lib/config/api";
import { Input } from "#ui/input";
import { Textarea } from "#ui/textarea";

const VALID_PROVIDERS: readonly string[] = PAYMENT_PROVIDERS;

export type PaymentProvider = TPaymentProvider;

export interface AppConfigData {
  name: string;
  paymentProvider: PaymentProvider;
  description: string;
  webhookSecret?: string;
}

interface StepConfigProps {
  data: AppConfigData;
  onChange: (data: AppConfigData) => void;
  error?: string | null;
}

const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 200;

const PROVIDER_INSTRUCTIONS: Record<PaymentProvider, string> = {
  lemonsqueezy: "We'll generate a webhook secret for you. You'll copy it to your LemonSqueezy dashboard after registration.",
  stripe: "Create a webhook endpoint in your Stripe dashboard using the URL below. You can add the webhook secret now or later in settings.",
  polar: "Create a webhook endpoint in your Polar dashboard using the URL below. You can add the webhook secret now or later in settings.",
};

const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  lemonsqueezy: "LemonSqueezy",
  stripe: "Stripe",
  polar: "Polar",
};

export function StepConfig({
  data,
  onChange,
  error,
}: StepConfigProps): React.ReactElement {
  /**
   * Handles changes to the app name input field.
   * Enforces maximum name length and updates form data.
   * 
   * @param event - Change event from the name input field
   */
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.slice(0, MAX_NAME_LENGTH);
    onChange({ ...data, name: value });
  };

  /**
   * Handles changes to the payment provider dropdown.
   * Validates the selected provider against the allowed list.
   * Logs error and rejects invalid provider values.
   * 
   * @param event - Change event from the provider select dropdown
   */
  const handleProviderChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;
    const isValidProvider = VALID_PROVIDERS.includes(value);
    
    if (isValidProvider === false) {
      console.error(`Invalid provider selected: ${value}`);
      return;
    }
    
    onChange({
      ...data,
      paymentProvider: value as PaymentProvider,
    });
  };

  /**
   * Handles changes to the description textarea.
   * Enforces maximum description length and updates form data.
   * 
   * @param event - Change event from the description textarea
   */
  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = event.target.value.slice(0, MAX_DESCRIPTION_LENGTH);
    onChange({ ...data, description: value });
  };

  /**
   * Handles changes to the webhook secret input field.
   * Updates form data with the new secret value.
   * Only applicable for Stripe and Polar providers.
   * 
   * @param event - Change event from the webhook secret input
   */
  const handleWebhookSecretChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange({ ...data, webhookSecret: event.target.value });
  };

  const isStripeOrPolar =
    data.paymentProvider === "stripe" || data.paymentProvider === "polar";

  const isNameValid = data.name.trim().length > 0;
  const remainingNameChars = MAX_NAME_LENGTH - data.name.length;
  const remainingDescriptionChars =
    MAX_DESCRIPTION_LENGTH - data.description.length;

  return (
    <div className="space-y-4">
      {error !== undefined && error !== null && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="appName"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          App Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="appName"
          type="text"
          placeholder="My Awesome App"
          value={data.name}
          onChange={handleNameChange}
          aria-invalid={isNameValid === false}
          aria-describedby="appName-hint"
        />
        <p
          id="appName-hint"
          className={`text-xs ${remainingNameChars < 10 ? "text-amber-600" : "text-muted-foreground"}`}
        >
          {remainingNameChars} characters remaining
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="paymentProvider"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Payment Provider <span className="text-destructive">*</span>
        </label>
        <select
          id="paymentProvider"
          value={data.paymentProvider}
          onChange={handleProviderChange}
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        >
          <option value="lemonsqueezy">LemonSqueezy</option>
          <option value="stripe">Stripe</option>
          <option value="polar">Polar</option>
        </select>
      </div>

      {data.paymentProvider && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <strong>{PROVIDER_LABELS[data.paymentProvider]}:</strong>{" "}
          {PROVIDER_INSTRUCTIONS[data.paymentProvider]}
        </div>
      )}

      {isStripeOrPolar && (
        <div className="space-y-2">
          <label htmlFor="webhookUrl" className="text-sm font-medium">
            Webhook URL
          </label>
          <div className="flex gap-2">
            <Input
              id="webhookUrl"
              type="text"
              value={getWebhookUrlPreview(data.paymentProvider)}
              readOnly
              className="bg-muted font-mono text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Copy this URL to your {PROVIDER_LABELS[data.paymentProvider]} dashboard
            when creating the webhook endpoint.
          </p>
        </div>
      )}

      {isStripeOrPolar && (
        <div className="space-y-2">
          <label htmlFor="webhookSecret" className="text-sm font-medium">
            Webhook Secret{" "}
            <span className="text-muted-foreground">(Optional)</span>
          </label>
          <Input
            id="webhookSecret"
            type="password"
            placeholder={
              data.paymentProvider === "stripe"
                ? "whsec_... (from Stripe dashboard)"
                : "From Polar dashboard"
            }
            value={data.webhookSecret ?? ""}
            onChange={handleWebhookSecretChange}
          />
          <p className="text-xs text-muted-foreground">
            Paste the webhook signing secret from your {PROVIDER_LABELS[data.paymentProvider]} dashboard.
            You can also add this later in app settings.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Description (Optional)
        </label>
        <Textarea
          id="description"
          placeholder="Brief description of your app..."
          value={data.description}
          onChange={handleDescriptionChange}
          rows={3}
          aria-describedby="description-hint"
        />
        <p
          id="description-hint"
          className={`text-xs ${remainingDescriptionChars < 20 ? "text-amber-600" : "text-muted-foreground"}`}
        >
          {remainingDescriptionChars} characters remaining
        </p>
      </div>
    </div>
  );
}
