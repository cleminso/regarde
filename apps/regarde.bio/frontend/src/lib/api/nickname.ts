import {
  checkNicknameAvailability as sdkCheckNicknameAvailability,
  registerNickname as sdkRegisterNickname,
  type CheckAvailabilityResponse,
} from "@regarde-dev/core";

import { GetValidKeyFunction } from "../account/useRegistrationToken";
import { API_BASE_URL, AUTH_BASE_URL } from "../config/apiKey";

export interface RegisterRequest {
  nickname: string;
  jazzAccountID: string;
  oldNickname?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

// Re-export SDK type for backward compatibility
export type { CheckAvailabilityResponse };

export interface UserDetailsResponse {
  jazzAccountId: string;
  nickname?: string;
  exists: boolean;
  nicknameStatus: {
    hasNickname: boolean;
    isRegistered: boolean;
    registrationDate?: string;
    canRegisterNickname: boolean;
  };
  publicData?: {
    name?: string;
  };
}

export async function checkNicknameAvailability(
  nickname: string,
): Promise<CheckAvailabilityResponse> {
  try {
    return await sdkCheckNicknameAvailability({
      baseUrl: AUTH_BASE_URL,
      nickname,
    });
  } catch (error) {
    // Handle 503 errors specifically
    if (error instanceof Error && error.message.includes("503")) {
      throw new Error("Service is initializing, please try again in a moment", {
        cause: error,
      });
    }
    throw error;
  }
}

export async function registerNickname(
  request: RegisterRequest,
  getValidRegardeAuth: GetValidKeyFunction,
): Promise<void> {
  const registrationData = await getValidRegardeAuth();
  if (!registrationData) {
    throw new Error("Could not obtain valid registration token");
  }

  const { token, tokenId } = registrationData;

  const result = await sdkRegisterNickname({
    baseUrl: API_BASE_URL,
    nickname: request.nickname,
    jazzAccountID: request.jazzAccountID,
    oldNickname: request.oldNickname,
    regardeAuth: token,
    regardeAuthId: tokenId,
  });

  if (!result.success) {
    throw new Error(result.error || "Registration failed");
  }
}

export async function getUserDetails(jazzAccountId: string): Promise<UserDetailsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/users?jazzAccountId=${encodeURIComponent(jazzAccountId)}`,
  );

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}
