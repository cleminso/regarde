import { useNavigate } from "@tanstack/react-router";
import { Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";
import { registerApp, RegisterAppApiError } from "#/lib/api/registerApp";
import { Button } from "#ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#ui/card";
import { Input } from "#ui/input";
import { Textarea } from "#ui/textarea";
import { createApp } from "@regarde-dev/core";
import { useRegardeTokenAuth } from "@regarde-dev/core/react";

interface FormData {
  name: string;
  description: string;
}

const INITIAL_FORM_DATA: FormData = {
  name: "",
  description: "",
};

const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 200;

export function RegisterAppForm(): React.ReactElement {
  const navigate = useNavigate();
  const { account, auth, isAccountReady } = useMyRegardeAccount();
  const { isExpired, refresh, isLoading: isTokenLoading } = useRegardeTokenAuth(auth);

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.slice(0, MAX_NAME_LENGTH);
    setFormData((previous) => ({ ...previous, name: value }));
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value.slice(0, MAX_DESCRIPTION_LENGTH);
    setFormData((previous) => ({ ...previous, description: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = formData.name.trim();
    if (trimmedName.length === 0) {
      setError("Please enter an app name");
      return;
    }

    if (isAccountReady === false || auth === undefined || account === undefined) {
      setError("Account is not ready. Please wait a moment and try again.");
      return;
    }

    if (account.$isLoaded === false) {
      setError("Account is still loading. Please wait and try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isExpired === true) {
        await refresh();
      }

      const newApp = await createApp(account, {
        name: trimmedName,
        description: formData.description.trim(),
        paymentProvider: "lemonsqueezy",
      });

      await newApp.$jazz.waitForSync();

      await registerApp(newApp.$jazz.id, auth, account.$jazz.id);

      await navigate({
        to: "/app/$appId/overview",
        params: { appId: newApp.$jazz.id },
        state: { registered: true, appName: trimmedName },
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof RegisterAppApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred";

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    void navigate({ to: "/dashboard" });
  };

  const remainingNameChars = MAX_NAME_LENGTH - formData.name.length;
  const remainingDescriptionChars = MAX_DESCRIPTION_LENGTH - formData.description.length;
  const isNameValid = formData.name.trim().length > 0;

  if (isAccountReady === false || isTokenLoading === true) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            {isTokenLoading === true
              ? "Refreshing authentication..."
              : "Initializing your account..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register new application</CardTitle>
          <CardDescription>
            Tell us a bit about the application you want to build.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error !== null && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="appName"
                className="text-sm font-medium leading-none"
              >
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="appName"
                type="text"
                placeholder="My Awesome App"
                value={formData.name}
                onChange={handleNameChange}
                disabled={isSubmitting}
                aria-invalid={isNameValid === false}
              />
              <p
                className={`text-xs ${remainingNameChars < 10 ? "text-amber-600" : "text-muted-foreground"}`}
              >
                {remainingNameChars} characters remaining
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium leading-none"
              >
                Description (Optional)
              </label>
              <Textarea
                id="description"
                placeholder="Brief description of your app..."
                value={formData.description}
                onChange={handleDescriptionChange}
                disabled={isSubmitting}
                rows={3}
              />
              <p
                className={`text-xs ${remainingDescriptionChars < 20 ? "text-amber-600" : "text-muted-foreground"}`}
              >
                {remainingDescriptionChars} characters remaining
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isNameValid === false}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  Register application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <button
        onClick={handleBackToDashboard}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        type="button"
      >
        Back to dashboard
      </button>
    </div>
  );
}
