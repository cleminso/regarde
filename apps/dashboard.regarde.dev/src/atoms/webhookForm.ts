import { atom } from "jotai";
import type { TPaymentProvider } from "@regarde-dev/core";
import {
  STRIPE_SECRET_PREFIX,
  POLAR_SECRET_PREFIX,
  WEBHOOK_NAME_MAX_LENGTH,
  WEBHOOK_DESCRIPTION_MAX_LENGTH,
} from "@regarde-dev/core";

export interface WebhookFormData {
  name: string;
  description: string;
  provider: TPaymentProvider;
  environment: "sandbox" | "production";
  secret: string;
}

const initialFormData: WebhookFormData = {
  name: "",
  description: "",
  provider: "stripe",
  environment: "production",
  secret: "",
};

export const webhookFormAtom = atom<WebhookFormData>(initialFormData);

export const formErrorsAtom = atom((get) => {
  const form = get(webhookFormAtom);
  const errors: Record<string, string> = {};

  if (form.name.trim().length === 0) {
    errors.name = "Name is required";
  } else if (form.name.length > WEBHOOK_NAME_MAX_LENGTH) {
    errors.name = `Name must be ${WEBHOOK_NAME_MAX_LENGTH} characters or less`;
  }

  if (form.secret.trim().length === 0) {
    errors.secret = "Secret is required";
  } else {
    if (form.provider === "stripe" && form.secret.startsWith(STRIPE_SECRET_PREFIX) === false) {
      errors.secret = "Secret must start with 'whsec_' for Stripe";
    } else if (form.provider === "polar" && form.secret.startsWith(POLAR_SECRET_PREFIX) === false) {
      errors.secret = "Secret must start with 'polar_whs_' for Polar";
    }
  }

  if (form.description.length > WEBHOOK_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${WEBHOOK_DESCRIPTION_MAX_LENGTH} characters or less`;
  }

  return errors;
});

export const isFormValidAtom = atom((get) => {
  const errors = get(formErrorsAtom);
  return Object.keys(errors).length === 0;
});

/**
 * Derived atom: Can submit form?
 */
export const canSubmitAtom = atom((get) => {
  const isValid = get(isFormValidAtom);
  return isValid;
});

/**
 * Action atom: Reset form to initial state
 * Use this when opening the form to ensure clean state
 */
export const resetWebhookFormAtom = atom(null, (_get, set) => {
  set(webhookFormAtom, initialFormData);
});
