/**
 * Essential tests for nickname ownership validation business logic
 * Following "test businness logic, trust the framework" philosophy
 *
 * These tests focus ONLY on core business logic scenarios that:
 * 1. Could realistically break during development
 * 2. Wouldn't be caught by E2E integration tests
 * 3. Handle critical access control decisions
 */

import { describe, expect, it } from "vitest";

import { validateNicknameOwnership } from "../base";

// Test data helpers for maintainability
const TEST_ACCOUNT_ID = "co_test123456789";
const TEST_NICKNAME = "testuser";
const OTHER_ACCOUNT_ID = "co_other987654321";
const OTHER_NICKNAME = "otheruser";

function createUserDetails(overrides: any = {}) {
  return {
    jazzAccountId: TEST_ACCOUNT_ID,
    nickname: TEST_NICKNAME,
    requestedNickname: TEST_NICKNAME,
    exists: true,
    ...overrides,
  };
}

describe("validateNicknameOwnership - Essential Business Logic Only", () => {
  it("should return valid when account owns the requested nickname", () => {
    const userDetails = createUserDetails();

    const result = validateNicknameOwnership(userDetails, TEST_ACCOUNT_ID, TEST_NICKNAME);

    expect(result).toEqual({
      isValid: true,
      reason: "valid",
    });
  });

  it("should redirect when account owns different nickname", () => {
    const userDetails = createUserDetails({
      nickname: OTHER_NICKNAME, // Account owns 'otheruser' but requesting 'testuser'
    });

    const result = validateNicknameOwnership(userDetails, TEST_ACCOUNT_ID, TEST_NICKNAME);

    expect(result).toEqual({
      isValid: false,
      redirectTo: OTHER_NICKNAME,
      reason: "wrong_nickname",
    });
  });

  it("should return not_owned when different account owns the nickname", () => {
    const userDetails = createUserDetails({
      jazzAccountId: OTHER_ACCOUNT_ID, // Different account owns this nickname
    });

    const result = validateNicknameOwnership(userDetails, TEST_ACCOUNT_ID, TEST_NICKNAME);

    expect(result).toEqual({
      isValid: false,
      reason: "not_owned",
    });
  });

  it("should prioritize ownership check over exists field", () => {
    // Tests critical business rule priority: ownership check comes before exists check
    const userDetails = createUserDetails({
      exists: false, // exists is false but account still owns the nickname
    });

    const result = validateNicknameOwnership(userDetails, TEST_ACCOUNT_ID, TEST_NICKNAME);

    // Should return valid because ownership check comes first in the business logic
    expect(result).toEqual({
      isValid: true,
      reason: "valid",
    });
  });
});
