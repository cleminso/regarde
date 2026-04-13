import { useLogging } from "#core/logger";
import type { TPaymentProvider } from "#schemas/paymentEvent";
import {
  Webhook,
  WEBHOOK_NAME_MAX_LENGTH,
  WEBHOOK_DESCRIPTION_MAX_LENGTH,
  STRIPE_SECRET_PREFIX,
  POLAR_SECRET_PREFIX,
} from "#schemas/regardeUserApp";
import type { TRegardeApp, TWebhook } from "#schemas/regardeUserApp";

const logger = useLogging({
  module: import.meta.filename,
});

/**
 * Validates secret format based on payment provider.
 *
 * @param secret - Secret string to validate
 * @param provider - Payment provider (stripe, polar)
 * @returns Error message if invalid, null if valid
 */
const validateSecretFormat = (
  secret: string,
  provider: TPaymentProvider
): string | null => {
  if (provider === "stripe" && secret.startsWith(STRIPE_SECRET_PREFIX) === false) {
    return `Stripe secrets must start with "${STRIPE_SECRET_PREFIX}"`;
  }
  if (provider === "polar" && secret.startsWith(POLAR_SECRET_PREFIX) === false) {
    return `Polar secrets must start with "${POLAR_SECRET_PREFIX}"`;
  }
  return null;
};

/**
 * Validation result type
 */
export interface ValidationResult {
  success: boolean;
  errors?: Record<string, string>;
}

/**
 * Parameters for creating a new webhook
 */
export interface CreateWebhookParams {
  /** Webhook display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Payment provider (stripe, polar) */
  provider: TPaymentProvider;
  /** Environment (sandbox or production) */
  environment: "sandbox" | "production";
  /** Webhook endpoint URL. If not provided, will be auto-generated using the webhook's CoValue ID */
  url?: string;
  /** Webhook secret (required for Stripe/Polar, auto-generated for LemonSqueezy) */
  secret: string;
}

/**
 * Validates create webhook parameters
 *
 * Validates business logic constraints before schema validation.
 * Schema handles max length, we check for empty values.
 *
 * @param params - Parameters to validate
 * @returns Validation result with errors if invalid
 */
export const validateCreateWebhookParams = (
  params: CreateWebhookParams
): ValidationResult => {
  const errors: Record<string, string> = {};

  if (params.name.trim().length === 0) {
    errors.name = "Name is required";
  } else if (params.name.length > WEBHOOK_NAME_MAX_LENGTH) {
    errors.name = `Name must be ${WEBHOOK_NAME_MAX_LENGTH} characters or less`;
  }

  if (params.secret.trim().length === 0) {
    errors.secret = "Secret is required";
  } else {
    const formatError = validateSecretFormat(params.secret, params.provider);
    if (formatError !== null) {
      errors.secret = formatError;
    }
  }

  if (
    params.description !== undefined &&
    params.description.length > WEBHOOK_DESCRIPTION_MAX_LENGTH
  ) {
    errors.description = `Description must be ${WEBHOOK_DESCRIPTION_MAX_LENGTH} characters or less`;
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true };
};

/**
 * Validates webhook update parameters
 *
 * Validates business logic constraints before schema validation.
 * Schema handles max length, we check for empty values on optional fields.
 * Prefix secret format is validated against the provider.
 *
 * @param updates - Partial updates to validate
 * @param provider - Payment provider for prefix secret format validation
 * @returns Validation result with errors if invalid
 */
