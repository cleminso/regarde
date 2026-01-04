/**
 * # React Module - React Integration for Regarde SDK
 *
 * ## Purpose
 * - Provides React hooks for integrating Regarde authentication
 * - Simplifies token management in React applications
 *
 * ## Flow
 * 1. Import useRegardeAuth hook for token management
 * 2. Use hook with RegardeAuth CoMap instance
 * 3. Access token state and refresh functionality
 *
 * ## Migration
 * - Added React wrapper for token management
 * - Simplified authentication integration for React apps
 */
export { useRegardeAuth } from "./useRegardeAuth";
export type { UseRegardeAuthResult } from "./useRegardeAuth";
