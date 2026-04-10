import { useNavigate } from "@tanstack/react-router";
import { Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";

import { registerApp, RegisterAppApiError } from "#lib/api/registerApp";
import { useMyRegardeAccount } from "@regarde-dev/core/react";
import { Button } from "@regarde/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@regarde/ui/card";
import { Input } from "@regarde/ui/input";
import { Label } from "@regarde/ui/label";
import { Textarea } from "@regarde/ui/textarea";
import { createApp } from "@regarde-dev/core";

interface FormData {
  name: string;
  description: string;
}

const INITIAL_FORM_DATA: FormData = {
  name: "",
  description: "",
};

const MAX_NAME_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 200;

export function RegisterAppForm(): React.ReactElement {
  const navigate = useNavigate();
  const { account, auth, isAccountReady } = useMyRegardeAccount({
    resolve: { auth: true },
  });

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.slice(0, MAX_NAME_LENGTH);
    setFormData((previous) => ({ ...previous, name: value }));
    if (hasInteracted === false) {
      setHasInteracted(true);
    }
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value.slice(0, MAX_DESCRIPTION_LENGTH);
    setFormData((previous) => ({ ...previous, description: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = formData.name.trim();
    if (trimmedName.length === 0) {
      setError("Enter your app name");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newApp = await createApp(account, {
        name: trimmedName,
        description: formData.description.trim(),
      });

      await newApp.$jazz.waitForSync();

      await registerApp(newApp.$jazz.id, auth, account.$jazz.id);

      await navigate({
        to: "/app/$appId/overview",
        params: { appId: newApp.$jazz.id },
        state: { registered: true, appName: trimmedName },
      });
    } catch (err: unknown) {
      // TODO: rework error properly
      const errorMessage =
        err instanceof RegisterAppApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred";

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    void navigate({ to: "/app/$appId/overview" });
  };

  const remainingNameChars = MAX_NAME_LENGTH - formData.name.length;
  const remainingDescriptionChars = MAX_DESCRIPTION_LENGTH - formData.description.length;
  const isNameValid = formData.name.trim().length > 0;

  if (isAccountReady === false) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Card className="w-full">
          <CardHeader>
            <div className="h-6 w-48 bg-secondary/50 rounded animate-pulse" />
            <div className="h-4 w-64 bg-secondary/50 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-12 bg-secondary/50 rounded animate-pulse" />
              <div className="h-9 w-full bg-secondary/50 rounded animate-pulse" />
              <div className="h-3 w-24 bg-secondary/50 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-secondary/50 rounded animate-pulse" />
              <div className="h-20 w-full bg-secondary/50 rounded animate-pulse" />
              <div className="h-3 w-24 bg-secondary/50 rounded animate-pulse" />
            </div>
            <div className="h-9 w-full bg-secondary/50 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Register new application</CardTitle>
          <CardDescription className="text-base text-secondary-foreground">
            Tell us a bit about your application.
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
              <Label htmlFor="appName" className="text-foreground text-base">Name</Label>
              <Input
                id="appName"
                type="text"
                placeholder="My Awesome App"
                value={formData.name}
                onChange={handleNameChange}
                disabled={isSubmitting}
                aria-invalid={hasInteracted === true && isNameValid === false}
                autoFocus
              />
              <p
                className={`text-xs ${remainingNameChars < 10 ? "text-amber-600" : "text-muted-foreground"}`}
              >
                {remainingNameChars} characters remaining
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground text-base">
                Description <span className="text-sm text-muted-foreground">(Optional)</span>
              </Label>
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
              size="lg"
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

      <Button
        onClick={handleBackToDashboard}
        variant="ghost"
        size="lg"
        type="button"
      >
        Back to dashboard
      </Button>
    </div>
  );
}
