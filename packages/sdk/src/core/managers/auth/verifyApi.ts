/**
 * # Token Verification - Server-Side Authentication
 *
 * ## Purpose
 * - Validates tokens against Jazz network data
 * - Provides secure token validation for API requests
 * - Returns structured verification results
 *
 * ## Verification Flow
 * 1. Client sends verification request with token headers
 * 2. Server loads RegardeAuth using provided token ID
 * 3. Server validates token matches the stored value
 * 4. Server checks token has not expired
 */

/**
 * Parameters sent to verification server
 */
export interface VerifyRegardeAuthParams {
  /** Base URL of the verification API endpoint */
  baseUrl: string;
  /** Jazz Account ID claiming ownership of the token */
  jazzAccountId: string;
  /** Token string from user's RegardeAuth schema */
  regardeAuth: string;
  /** ID of the RegardeAuth CoMap containing the token */
  regardeAuthId: string;
  /** Server API token for authentication (internal use) */
  apiToken: string;
  /** Optional signal to abort the request */
  signal?: AbortSignal;
}

/**
 * Verification result from server
 */
export interface VerificationResult {
  /** True if token matches and hasn't expired */
  isValid: boolean;
  /** Error details when verification fails */
  error?: string;
}

/**
 * Sends verification request to server with token details
 *
 * @param params - Verification parameters with token and identification
 * @returns Promise resolving to verification status
 */
export async function verifyRegardeAuthViaServer(
  params: VerifyRegardeAuthParams,
): Promise<VerificationResult> {
  try {
    const response = await fetch(`${params.baseUrl}/verify`, {
      method: "POST",
      headers: {
        "X-Regarde-Token": params.regardeAuth,
        "X-Regarde-Token-Id": params.regardeAuthId,
        "X-Regarde-Account-Id": params.jazzAccountId,
        "X-API-Token": params.apiToken,
      },
      signal: params.signal,
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `Server returned ${response.status}: ${response.statusText}`,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error
          ? error.message
          : "Verification failed: Network or parsing error. Check connection and retry.",
    };
  }
}
