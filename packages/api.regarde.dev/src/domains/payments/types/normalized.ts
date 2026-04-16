import type {
  TLicenseEventType,
  TMode,
  TPaymentEventType,
  TPaymentProvider,
  TSubscriptionEventType,
  TSubscriptionStatus,
} from "@regarde-dev/core";

export type TUnifiedEventType = TPaymentEventType | TSubscriptionEventType | TLicenseEventType;

export type TPaymentStatus = "succeeded" | "failed" | "refunded" | "pending" | "action_required";
export type TLicenseStatus = "active" | "inactive" | "revoked";

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
