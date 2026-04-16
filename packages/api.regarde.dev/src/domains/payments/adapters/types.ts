import type {
  TPaymentProvider,
} from "@regarde-dev/core";

import type { NormalizedEvent } from "#payments/types/normalized";

// ---------------------------------------------------------------------------
// Webhook Context (extracted from HTTP request before normalization)
// ---------------------------------------------------------------------------

export interface WebhookContext {
  appId: string;
  jazzAccountId: string;
  regardeSDKId: string;
}

// ---------------------------------------------------------------------------
// Query Parameter Context (fallback for testing without metadata)
// ---------------------------------------------------------------------------

export interface WebhookQueryContext {
  pathAppId?: string;
  regarde_user_id?: string;
  regarde_sdk_id?: string;
}

// ---------------------------------------------------------------------------
// Provider Adapter Interface
// ---------------------------------------------------------------------------

export interface PaymentProviderAdapter {
  readonly provider: TPaymentProvider;
  readonly signatureHeader: string;
  readonly timestampHeader?: string;
  readonly idHeader?: string;

  validateSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp?: string,
    id?: string,
  ): boolean;

  extractContext(payload: unknown, queryContext?: WebhookQueryContext): WebhookContext;

  normalizeEvent(payload: unknown): NormalizedEvent;
}

// ---------------------------------------------------------------------------
// Provider Prefix Map
// ---------------------------------------------------------------------------

export const PROVIDER_PREFIXES: Record<TPaymentProvider, string> = {
  stripe: "ST",
  polar: "PO",
};

export const prefixProviderEventId = (
  provider: TPaymentProvider,
  providerEventId: string,
): string => {
  return `${PROVIDER_PREFIXES[provider]}_${providerEventId}`;
};
