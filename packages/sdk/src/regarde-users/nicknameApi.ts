import {
  RegisterNicknameParams,
  CheckAvailabilityParams,
  CheckAvailabilityResponse,
  RegisterNicknameResponse,
} from "./types";

/**
 * Register, update, or delete a nickname via the api.regarde.dev service
 *
 * ## Purpose
 * - Registers nicknames to the registry
- * - Updates existing nicknames while preserving nickname-to-account mapping
- * - Deletes nicknames by removing nickname-to-account mapping (not UserHandle)
 *
 * ## Registration Process
 * 1. Client validates nickname locally via UserHandle schema rules
 * 2. Client sends registration request with authentication headers (token and token-id)
 * 3. Server validates token and updates nickname-to-account mapping
 * 4. Server returns success/failure based on nickname availability
 *
 * ## Error Handling
 * This function returns structured error messages but does not retry automatically:
 * - Server errors (4xx/5xx) return specific error descriptions
 * - Network errors return generic failure messages
 * - Client must implement retry logic if needed for resilience
 *
 * @param params - Registration parameters containing nickname and auth details
 * @returns Promise resolving to structured registration result
 *
 * @example
 * // Register new nickname
 * await registerNickname({
 *   baseUrl: 'https://api.regarde.dev',
 *   nickname: 'john_doe',
 *   jazzAccountID: 'acc123',
 *   regardeAuth: 'token',
 *   regardeAuthId: 'tokenId'
 * });
 *
 * @example
 * // Update/swap nickname
 * await registerNickname({
 *   baseUrl: 'https://api.regarde.dev',
 *   nickname: 'jane_doe',
 *   jazzAccountID: 'acc123',
 *   oldNickname: 'john_doe',
 *   regardeAuth: 'token',
 *   regardeAuthId: 'tokenId'
 * });
 *
 * @example
 * // Delete nickname
 * await registerNickname({
 *   baseUrl: 'https://api.regarde.dev',
 *   nickname: '',
 *   jazzAccountID: 'acc123',
 *   oldNickname: 'john_doe',
 *   regardeAuth: 'token',
 *   regardeAuthId: 'tokenId'
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
      error:
        error instanceof Error
          ? error.message
          : "Registration failed: Network or parsing error occurred. Check connection and retry manually.",
    };
  }
}

/**
 * Registry Client - Nickname Availability Checking
 *
 * ## Purpose
 * - Checks if a nickname is available before attempting registration
 * - Provides context about existing nickname status (taken, reserved)
 * - Helps prevent failed registration attempts with informative pre-checks
 *
 * ## Process
 * 1. Client sends nickname to check without authentication
 * 2. Server queries the registry to prevent conflicts
 * 3. Server returns detailed availability status
 * 4. Client decides whether to proceed with registration
 *
 * @param params - Availability check parameters containing nickname to verify
 * @returns Promise resolving to detailed availability information
 *
 * @example
 * // Check nickname availability before registration
 * const result = await checkNicknameAvailability({
 *   baseUrl: 'https://api.regarde.dev',
 *   nickname: 'john_doe'
 * });
 *
 * if (result.available) {
 *   console.log('Nickname is available, can proceed to registration!');
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
      `[ERROR] Failed to check availability. Server returned ${response.status} ${response.statusText}. Fix by: (1) Verifying the nickname format meets requirements, (2) Checking network connectivity to api.regarde.dev, (3) Confirming the service endpoint is accessible`,
    );
  }

  return await response.json();
}
