/**
 * Parameters for nickname registration request sent to registry server
 */
export interface RegisterNicknameParams {
  /** Base URL of the registry service */
  baseUrl: string;
  /** Target nickname to register (use empty string to delete/remove) */
  nickname: string;
  /** Jazz Account ID that will be linked to the nickname */
  jazzAccountID: string;
  /** Current nickname when updating to new one (omit for new registrations) */
  oldNickname?: string;
  /** Authentication token from user's RegardeTokenAuth schema for verification */
  regardeAuth: string;
  /** ID of the RegardeTokenAuth CoMap containing the authentication token */
  regardeAuthId: string;
  /** Optional AbortSignal to cancel the network request */
  signal?: AbortSignal;
}

/**
 * Parameters for checking nickname availability before registration
 */
export interface CheckAvailabilityParams {
  /** Base URL of the registry service */
  baseUrl: string;
  /** Nickname to verify for availability in the registry */
  nickname: string;
  /** Optional AbortSignal to cancel the network request */
  signal?: AbortSignal;
}

/**
 * Detailed response about nickname status from registry availability check
 */
export interface CheckAvailabilityResponse {
  /** The nickname that was queried against the registry */
  nickname: string;
  /** True if nickname is available for registration */
  available: boolean;
  /** Jazz Account ID that currently owns the nickname (if taken) */
  takenBy?: string;
  /** True if nickname is reserved by system/admin */
  reserved?: boolean;
  /** Type of reservation */
  reservationCategory?: "admin" | "brand" | "system" | "offensive" | "custom";
  /** Explanation for the reservation (if present) */
  reservationReason?: string;
}

/**
 * Result from nickname registration operation
 */
export interface RegisterNicknameResponse {
  /** True if registry operation completed successfully */
  success: boolean;
  /** Detailed error message if registration failed (undefined on success) */
  error?: string;
}
