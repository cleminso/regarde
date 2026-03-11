import { useLogging } from "#core/logger";
import type { TPaymentProvider } from "#schemas/paymentEvent";
import { Webhook, type TWebhook } from "#schemas/regardeUserApp";
import type { TRegardeApp } from "#schemas/regardeUserApp";

const logger = useLogging({
  module: import.meta.filename,
});

/**
 * Parameters for creating a new webhook
 */
export interface CreateWebhookParams {
  /** Webhook display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Payment provider (lemonsqueezy, stripe, polar) */
  provider: TPaymentProvider;
  /** Environment (sandbox or production) */
  environment: "sandbox" | "production";
  /** Webhook endpoint URL */
  url: string;
  /** Webhook secret (required for Stripe/Polar, auto-generated for LemonSqueezy) */
  secret?: string;
}

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
 * Creates a new webhook for an app.
 *
 * Creates Webhook CoMap and pushes it to the app's webhooks list.
 * For LemonSqueezy provider, auto-generates the secret if not provided.
 * Waits for sync to ensure the webhook is persisted before returning.
 *
 * @param app - Loaded RegardeApp instance
 * @param params - Webhook configuration (name, provider, environment, url, secret)
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

  if (params.secret === undefined || params.secret.length === 0) {
    throw new Error("Secret is required for all webhook providers");
  }
  const secret = params.secret;

  const ownerGroup = app.$jazz.owner;

  try {
    const webhook = Webhook.create(
      {
        name: params.name.trim(),
        description: params.description?.trim() ?? "",
        provider: params.provider,
        environment: params.environment,
        createdAt: Date.now(),
        isEnabled: true,
        url: params.url,
        secret,
        customMetadata: {},
      },
      ownerGroup,
    );

    await webhook.$jazz.waitForSync();

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