export const validateWebhookUpdates = (
  updates: Partial<{
    name: string;
    description: string;
    url: string;
    secret: string;
    environment: "sandbox" | "production";
    isEnabled: boolean;
  }>,
  provider: TPaymentProvider
): ValidationResult => {
  const errors: Record<string, string> = {};

  if (updates.name !== undefined) {
    if (updates.name.trim().length === 0) {
      errors.name = "Name cannot be empty";
    } else if (updates.name.length > WEBHOOK_NAME_MAX_LENGTH) {
      errors.name = `Name must be ${WEBHOOK_NAME_MAX_LENGTH} characters or less`;
    }
  }

  if (
    updates.description !== undefined &&
    updates.description.length > WEBHOOK_DESCRIPTION_MAX_LENGTH
  ) {
    errors.description = `Description must be ${WEBHOOK_DESCRIPTION_MAX_LENGTH} characters or less`;
  }

  if (updates.secret !== undefined) {
    if (updates.secret.trim().length === 0) {
      errors.secret = "Secret cannot be empty";
    } else {
      const formatError = validateSecretFormat(updates.secret, provider);
      if (formatError !== null) {
        errors.secret = formatError;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true };
};

/**
 * Generates a cryptographically secure webhook secret.
 * Creates a 32-character random string using alphanumeric characters.
 *
 * @returns 32-character random secret string
 */
export const generateWebhookSecret = (): string => {
  const ARRAY_LENGTH = 32;
  const randomValues = new Uint8Array(ARRAY_LENGTH);
  crypto.getRandomValues(randomValues);

  const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const result = Array.from(randomValues)
    .map((byte) => CHARSET[byte % CHARSET.length])
    .join("");

  return result;
};

/**
 * Base URL for the Regarde API
 * Used for generating webhook endpoint URLs
 */
const API_BASE_URL = "https://api.regarde.dev";

/**
 * Generate webhook URL for a specific provider and app
 *
 * @param provider - Payment provider (stripe, polar)
 * @param appId - Jazz CoMap ID for the app
 * @param webhookId - Webhook CoValue ID
 * @returns Full webhook URL
 */
const generateWebhookUrl = (
  provider: TPaymentProvider,
  appId: string,
  webhookId: string,
): string => `${API_BASE_URL}/v1/webhooks/${provider}/${appId}/${webhookId}`;

/**
 * Creates a new webhook for an app.
 *
 * Creates Webhook CoMap and pushes it to the app's webhooks list.
 * Generates the correct webhook URL after creation using the CoValue ID.
 * Waits for sync to ensure the webhook is persisted before returning.
 *
 * @param app - Loaded RegardeApp instance
 * @param params - Webhook configuration (name, provider, environment, secret)
 * @returns Promise resolving to newly created Webhook CoMap
 * @throws {Error} When app webhooks list is not loaded or sync fails
 */
export const createWebhook = async (
  app: TRegardeApp,
  params: CreateWebhookParams,
): Promise<TWebhook> => {
  const isAppLoaded = app.$isLoaded === true;
  if (isAppLoaded === false) {
    throw new Error("App must be loaded before creating webhook");
  }

  const isWebhooksLoaded = app.webhooks !== null && app.webhooks.$isLoaded === true;
  if (isWebhooksLoaded === false) {
    throw new Error("App webhooks list is not loaded");
  }

  // Validate parameters before creating
  const validation = validateCreateWebhookParams(params);
  if (validation.success === false) {
    throw new Error(
      `Validation failed: ${Object.entries(validation.errors ?? {})
        .map(([field, error]) => `${field}: ${error}`)
        .join(", ")}`
    );
  }

  const ownerGroup = app.$jazz.owner;
  const appId = app.$jazz.id;

  try {
    // Create webhook with provided URL or empty string (will be generated if not provided)
    const webhook = Webhook.create(
      {
        name: params.name.trim(),
        description: params.description?.trim() ?? "",
        provider: params.provider,
        environment: params.environment,
        createdAt: Date.now(),
        isEnabled: true,
        url: params.url ?? "",
        secret: params.secret,
        customMetadata: {},
      },
      ownerGroup,
    );

    await webhook.$jazz.waitForSync();

    // Generate webhook URL if not provided
    if (params.url === undefined || params.url.length === 0) {
      const webhookUrl = generateWebhookUrl(params.provider, appId, webhook.$jazz.id);
      webhook.$jazz.set("url", webhookUrl);
      await webhook.$jazz.waitForSync();
    }

    app.webhooks.$jazz.push(webhook);
    await app.webhooks.$jazz.waitForSync();

    logger.debug({
      message: "Webhook created successfully",
      data: {
        webhookId: webhook.$jazz.id,
        appId: app.$jazz.id,
        provider: params.provider,
        environment: params.environment,
      },
    });

    return webhook;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      message: "Failed to create webhook",
      data: {
        errorMessage,
        appId: app.$jazz.id,
        provider: params.provider,
      },
    });
    throw new Error(`Failed to create webhook: ${errorMessage}`, {
      cause: error,
    });
  }
};

/**
 * Updates webhook fields.
 *
 * Updates the specified fields on the webhook CoMap.
 * Waits for sync to ensure changes are persisted.
 *
 * @param webhook - Loaded Webhook instance to update
 * @param updates - Partial updates to apply (name, description, url, secret, environment, isEnabled)
 * @returns Promise resolving when update is complete
 * @throws {Error} When webhook is not loaded or sync fails
 */
