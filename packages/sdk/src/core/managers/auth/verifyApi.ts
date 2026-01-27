/**
 * Parameters for verification request
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
  /** Server API token for authentication */
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
 * Verifies authentication token against Regarde server.
 *
 * Sends token, CoMap ID, and account ID for server-side validation.
 * Server checks token ownership, validity, and expiration.
 *
 * @param params - Verification parameters
 * @param params.baseUrl - Base URL of the verification API endpoint
 * @param params.jazzAccountId - Jazz account ID (starts with co_)
 * @param params.regardeAuth - Token string from RegardeAuth CoMap
 * @param params.regardeAuthId - CoValue ID of RegardeAuth CoMap (starts with co_)
 * @param params.apiToken - Server API token for authentication
 * @param params.signal - Optional abort signal
 * @returns Verification result with validity status
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
