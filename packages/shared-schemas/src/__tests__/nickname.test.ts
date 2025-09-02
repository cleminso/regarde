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

  describe("Nickname Format Validation - Edge Cases", () => {
    it("should validate nickname length boundaries", () => {
      // Test minimum length boundary (3 characters)
      expect(() => {
        UserHandle.shape.nickname.parse("ab");
      }).toThrow("Nickname must be at least 3 characters");

      // Test maximum length boundary (20 characters)
      const longNickname = "a".repeat(21);
      expect(() => {
        UserHandle.shape.nickname.parse(longNickname);
      }).toThrow("Nickname must be no more than 20 characters");

      // Test valid boundaries
      expect(() => {
        UserHandle.shape.nickname.parse("abc"); // exactly 3
        UserHandle.shape.nickname.parse("a".repeat(20)); // exactly 20
      }).not.toThrow();
    });

    it("should validate nickname character restrictions", () => {
      // Test invalid characters
      const invalidChars = ["@", "#", "$", "%", "!", " ", ".", ","];
      invalidChars.forEach(char => {
        expect(() => {
          UserHandle.shape.nickname.parse(`test${char}user`);
        }).toThrow("Nickname can only contain letters, numbers, underscores, and hyphens");
      });

      // Test valid characters
      const validNicknames = ["test_user", "test-user", "testUser123", "123test"];
      validNicknames.forEach(nickname => {
        expect(() => {
          UserHandle.shape.nickname.parse(nickname);
        }).not.toThrow();
      });
    });

    it("should handle setNicknameFromRegistry with edge cases", () => {
      // Test with empty string (should still set it)
      const userHandle1 = createTestUserHandle({ nickname: "old", isActive: false });
      setNicknameFromRegistry(userHandle1, "");
      expect(userHandle1.nickname).toBe("");
      expect(userHandle1.isActive).toBe(true);

      // Test with special valid characters
      const userHandle2 = createTestUserHandle({ nickname: "old", isActive: false });
      setNicknameFromRegistry(userHandle2, "test_user-123");
      expect(userHandle2.nickname).toBe("test_user-123");
      expect(userHandle2.isActive).toBe(true);

      // Test timestamp update
      const beforeTime = Date.now();
      const userHandle3 = createTestUserHandle({ nickname: "old", isActive: false });
      setNicknameFromRegistry(userHandle3, "newuser");
      const afterTime = Date.now();

      expect(userHandle3.lastModified).toBeGreaterThanOrEqual(beforeTime);
      expect(userHandle3.lastModified).toBeLessThanOrEqual(afterTime);
    });
  });
});
