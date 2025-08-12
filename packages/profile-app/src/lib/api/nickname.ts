import { API_BASE_URL } from '../config/apiKey';

export interface CheckAvailabilityRequest {
  nickname: string;
}

export interface CheckAvailabilityResponse {
  nickname: string;
  available: boolean;
  takenBy?: string;
  reserved?: boolean;
  reservationCategory?: string;
  reservationReason?: string;
}

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
  const response = await fetch(`${API_BASE_URL}/checkAvailability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname }),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

export async function registerNickname(
  request: RegisterRequest,
  getValidKey: () => Promise<string | null>,
): Promise<void> {
  const registrationKey = await getValidKey();
  if (!registrationKey) {
    throw new Error('Could not obtain valid registration key');
  }

  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Registration-Key': registrationKey,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
    );
  }
}

export async function getUserDetails(
  jazzAccountId: string,
): Promise<UserDetailsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/users?jazzAccountId=${encodeURIComponent(jazzAccountId)}`,
  );

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
    );
  }
  return response.json();
}
