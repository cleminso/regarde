/**
 * Focused tests for JazzAppProfile - testing business logic, not Jazz framework
 */

import { describe, it, expect, beforeEach } from "vitest";
import { JazzAppProfile, validateJazzAppProfile } from "../profile.js";
import { UserHandle } from "../nickname.js";
import {
  setupJazzTestEnvironment,
  createTestOnboardingAccount,
} from "../test-utils/jazz-setup.js";
import {
  createTestProfile,
  createTestUserHandle,
} from "../test-utils/fixtures.js";

describe("JazzAppProfile - Application Logic", () => {
  beforeEach(async () => {
    await setupJazzTestEnvironment();
    await createTestOnboardingAccount({
      isCurrentActiveAccount: true,
      name: "Test User",
    });
  });



  it("should validate correct profiles (business logic)", () => {
    const validProfile = createTestProfile({
      name: "Valid User",
      nickname: "validuser",
    });

    const result = validateJazzAppProfile(validProfile);

    expect(result.isValid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("should reject invalid profiles (validation rules)", () => {
    // Test specific validation rules
    const invalidProfiles = [
      {
        profile: JazzAppProfile.create({
          name: "", // rule: name required
          userHandle: createTestUserHandle({ isActive: true }),
          version: 1,
        }),
        expectedError: "Name must be present and non-empty",
      },
      {
        profile: JazzAppProfile.create({
          name: "Valid Name",
          userHandle: createTestUserHandle({ isActive: false }), // rule: handle must be active
          version: 1,
        }),
        expectedError: "Nickname must be active",
      },
      {
        profile: JazzAppProfile.create({
          name: "Valid Name",
          userHandle: createTestUserHandle({ nickname: "" }), // rule: nickname required
          version: 1,
        }),
        expectedError: "Nickname must be non-empty",
      },
    ];

    invalidProfiles.forEach(({ profile, expectedError }) => {
      const result = validateJazzAppProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain(expectedError);
    });
  });

  describe("Profile Validation - Edge Cases", () => {
    it("should handle whitespace-only names correctly", () => {
      // Test names with only whitespace
      const whitespaceNames = ["   ", "\t", "\n", " \t \n "];

      whitespaceNames.forEach(name => {
        const profile = JazzAppProfile.create({
          name,
          userHandle: createTestUserHandle({ isActive: true }),
          version: 1,
        });

        const result = validateJazzAppProfile(profile);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe("Name must be present and non-empty.");
      });
    });

    it("should validate complex nested profile structures", () => {
      // Test profile with all optional fields populated
      const complexProfile = JazzAppProfile.create({
        name: "Complex User",
        userHandle: createTestUserHandle({
          nickname: "complexuser",
          isActive: true
        }),
        bio: "A complex user profile for testing edge cases",
        version: 1,
      });

      const result = validateJazzAppProfile(complexProfile);
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it("should handle profile validation with missing userHandle properties", () => {
      // Test profile with userHandle missing required properties
      const profileWithIncompleteHandle = JazzAppProfile.create({
        name: "Valid Name",
        userHandle: createTestUserHandle({
          nickname: "",  // Empty nickname
          isActive: true
        }),
        version: 1,
      });

      const result = validateJazzAppProfile(profileWithIncompleteHandle);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Nickname must be non-empty.");
    });
  });
});
