/**
 * Regarde API configuration
 *
 * Environment-specific configuration for API endpoints and URLs.
 * Uses Vite's import.meta.env for environment variable access.
 */

import type { TPaymentProvider } from "@regarde-dev/core";

/**
 * Base URL for the Regarde API
 * Defaults to production API if not specified in environment
 */
export const API_BASE_URL =
  import.meta.env.VITE_REGARDE_API_URL || "https://api.regarde.dev";

/**
 * Generate webhook URL for a specific provider and app
 *
 * @param provider - Payment provider (lemonsqueezy, stripe, polar)
 * @param appId - Jazz CoMap ID for the app
 * @returns Full webhook URL
 */
export const getWebhookUrl = (
  provider: TPaymentProvider,
  appId: string,
): string => `${API_BASE_URL}/v1/webhooks/${provider}/${appId}/${webhookId}`;

/**
 * Generate webhook URL preview (with placeholder) for app creation flow
 *
 * @param provider - Payment provider (stripe, polar)
 * @returns Webhook URL with placeholder for app ID
 */
export const getWebhookUrlPreview = (provider: TPaymentProvider): string =>
  `${API_BASE_URL}/v1/webhooks/${provider}/[app-id]/[webhook-id]`;
