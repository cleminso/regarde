export interface VerifyRegistrationKeyParams {
  baseUrl: string;
  jazzAccountId: string;
  registrationKey: string;
  registrationKeyId: string;
  apiKey: string;
  signal?: AbortSignal;
}

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

export async function verifyRegistrationKeyViaServer(
  params: VerifyRegistrationKeyParams,
): Promise<VerificationResult> {
  try {
    const response = await fetch(`${params.baseUrl}/verify`, {
      method: "POST",
      headers: {
        "X-Registration-Key": params.registrationKey,
        "X-Registration-Key-Id": params.registrationKeyId,
        "X-Jazz-Account-Id": params.jazzAccountId,
        "X-API-Key": params.apiKey,
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
