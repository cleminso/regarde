import type {
  TPaymentProvider,
  TPaymentEventType,
  TSubscriptionEventType,
  TLicenseEventType,
  TSubscriptionStatus,
  TMode,
} from "@regarde-dev/core";

export type TUnifiedEventType = TPaymentEventType | TSubscriptionEventType | TLicenseEventType;

export type TPaymentStatus = "succeeded" | "failed" | "refunded" | "pending" | "action_required";
export type TLicenseStatus = "active" | "inactive" | "revoked";

// ---------------------------------------------------------------------------
// Normalized Event Data (output of adapter normalization)
// ---------------------------------------------------------------------------

export interface NormalizedPaymentData {
  kind: "payment";
  amount: string;
  currency: string;
  status: TPaymentStatus;
  providerSubscriptionId?: string;
  providerLicenseId?: string;
}

export interface NormalizedSubscriptionData {
  kind: "subscription";
  providerSubscriptionId: string;
  status: TSubscriptionStatus;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  planId?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface NormalizedLicenseData {
  kind: "license";
  licenseKey?: string;
  productId?: string;
  entitlementId?: string;
  benefitId?: string;
  grantId?: string;
  status: TLicenseStatus;
}

export type NormalizedEventData =
  | NormalizedPaymentData
  | NormalizedSubscriptionData
  | NormalizedLicenseData;

export interface NormalizedEvent {
  provider: TPaymentProvider;
  providerEventId: string;
  prefixedProviderEventUUID: string;
  eventType: TUnifiedEventType;

  mode?: TMode;
  timestamp: number;

  providerMetadata: Record<string, string>;

  data: NormalizedEventData;
}

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
