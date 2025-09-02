/**
 * Focused tests for UserHandle - testing nickname management logic
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  UserHandle,
  setNicknameFromRegistry,
  deactivate,
} from "../nickname.js";
import {
  setupJazzTestEnvironment,
  createTestOnboardingAccount,
} from "../test-utils/jazz-setup.js";
import { createTestUserHandle } from "../test-utils/fixtures.js";

describe("UserHandle - Application Logic", () => {
  beforeEach(async () => {
    await setupJazzTestEnvironment();
    await createTestOnboardingAccount({
      isCurrentActiveAccount: true,
      name: "Test User",
    });
  });

  it("should create UserHandle for application", () => {
    // Test specific UserHandle creation pattern
    const userHandle = createTestUserHandle({
      nickname: "validuser",
      isActive: true,
    });

    expect(userHandle.nickname).toBe("validuser");
    expect(userHandle.isActive).toBe(true);
    expect(userHandle.registeredAt).toBeTypeOf("number");
    expect(userHandle.lastModified).toBeTypeOf("number");
  });

  it("should handle setNicknameFromRegistry (business logic)", () => {
    // Test specific nickname registration workflow
    const userHandle = createTestUserHandle({
      nickname: "oldname",
      isActive: false,
    });

    setNicknameFromRegistry(userHandle, "newname");

    expect(userHandle.nickname).toBe("newname");
    expect(userHandle.isActive).toBe(true);
  });

  it("should handle deactivate function (business logic)", () => {
    // Test specific deactivation workflow
    const userHandle = createTestUserHandle({
      nickname: "activeuser",
      isActive: true,
    });

    deactivate(userHandle);

    expect(userHandle.nickname).toBe("activeuser"); // Nickname unchanged
    expect(userHandle.isActive).toBe(false);
  });
});
