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
  it("should validate nickname format", () => {
    // Test core nickname validation business rules
    expect(validateNickname("user123").isValid).toBe(true);
    expect(validateNickname("ab").isValid).toBe(false);
    expect(validateNickname("user@domain").isValid).toBe(false);
  });

  it("should check availability against existing nicknames", () => {
    // Test availability checking logic
    const existingNicknames = ["taken", "reserved"];

    const availableResult = checkNicknameAvailability("newuser", existingNicknames);
    expect(availableResult.available).toBe(true);

    const takenResult = checkNicknameAvailability("taken", existingNicknames);
    expect(takenResult.available).toBe(false);
    expect(takenResult.reason).toBe("Nickname is already taken");
  });

  it("should handle case insensitive checking", () => {
    // Test case handling business logic
    const existingNicknames = ["taken"];

    expect(checkNicknameAvailability("TAKEN", existingNicknames).available).toBe(false);
    expect(checkNicknameAvailability("TaKeN", existingNicknames).available).toBe(false);
  });
});
