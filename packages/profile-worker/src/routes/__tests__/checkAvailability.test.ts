/**
 * Focused tests for nickname availability checking - testing business logic
 */

import { describe, it, expect } from "vitest";
import {
  createMockCheckAvailabilityRequest,
  createMockContext,
  createMockRequest,
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
});
