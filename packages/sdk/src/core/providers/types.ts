import type { TPaymentProvider } from "#schemas/paymentEvent";
import type { TCheckoutMode } from "#schemas/checkoutSession";

/**
 * Regarde metadata embedded in every provider checkout/subscription call.
 * These fields enable webhook routing back to the correct CoMaps.
 */
export interface TRegardeMetadata {
  regarde_app_id: string;
  regarde_user_id: string;
  regarde_sdk_id: string;
  regarde_session_id: string;
}

/**
 * Unified checkout creation parameters.
 * Core fields are provider-agnostic, escape hatches allow provider-specific config.
 */
export interface TCreateCheckoutParams {
  provider: TPaymentProvider;
  amount: number;
  currency: string;
  mode: TCheckoutMode;
  appId: string;
  userAccountId: string;
  regardeSDKId: string;
  checkoutSessionId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  productName?: string;

  /** Stripe-specific options (passed directly to Stripe API) */
  stripe?: Record<string, unknown>;
  /** Polar-specific options (passed directly to Polar API) */
  polar?: Record<string, unknown>;
  /** LemonSqueezy-specific options */
  lemonsqueezy?: Record<string, unknown>;
}

/**
 * Result from a provider checkout creation call.
 */
export interface TCreateCheckoutResult {
  providerSessionId: string;
  paymentUrl: string;
}

/**
 * Unified subscription creation parameters.
 */
export interface TCreateSubscriptionParams {
  provider: TPaymentProvider;
  priceId: string;
  appId: string;
  userAccountId: string;
  regardeSDKId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;

  stripe?: Record<string, unknown>;
  polar?: Record<string, unknown>;
  lemonsqueezy?: Record<string, unknown>;
}

/**
 * Result from a provider subscription creation call.
 */
export interface TCreateSubscriptionResult {
  providerSubscriptionId: string;
  paymentUrl: string;
}

/**
 * Provider-level checkout creation function signature.
 */
export type TProviderCreateCheckout = (
  apiKey: string,
  params: TCreateCheckoutParams,
) => Promise<TCreateCheckoutResult>;

/**
 * Provider-level subscription action function signatures.
 */
export type TProviderPauseSubscription = (
  apiKey: string,
  providerSubscriptionId: string,
) => Promise<void>;

export type TProviderResumeSubscription = (
  apiKey: string,
  providerSubscriptionId: string,
) => Promise<void>;

export type TProviderCancelSubscription = (
  apiKey: string,
  providerSubscriptionId: string,
  cancelAtPeriodEnd?: boolean,
) => Promise<void>;
