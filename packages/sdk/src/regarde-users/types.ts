export interface RegisterNicknameParams {
  baseUrl: string;
  nickname: string;
  jazzAccountID: string;
  oldNickname?: string;
  registrationKey: string;
  registrationKeyId: string;
  signal?: AbortSignal;
}

export interface CheckAvailabilityParams {
  baseUrl: string;
  nickname: string;
  signal?: AbortSignal;
}

export interface CheckAvailabilityResponse {
  nickname: string;
  available: boolean;
  takenBy?: string;
  reserved?: boolean;
  reservationCategory?: string;
  reservationReason?: string;
}

export interface RegisterNicknameResponse {
  success: boolean;
  error?: string;
}

