/**
 * # Token Verification Module - Server Authentication
 *
 * ## Purpose
 * - Provides verification services for Regarde authentication tokens
 * - Handles token validation against the regarde server
 *
 * ## Flow
 * 1. Client requests token verification with verifyRegardeAuthViaServer
 * 2. Server validates token ownership and expiry
 * 3. Verification result returned to client
 *
 * ## Migration
 * - Standardized token verification with clean error handling
 * - Added support for abortable requests via AbortSignal
 */
export {
  verifyRegardeAuthViaServer,
  type VerifyRegardeAuthParams,
  type VerificationResult,
} from "./verifyApi";
