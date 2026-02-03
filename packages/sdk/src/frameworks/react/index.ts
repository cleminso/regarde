/**
 * # React Module - React Integration for Regarde SDK
 *
 * ## Purpose
 * - Provides React hooks for integrating Regarde authentication and payments
 * - Simplifies token management and payment link generation in React applications
 *
 * ## Flow
 * 1. Import useRegardeTokenAuth hook for token management
 * 2. Import useRegardeLemonSqueezyCheckoutLink for Lemon Squeezy payment checkout links
 * 3. Use hooks with RegardeTokenAuth CoMap instance and appId
 * 4. Access token state and generate checkout URLs
 *
 * ## Migration
 * - Added React wrapper for token management
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
