import {
  RegisterNicknameParams,
  CheckAvailabilityParams,
  CheckAvailabilityResponse,
  RegisterNicknameResponse,
} from "./types";

/**
 * Register, update, or delete a nickname via the auth.regarde.dev service
 *
 * @param params - Registration parameters
 * @returns Promise resolving to registration result
 *
 * @example
 * // Register new nickname
 * await registerNickname({
 *   baseUrl: 'https://auth.regarde.dev',
 *   nickname: 'john_doe',
 *   jazzAccountID: 'acc123',
 *   registrationKey: 'key',
 *   registrationKeyId: 'keyId'
 * });
 *
 * @example
 * // Update/swap nickname
 * await registerNickname({
 *   baseUrl: 'https://auth.regarde.dev',
 *   nickname: 'jane_doe',
 *   jazzAccountID: 'acc123',
 *   oldNickname: 'john_doe',
 *   registrationKey: 'key',
 *   registrationKeyId: 'keyId'
 * });
 *
 * @example
 * // Delete nickname
 * await registerNickname({
 *   baseUrl: 'https://auth.regarde.dev',
 *   nickname: '',
 *   jazzAccountID: 'acc123',
 *   oldNickname: 'john_doe',
 *   registrationKey: 'key',
 *   registrationKeyId: 'keyId'
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
        "X-Registration-Key": params.registrationKey,
        "X-Registration-Key-Id": params.registrationKeyId,
      },
      body: JSON.stringify({
        nickname: params.nickname,
        jazzAccountID: params.jazzAccountID,
        oldNickname: params.oldNickname,
      }),
      signal: params.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error ||
          `Server returned ${response.status}: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if a nickname is available for registration
 *
 * @param params - Availability check parameters
 * @returns Promise resolving to availability information
 *
 * @example
 * const result = await checkNicknameAvailability({
 *   baseUrl: 'https://auth.regarde.dev',
 *   nickname: 'john_doe'
 * });
 *
 * if (result.available) {
 *   console.log('Nickname is available!');
 * } else if (result.reserved) {
 *   console.log(`Reserved: ${result.reservationReason}`);
 * } else {
 *   console.log(`Taken by: ${result.takenBy}`);
 * }
 */
export async function checkNicknameAvailability(
  params: CheckAvailabilityParams,
): Promise<CheckAvailabilityResponse> {
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

  if (!response.ok) {
    throw new Error(
      `Failed to check availability: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
}

