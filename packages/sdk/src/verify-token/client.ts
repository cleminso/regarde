export interface VerifyRegardeAuthParams {
  baseUrl: string;
  jazzAccountId: string;
  regardeAuth: string;
  regardeAuthId: string;
  apiToken: string;
  signal?: AbortSignal;
}

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

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
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
