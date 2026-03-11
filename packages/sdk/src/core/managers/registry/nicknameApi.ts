import {
  RegisterNicknameParams,
  CheckAvailabilityParams,
  CheckAvailabilityResponse,
  RegisterNicknameResponse,
} from "#managers/registry/types";

/**
 * Registers, updates, or deletes a nickname.
 *
 * Sends nickname to registry with authentication. Use empty nickname
 * with oldNickname to delete existing registration.
 *
 * @param params - Registration parameters
 * @returns Registration result with success status or error
 *
 * @example
 * await registerNickname({
 *   baseUrl: 'https://api.regarde.dev',
 *   nickname: 'john_doe',
 *   jazzAccountID: 'co_myAccountId'
 *   regardeAuth: 'token',
 *   regardeAuthId: 'co_regardeAuthId' // CoMap ID
 * });
 */
export async function registerNickname(
  params: RegisterNicknameParams,
): Promise<RegisterNicknameResponse> {
  try {
    const response = await fetch(`${params.baseUrl}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Regarde-Token": params.regardeAuth,
        "X-Regarde-Token-Id": params.regardeAuthId,
      },
      body: JSON.stringify({
        nickname: params.nickname,
        jazzAccountID: params.jazzAccountID,
        oldNickname: params.oldNickname,
      }),
      signal: params.signal,
    });

    const isResponseOk = response.ok === true;
    if (isResponseOk === false) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        typeof errorData === "object" &&
        errorData !== null &&
        "error" in errorData &&
        typeof errorData.error === "string"
          ? errorData.error
          : `Server returned ${response.status}: ${response.statusText}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Registration failed: Network or parsing error occurred.",
    };
  }
}

/**
 * Checks if a nickname is available for registration.
 *
 * @param params - Availability check parameters
 * @returns Availability status with taken/reserved details
 * @throws {Error} When network request fails or server returns error
 */
export async function checkNicknameAvailability(
  params: CheckAvailabilityParams,
): Promise<CheckAvailabilityResponse> {
  try {
    const response = await fetch(`${params.baseUrl}/checkAvailability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nickname: params.nickname,
      }),
      signal: params.signal,
    });

    const isResponseOk = response.ok === true;
    if (isResponseOk === false) {
      throw new Error(
        `Failed to check availability. Server returned ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to check availability: Network error occurred", {
      cause: error,
    });
  }
}