export const updateWebhook = async (
  webhook: TWebhook,
  updates: Partial<{
    name: string;
    description: string;
    url: string;
    secret: string;
    environment: "sandbox" | "production";
    isEnabled: boolean;
  }>,
): Promise<void> => {
  const isWebhookLoaded = webhook.$isLoaded === true;
  if (isWebhookLoaded === false) {
    throw new Error("Webhook must be loaded before updating");
  }

  // Validate updates before applying
  const validation = validateWebhookUpdates(updates, webhook.provider);
  if (validation.success === false) {
    throw new Error(
      `Validation failed: ${Object.entries(validation.errors ?? {})
        .map(([field, error]) => `${field}: ${error}`)
        .join(", ")}`
    );
  }

  try {
    if (updates.name !== undefined) {
      webhook.$jazz.set("name", updates.name.trim());
    }

    if (updates.description !== undefined) {
      webhook.$jazz.set("description", updates.description.trim());
    }

    if (updates.url !== undefined) {
      webhook.$jazz.set("url", updates.url);
    }

    if (updates.secret !== undefined) {
      webhook.$jazz.set("secret", updates.secret);
    }

    if (updates.environment !== undefined) {
      webhook.$jazz.set("environment", updates.environment);
    }

    if (updates.isEnabled !== undefined) {
      webhook.$jazz.set("isEnabled", updates.isEnabled);
    }

    await webhook.$jazz.waitForSync();

    logger.debug({
      message: "Webhook updated successfully",
      data: {
        webhookId: webhook.$jazz.id,
        updatedFields: Object.keys(updates),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      message: "Failed to update webhook",
      data: {
        errorMessage,
        webhookId: webhook.$jazz.id,
      },
    });
    throw new Error(`Failed to update webhook: ${errorMessage}`, {
      cause: error,
    });
  }
};

/**
 * Regenerates the webhook secret.
 *
 * Generates a new cryptographically secure secret and updates the webhook.
 * Useful for LemonSqueezy webhooks when users want to rotate secrets.
 * Waits for sync to ensure the new secret is persisted.
 *
 * @param webhook - Loaded Webhook instance
 * @returns Promise resolving to the new secret string
 * @throws {Error} When webhook is not loaded or sync fails
 */
export const regenerateSecret = async (webhook: TWebhook): Promise<string> => {
  const isWebhookLoaded = webhook.$isLoaded === true;
  if (isWebhookLoaded === false) {
    throw new Error("Webhook must be loaded before regenerating secret");
  }

  try {
    const newSecret = generateWebhookSecret();
    webhook.$jazz.set("secret", newSecret);
    await webhook.$jazz.waitForSync();

    logger.debug({
      message: "Webhook secret regenerated",
      data: {
        webhookId: webhook.$jazz.id,
      },
    });

    return newSecret;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      message: "Failed to regenerate webhook secret",
      data: {
        errorMessage,
        webhookId: webhook.$jazz.id,
      },
    });
    throw new Error(`Failed to regenerate secret: ${errorMessage}`, {
      cause: error,
    });
  }
};

/**
 * Toggles webhook enabled status.
 *
 * Enables or disables the webhook. Disabled webhooks won't process events.
 * Waits for sync to ensure the status change is persisted.
 *
 * @param webhook - Loaded Webhook instance
 * @param isEnabled - New enabled status
 * @returns Promise resolving when toggle is complete
 * @throws {Error} When webhook is not loaded or sync fails
 */
export const toggleWebhookStatus = async (webhook: TWebhook, isEnabled: boolean): Promise<void> => {
  const isWebhookLoaded = webhook.$isLoaded === true;
  if (isWebhookLoaded === false) {
    throw new Error("Webhook must be loaded before toggling status");
  }

  try {
    webhook.$jazz.set("isEnabled", isEnabled);
    await webhook.$jazz.waitForSync();

    logger.debug({
      message: "Webhook status toggled",
      data: {
        webhookId: webhook.$jazz.id,
        isEnabled,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      message: "Failed to toggle webhook status",
      data: {
        errorMessage,
        webhookId: webhook.$jazz.id,
        isEnabled,
      },
    });
    throw new Error(`Failed to toggle webhook status: ${errorMessage}`, {
      cause: error,
    });
  }
};
