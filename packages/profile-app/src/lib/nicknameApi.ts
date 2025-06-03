const API_BASE_URL = 'http://localhost:3000';

export interface CheckAvailabilityRequest {
  nickname: string;
}

export interface CheckAvailabilityResponse {
  nickname: string;
  available: boolean;
  takenBy?: string;
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

export async function checkNicknameAvailability(nickname: string): Promise<CheckAvailabilityResponse> {
  const response = await fetch(`${API_BASE_URL}/checkAvailability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname }),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function registerNickname(request: RegisterRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
}