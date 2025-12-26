import { UserHandle } from "@regarde-dev/sdk/regarde-users";

/**
 * Validation utilities for nicknames and account IDs
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validates a nickname using the shared schema
 */
export function validateNickname(nickname: string): void {
  try {
    UserHandle.shape.nickname.parse(nickname);
  } catch (error: any) {
    throw new ValidationError(error.message || "Invalid nickname format");
  }
}

/**
 * Validates a Jazz account ID
 */
export function validateAccountId(accountId: string): void {
  if (!accountId || typeof accountId !== "string") {
    throw new ValidationError("Account ID must be a non-empty string");
  }
}

/**
 * Validates a reservation category
 */
export function validateReservationCategory(category: string): void {
  const validCategories = ["admin", "brand", "system", "offensive", "custom"];
  if (!validCategories.includes(category)) {
    throw new ValidationError(
      `Invalid reservation category. Must be one of: ${validCategories.join(", ")}`,
    );
  }
}

/**
 * Validates a reservation reason
 */
export function validateReservationReason(reason?: string): void {
  if (reason && typeof reason !== "string") {
    throw new ValidationError("Reservation reason must be a string");
  }

  if (reason && reason.length > 200) {
    throw new ValidationError(
      "Reservation reason must be no more than 200 characters",
    );
  }
}
