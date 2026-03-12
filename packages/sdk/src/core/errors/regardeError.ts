import type { TPaymentProvider } from "#schemas/paymentEvent";

export const REGARDE_ERROR_CODES = {
  // Checkout errors
  CHECKOUT_CREATE_FAILED: "checkout_create_failed",
  CHECKOUT_EXPIRED: "checkout_expired",
  CHECKOUT_CANCELED: "checkout_canceled",
  CHECKOUT_NOT_FOUND: "checkout_not_found",

  // Subscription errors
  SUBSCRIPTION_CREATE_FAILED: "subscription_create_failed",
  SUBSCRIPTION_UPDATE_FAILED: "subscription_update_failed",
  SUBSCRIPTION_PAUSE_FAILED: "subscription_pause_failed",
  SUBSCRIPTION_RESUME_FAILED: "subscription_resume_failed",
  SUBSCRIPTION_CANCEL_FAILED: "subscription_cancel_failed",
  SUBSCRIPTION_NOT_FOUND: "subscription_not_found",

  // Refund errors
  REFUND_CREATE_FAILED: "refund_create_failed",
  REFUND_EXCEEDS_PAYMENT: "refund_exceeds_payment",
  REFUND_ALREADY_REFUNDED: "refund_already_refunded",
  REFUND_NOT_FOUND: "refund_not_found",

  // Provider errors
  PROVIDER_API_ERROR: "provider_api_error",
  PROVIDER_AUTH_FAILED: "provider_auth_failed",
  PROVIDER_RATE_LIMITED: "provider_rate_limited",
  PROVIDER_NOT_CONFIGURED: "provider_not_configured",

  // Validation errors
  INVALID_AMOUNT: "invalid_amount",
  INVALID_CURRENCY: "invalid_currency",
  MISSING_REQUIRED_FIELD: "missing_required_field",
  PROVIDER_VALIDATION_FAILED: "provider_validation_failed",

  // Jazz/State errors
  COMAP_NOT_FOUND: "comap_not_found",
  SYNC_FAILED: "sync_failed",
  ACCOUNT_NOT_LOADED: "account_not_loaded",
  SDK_NOT_INITIALIZED: "sdk_not_initialized",
} as const;

export type TRegardeErrorCode = (typeof REGARDE_ERROR_CODES)[keyof typeof REGARDE_ERROR_CODES];

/**
 * Normalized error class for all Regarde operations.
 *
 * Wraps provider-specific errors into a consistent format with
 * actionable error codes.
 */
export class RegardeError extends Error {
  public readonly code: TRegardeErrorCode;
  public readonly provider?: TPaymentProvider;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    code: TRegardeErrorCode,
    provider?: TPaymentProvider,
    originalError?: unknown,
  ) {
    super(message);
    this.name = "RegardeError";
    this.code = code;
    this.provider = provider;
    this.originalError = originalError;
  }
}

/**
 * Wraps an unknown error as a RegardeError.
 * If already a RegardeError, returns it unchanged.
 *
 * @param error - The error to wrap
 * @param fallbackCode - Error code to use if error is not already a RegardeError
 * @param provider - Optional payment provider that caused the error
 * @returns A RegardeError instance
 */
export function toRegardeError(
  error: unknown,
  fallbackCode: TRegardeErrorCode = REGARDE_ERROR_CODES.PROVIDER_API_ERROR,
  provider?: TPaymentProvider,
): RegardeError {
  const isRegardeError = error instanceof RegardeError;
  if (isRegardeError === true) {
    return error;
  }

  const message = error instanceof Error ? error.message : "Unknown error occurred";

  return new RegardeError(message, fallbackCode, provider, error);
}
