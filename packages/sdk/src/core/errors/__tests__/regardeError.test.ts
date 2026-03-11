import { describe, it, expect } from "vitest";

import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

describe("RegardeError", () => {
  describe("constructor", () => {
    it("should create error with message and code", () => {
      const error = new RegardeError(
        "Test error message",
        REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED,
      );

      expect(error.message).toBe("Test error message");
      expect(error.code).toBe("checkout_create_failed");
      expect(error.name).toBe("RegardeError");
    });

    it("should store provider information when provided", () => {
      const originalError = new Error("Original provider error");

      const error = new RegardeError(
        "Payment failed",
        REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED,
        "stripe",
        originalError,
      );

      expect(error.message).toBe("Payment failed");
      expect(error.provider).toBe("stripe");
      expect(error.originalError).toBe(originalError);
    });

    it("should be instance of Error", () => {
      const error = new RegardeError(
        "Test error",
        REGARDE_ERROR_CODES.PROVIDER_API_ERROR,
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RegardeError);
    });
  });

  describe("error codes", () => {
    it("should have all required error codes", () => {
      const expectedCodes = [
        "CHECKOUT_CREATE_FAILED",
        "CHECKOUT_EXPIRED",
        "SUBSCRIPTION_CREATE_FAILED",
        "SUBSCRIPTION_PAUSE_FAILED",
        "SUBSCRIPTION_RESUME_FAILED",
        "SUBSCRIPTION_CANCEL_FAILED",
        "PROVIDER_NOT_CONFIGURED",
        "COMAP_NOT_FOUND",
        "ACCOUNT_NOT_LOADED",
        "SDK_NOT_INITIALIZED",
        "SYNC_FAILED",
        "PROVIDER_API_ERROR",
      ];

      expectedCodes.forEach((code) => {
        expect(REGARDE_ERROR_CODES[code as keyof typeof REGARDE_ERROR_CODES]).toBeDefined();
      });
    });

    it("should use snake_case values for error codes", () => {
      expect(REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED).toBe("checkout_create_failed");
      expect(REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED).toBe("subscription_pause_failed");
      expect(REGARDE_ERROR_CODES.ACCOUNT_NOT_LOADED).toBe("account_not_loaded");
    });
  });

  describe("error normalization", () => {
    it("should normalize Stripe errors", () => {
      const stripeError = new Error("Card declined");

      const normalized = new RegardeError(
        "Payment failed",
        REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED,
        "stripe",
        stripeError,
      );

      expect(normalized.message).toBe("Payment failed");
      expect(normalized.provider).toBe("stripe");
      expect(normalized.originalError).toBe(stripeError);
    });

    it("should normalize Polar errors", () => {
      const polarError = new Error("Subscription not found");

      const normalized = new RegardeError(
        "Subscription action failed",
        REGARDE_ERROR_CODES.SUBSCRIPTION_CANCEL_FAILED,
        "polar",
        polarError,
      );

      expect(normalized.message).toBe("Subscription action failed");
      expect(normalized.provider).toBe("polar");
    });

    it("should preserve error chain", () => {
      const rootCause = new Error("Network timeout");
      const intermediateError = new RegardeError(
        "API call failed",
        REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED,
        "stripe",
        rootCause,
      );
      const userFacingError = new RegardeError(
        "Unable to complete checkout",
        REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED,
        undefined,
        intermediateError,
      );

      expect(userFacingError.originalError).toBe(intermediateError);
    });
  });
});
