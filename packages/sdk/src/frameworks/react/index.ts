/**
 * # React Module - React Integration for Regarde SDK
 *
 * ## Purpose
 * - Provides React hooks for integrating Regarde authentication and payments
 * - Simplifies token management, passphrase authentication, and payment link generation in React applications
 *
 * ## Flow
 * 1. Import useRegardeAuth for passphrase-based account authentication (CLI)
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
  UseRegardeAuthResult,
  UseRegardeAuthState,
} from "./useRegardeAuth";
