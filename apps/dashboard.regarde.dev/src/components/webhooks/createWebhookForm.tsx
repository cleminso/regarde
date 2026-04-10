"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { TRegardeApp, TPaymentProvider } from "@regarde-dev/core";
import { createWebhook } from "@regarde-dev/core";
import { Button } from "@regarde/ui/button";
import { Input } from "@regarde/ui/input";
import { Textarea } from "@regarde/ui/textarea";
import { Label } from "@regarde/ui/label";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState<TPaymentProvider>("stripe");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("production");
  const [secret, setSecret] = useState("");

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setErrors({});

    // Submit-only validation
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
      await createWebhook(app, {
        name: name.trim(),
        description: description.trim(),
        provider,
        environment,
        secret: secret.trim(),
      });

      toast.success(`Webhook "${name.trim()}" created`);
      onSuccess();
    } catch (error) {
      console.error("Failed to create webhook:", error);
      setErrors({ submit: "Failed to create webhook. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Production Webhook"
        />
        {errors.name !== undefined && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this webhook..."
          rows={3}
        />
      </div>

      {/* Secret */}
      <div className="space-y-1.5">
        <Label htmlFor="secret">Secret</Label>
        <Input
          id="secret"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="whsec_..."
          className="font-mono text-foreground"
        />
        {errors.secret !== undefined && (
          <p className="text-xs text-destructive">{errors.secret}</p>
        )}
      </div>


      {/* Provider */}
      <div className="space-y-1.5">
        <Label>Provider</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={provider === "stripe" ? "inverse" : "ghost"}
            size="default"
            onClick={() => setProvider("stripe")}
            className="flex-1"
          >
            Stripe
          </Button>
          <Button
            type="button"
            variant={provider === "polar" ? "inverse" : "ghost"}
            size="default"
            onClick={() => setProvider("polar")}
            className="flex-1"
          >
            Polar
          </Button>
        </div>
      </div>

      {/* Environment */}
      <div className="space-y-1.5">
        <Label>Environment</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={environment === "production" ? "inverse" : "ghost"}
            size="default"
            onClick={() => setEnvironment("production")}
            className="flex-1"
          >
            Production
          </Button>
          <Button
            type="button"
            variant={environment === "sandbox" ? "inverse" : "ghost"}
            size="default"
            onClick={() => setEnvironment("sandbox")}
            className="flex-1"
          >
            Sandbox
          </Button>
        </div>
      </div>

      {errors.submit !== undefined && (
        <p className="text-sm text-destructive">{errors.submit}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Creating..." : "Create Webhook"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
