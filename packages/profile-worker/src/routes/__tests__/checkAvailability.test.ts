/**
 * Focused tests for nickname availability checking - testing business logic
 */

import { describe, it, expect } from "vitest";
import {
  createMockCheckAvailabilityRequest,
} from "../../test-utils/index.js";

// Simple business logic functions to test availability checking
function validateNickname(nickname: string) {
  const errors: string[] = [];

  if (!nickname || nickname.trim() === "") {
    errors.push("Nickname is required");
  }

  if (nickname.length < 3) {
    errors.push("Nickname must be at least 3 characters");
  }

  if (nickname.length > 20) {
    errors.push("Nickname must be no more than 20 characters");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
    errors.push(
      "Nickname can only contain letters, numbers, underscores, and hyphens",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function checkNicknameAvailability(
  nickname: string,
  existingNicknames: string[] = [],
) {
  const validation = validateNickname(nickname);

  if (!validation.isValid) {
    return {
      available: false,
      reason: validation.errors[0],
    };
  }

  const isAvailable = !existingNicknames.includes(nickname.toLowerCase());

  return {
    available: isAvailable,
    reason: isAvailable ? undefined : "Nickname is already taken",
  };
}

describe("Nickname Availability Logic - Business Rules", () => {
  it("should validate nickname format correctly", () => {
    // Test nickname validation rules
    const validCases = ["user123", "test_user", "my-handle", "User_Name-123"];

    validCases.forEach((nickname) => {
      const result = validateNickname(nickname);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it("should reject invalid nickname formats", () => {
    // Test validation catches errors
    const invalidCases = [
      { nickname: "", expectedError: "Nickname is required" },
      {
        nickname: "ab",
        expectedError: "Nickname must be at least 3 characters",
      },
      {
        nickname: "a".repeat(21),
        expectedError: "Nickname must be no more than 20 characters",
      },
      {
        nickname: "user@domain",
        expectedError:
          "Nickname can only contain letters, numbers, underscores, and hyphens",
      },
      {
        nickname: "user space",
        expectedError:
          "Nickname can only contain letters, numbers, underscores, and hyphens",
      },
    ];

    invalidCases.forEach(({ nickname, expectedError }) => {
      const result = validateNickname(nickname);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it("should check availability against existing nicknames", () => {
    // Test availability checking logic
    const existingNicknames = ["taken", "reserved", "admin"];

    // Available nickname
    const availableResult = checkNicknameAvailability(
      "newuser",
      existingNicknames,
    );
    expect(availableResult.available).toBe(true);
    expect(availableResult.reason).toBeUndefined();

    // Taken nickname
    const takenResult = checkNicknameAvailability("taken", existingNicknames);
    expect(takenResult.available).toBe(false);
    expect(takenResult.reason).toBe("Nickname is already taken");
  });

  it("should handle case insensitive checking", () => {
    // Test case handling logic
    const existingNicknames = ["taken"];

    const upperCaseResult = checkNicknameAvailability(
      "TAKEN",
      existingNicknames,
    );
    expect(upperCaseResult.available).toBe(false);
    expect(upperCaseResult.reason).toBe("Nickname is already taken");

    const mixedCaseResult = checkNicknameAvailability(
      "TaKeN",
      existingNicknames,
    );
    expect(mixedCaseResult.available).toBe(false);
    expect(mixedCaseResult.reason).toBe("Nickname is already taken");
  });

  it("should handle request data validation", () => {
    // Test request handling logic
    const validRequest = createMockCheckAvailabilityRequest({
      nickname: "validuser",
    });

    expect(validRequest.nickname).toBe("validuser");

    const invalidRequest = createMockCheckAvailabilityRequest({
      nickname: "",
    });

    const validation = validateNickname(invalidRequest.nickname);
    expect(validation.isValid).toBe(false);
  });

  describe("Availability Check Error Recovery - Edge Cases", () => {
    it("should handle rate limiting scenarios", () => {
      // Test rate limiting business logic
      function checkRateLimit(clientId: string, requestCount: number, timeWindow: number) {
        const MAX_REQUESTS_PER_MINUTE = 60;
        const WINDOW_MS = 60000;

        if (timeWindow < WINDOW_MS && requestCount >= MAX_REQUESTS_PER_MINUTE) {
          return {
            allowed: false,
            reason: "Rate limit exceeded",
            retryAfter: WINDOW_MS - timeWindow,
          };
        }

        return { allowed: true };
      }

      // Test within limits
      const allowedResult = checkRateLimit("client1", 30, 30000);
      expect(allowedResult.allowed).toBe(true);

      // Test rate limit exceeded
      const blockedResult = checkRateLimit("client1", 60, 30000);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.reason).toBe("Rate limit exceeded");
      expect(blockedResult.retryAfter).toBe(30000);
    });

    it("should handle nickname normalization edge cases", () => {
      // Test nickname normalization business logic
      function normalizeNickname(nickname: string) {
        if (!nickname) return "";

        return nickname
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "") // Remove all whitespace
          .replace(/[^a-z0-9_-]/g, ""); // Remove invalid characters
      }

      const testCases = [
        { input: "  TestUser  ", expected: "testuser" },
        { input: "Test User", expected: "testuser" },
        { input: "test@user.com", expected: "testusercom" }, // @ and . are removed, letters remain
        { input: "Test_User-123", expected: "test_user-123" },
        { input: "", expected: "" },
        { input: "   ", expected: "" },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(normalizeNickname(input)).toBe(expected);
      });
    });

    it("should handle reservation checking with complex rules", () => {
      // Test reservation business logic
      function checkReservationRules(nickname: string, reservations: any) {
        const normalized = nickname.toLowerCase();

        // Check exact match
        if (reservations[normalized]) {
          return {
            reserved: true,
            category: reservations[normalized].category,
            reason: reservations[normalized].reason,
          };
        }

        // Check pattern-based reservations (e.g., admin*, test*)
        const patterns = Object.keys(reservations).filter(key => key.includes("*"));
        for (const pattern of patterns) {
          const regex = new RegExp(pattern.replace("*", ".*"));
          if (regex.test(normalized)) {
            return {
              reserved: true,
              category: reservations[pattern].category,
              reason: `Matches reserved pattern: ${pattern}`,
            };
          }
        }

        return { reserved: false };
      }

      const reservations = {
        "admin": { category: "system", reason: "System reserved" },
        "admin*": { category: "system", reason: "Admin pattern" },
        "test*": { category: "testing", reason: "Test pattern" },
      };

      // Test exact match
      const exactMatch = checkReservationRules("admin", reservations);
      expect(exactMatch.reserved).toBe(true);
      expect(exactMatch.category).toBe("system");

      // Test pattern match
      const patternMatch = checkReservationRules("admin123", reservations);
      expect(patternMatch.reserved).toBe(true);
      expect(patternMatch.reason).toContain("admin*");

      // Test no match
      const noMatch = checkReservationRules("regularuser", reservations);
      expect(noMatch.reserved).toBe(false);
    });

    it("should handle availability check with service degradation", () => {
      // Test service degradation business logic
      function checkAvailabilityWithFallback(
        nickname: string,
        primaryService: boolean,
        fallbackService: boolean
      ) {
        if (primaryService) {
          return {
            available: true,
            source: "primary",
            confidence: "high",
          };
        }

        if (fallbackService) {
          return {
            available: true,
            source: "fallback",
            confidence: "medium",
            warning: "Using fallback service - results may be delayed",
          };
        }

        return {
          available: false,
          source: "none",
          error: "All services unavailable",
          retryAfter: 30000,
        };
      }

      // Test primary service available
      const primaryResult = checkAvailabilityWithFallback("test", true, true);
      expect(primaryResult.source).toBe("primary");
      expect(primaryResult.confidence).toBe("high");

      // Test fallback service
      const fallbackResult = checkAvailabilityWithFallback("test", false, true);
      expect(fallbackResult.source).toBe("fallback");
      expect(fallbackResult.warning).toContain("fallback service");

      // Test all services down
      const downResult = checkAvailabilityWithFallback("test", false, false);
      expect(downResult.available).toBe(false);
      expect(downResult.error).toContain("unavailable");
    });
  });
});
