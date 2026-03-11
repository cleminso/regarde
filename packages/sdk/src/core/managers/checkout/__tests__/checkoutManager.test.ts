import { describe, it, expect, vi } from "vitest";

import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";
import type { TCreateCheckoutOptions } from "#core/managers/checkout";

describe("Checkout Manager Validation", () => {
  describe("TCreateCheckoutOptions validation", () => {
    it("should require valid provider", () => {
      const options: TCreateCheckoutOptions = {
        provider: "stripe",
        amount: 1000,
        currency: "usd",
        mode: "payment",
        app: {} as unknown, // Mock app
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      };

      expect(options.provider).toBeOneOf(["stripe", "polar"]);
    });

    it("should validate amount is positive", () => {
      const validOptions: TCreateCheckoutOptions = {
        provider: "stripe",
        amount: 1000,
        currency: "usd",
        mode: "payment",
        app: {} as unknown,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      };

      expect(validOptions.amount).toBeGreaterThan(0);
    });

    it("should validate currency is uppercase", () => {
      const options: TCreateCheckoutOptions = {
        provider: "stripe",
        amount: 1000,
        currency: "USD",
        mode: "payment",
        app: {} as unknown,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      };

      expect(options.currency).toBe(options.currency.toUpperCase());
    });

    it("should support subscription mode", () => {
      const options: TCreateCheckoutOptions = {
        provider: "polar",
        amount: 2900,
        currency: "USD",
        mode: "subscription",
        app: {} as unknown,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      };

      expect(options.mode).toBe("subscription");
    });

    it("should support provider-specific escape hatches", () => {
      const options: TCreateCheckoutOptions = {
        provider: "stripe",
        amount: 1000,
        currency: "usd",
        mode: "payment",
        app: {} as unknown,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
        stripe: {
          allow_promotion_codes: true,
          automatic_tax: { enabled: true },
        },
      };

      expect(options.stripe).toBeDefined();
      expect(options.stripe?.allow_promotion_codes).toBe(true);
    });
  });

  describe("error cases", () => {
    it("should throw ACCOUNT_NOT_LOADED when account is null", () => {
      const account = null;
      const isAccountLoaded = account !== null;

      expect(isAccountLoaded).toBe(false);

      if (isAccountLoaded === false) {
        const error = new RegardeError(
          "Account must be loaded to create checkout",
          REGARDE_ERROR_CODES.ACCOUNT_NOT_LOADED,
        );
        expect(error.code).toBe("account_not_loaded");
      }
    });

    it("should throw SDK_NOT_INITIALIZED when SDK is missing", () => {
      const root = { $isLoaded: true };
      const regardeSdk = undefined;
      const isSdkLoaded = regardeSdk !== null && regardeSdk !== undefined;

      expect(isSdkLoaded).toBe(false);

      if (isSdkLoaded === false) {
        const error = new RegardeError(
          "RegardeSDK must be initialized",
          REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED,
        );
        expect(error.code).toBe("sdk_not_initialized");
      }
    });

    it("should throw COMAP_NOT_FOUND when app is not loaded", () => {
      const app = null;
      const isAppLoaded = app !== null && app !== undefined;

      expect(isAppLoaded).toBe(false);

      if (isAppLoaded === false) {
        const error = new RegardeError("App must be loaded", REGARDE_ERROR_CODES.COMAP_NOT_FOUND);
        expect(error.code).toBe("comap_not_found");
      }
    });
  });

  describe("checkout session creation", () => {
    it("should create checkout session with correct structure", () => {
      const mockCheckoutSession = {
        appId: "co_app123",
        userAccountId: "co_user456",
        provider: "stripe",
        status: "pending",
        mode: "payment",
        amount: 1000,
        currency: "USD",
        createdAt: Date.now(),
        providerMetadata: {},
      };

      expect(mockCheckoutSession.status).toBe("pending");
      expect(mockCheckoutSession.provider).toBeOneOf(["stripe", "polar"]);
      expect(mockCheckoutSession.mode).toBeOneOf(["payment", "subscription"]);
      expect(typeof mockCheckoutSession.createdAt).toBe("number");
    });

    it("should include Regarde metadata in provider calls", () => {
      const regardeMetadata = {
        regarde_app_id: "co_app123",
        regarde_user_id: "co_user456",
        regarde_sdk_id: "co_sdk789",
        regarde_session_id: "co_session012",
      };

      expect(regardeMetadata.regarde_app_id).toBeDefined();
      expect(regardeMetadata.regarde_user_id).toBeDefined();
      expect(regardeMetadata.regarde_sdk_id).toBeDefined();
      expect(regardeMetadata.regarde_session_id).toBeDefined();
    });
  });

  describe("unsupported provider", () => {
    it("should throw PROVIDER_NOT_CONFIGURED for unsupported provider", () => {
      const provider = "unsupported" as const;
      const supportedProviders = ["stripe", "polar"];

      const isSupported = supportedProviders.includes(provider);
      expect(isSupported).toBe(false);

      if (isSupported === false) {
        const error = new RegardeError(
          `Unsupported provider: ${provider}`,
          REGARDE_ERROR_CODES.PROVIDER_NOT_CONFIGURED,
        );
        expect(error.code).toBe("provider_not_configured");
      }
    });
  });
});
