/**
 * # Preact Module - Preact Integration for Regarde SDK
 *
 * ## Purpose
 * - Provides Preact hooks for integrating Regarde authentication
 * - Simplifies token management in Preact applications
 *
 * ## Flow
 * 1. Import useRegardeTokenAuth hook for token management
 * 2. Use hook with RegardeTokenAuth CoMap instance
 * 3. Access token state and refresh functionality
 *
 * ## Migration
 * - Added Preact wrapper for token management
 * - Simplified authentication integration for Preact apps
 */
export { useRegardeTokenAuth } from "./useRegardeTokenAuth";
export type { UseRegardeTokenAuthResult } from "./useRegardeTokenAuth";
