import { Input } from "#ui/input";
import { Textarea } from "#ui/textarea";

export type PaymentProvider = "lemonsqueezy" | "stripe";

export interface AppConfigData {
  name: string;
  paymentProvider: PaymentProvider;
  description: string;
}

interface StepConfigProps {
  data: AppConfigData;
  onChange: (data: AppConfigData) => void;
  error?: string | null;
}

const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 200;

export function StepConfig({ data, onChange, error }: StepConfigProps): React.ReactElement {
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.slice(0, MAX_NAME_LENGTH);
    onChange({ ...data, name: value });
  };

  const handleProviderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...data,
      paymentProvider: event.target.value as PaymentProvider,
    });
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value.slice(0, MAX_DESCRIPTION_LENGTH);
    onChange({ ...data, description: value });
  };

  const isNameValid = data.name.trim().length > 0;
  const remainingNameChars = MAX_NAME_LENGTH - data.name.length;
  const remainingDescriptionChars = MAX_DESCRIPTION_LENGTH - data.description.length;

  return (
    <div className="space-y-4">
      {error !== undefined && error !== null && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
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
        </select>
      </div>

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
