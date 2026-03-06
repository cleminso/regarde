/**
 * # React Module - React Integration for Regarde SDK
 *
 * ## Purpose
 * - Provides React hooks for integrating Regarde authentication and payments
 * - Simplifies token management, passphrase authentication, and payment link generation in React applications
 *
 * ## Flow
 * 1. Import useRegardeAuth for passphrase-based account authentication
 * 2. Import useRegardeTokenAuth hook for token management (API)
 * 3. Import useRegardeLemonSqueezyCheckoutLink for Lemon Squeezy payment checkout links
 * 4. Use hooks with RegardeTokenAuth CoMap instance and appId
 * 5. Access token state and generate checkout URLs
 *
 * ## Migration
 * - Added React wrapper for token management
 * - Added React wrapper for passphrase authentication with BIP39 wordlist
 * - Simplified authentication and payment integration for React apps
 */
export { useRegardeTokenAuth } from "./useRegardeTokenAuth";
export type { UseRegardeTokenAuthResult } from "./useRegardeTokenAuth";

export { useRegardeLemonSqueezyCheckoutLink } from "./useRegardeLemonSqueezyCheckoutLink";
export type {
  UseRegardeLemonSqueezyCheckoutLinkResult,
  RegardeLemonSqueezyCheckoutLinkOptions,
} from "./useRegardeLemonSqueezyCheckoutLink";

export { useRegardeAuth } from "./useRegardeAuth";
export type {
  SignUpResult,
  UseRegardeAuthResult,
  UseRegardeAuthState,
} from "./useRegardeAuth";

export { useMyRegardeAccount } from "./useMyRegardeAccount";
export type {
  UseMyRegardeAccountResolve,
  UseMyRegardeAccountResult,
  AppField,
  PaymentField,
  SubscriptionField,
  LicenseField,
} from "./useMyRegardeAccount";

export { useRegardeApp } from "./useRegardeApp";
export type { TRegardeApp } from "#core/schemas/regardeUserApp";

export { usePaymentEvents } from "./usePaymentEvents";
export type {
  UsePaymentEventsOptions,
  UsePaymentEventsResult,
} from "./usePaymentEvents";

export { useSubscriptionEvents } from "./useSubscriptionEvents";
export type {
  UseSubscriptionEventsOptions,
  UseSubscriptionEventsResult,
} from "./useSubscriptionEvents";

export { useLicenseEvents } from "./useLicenseEvents";
export type {
  UseLicenseEventsOptions,
  UseLicenseEventsResult,
} from "./useLicenseEvents";

export { useActiveSubscriptions } from "./useActiveSubscriptions";
export type { UseActiveSubscriptionsResult } from "./useActiveSubscriptions";

export { useWebhookEvents } from "./useWebhookEvents";
export type { UseWebhookEventsResult } from "./useWebhookEvents";
