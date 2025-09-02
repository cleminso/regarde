/**
 * Integration tests - testing how schemas work together
 */

import { describe, it, expect, beforeEach } from "vitest";
import { JazzAppProfile, validateJazzAppProfile } from "../profile.js";
import { UserHandle, setNicknameFromRegistry } from "../nickname.js";
import {
  setupJazzTestEnvironment,
  createTestOnboardingAccount,
} from "../test-utils/jazz-setup.js";
import {
  createTestProfile,
  createTestUserHandle,
} from "../test-utils/fixtures.js";

describe("Integration Tests - Application Logic", () => {
  beforeEach(async () => {
    await setupJazzTestEnvironment();
    await createTestOnboardingAccount({
      isCurrentActiveAccount: true,
      name: "Test User",
    });
  });





  it("should handle nickname registration workflow (business process)", () => {
    // Test specific business workflow
    const userHandle = createTestUserHandle({
      nickname: "",
      isActive: false,
    });

    // Initial state
    expect(userHandle.isActive).toBe(false);
    expect(userHandle.nickname).toBe("");

    // business logic: register nickname
    setNicknameFromRegistry(userHandle, "registereduser");

    // Verify workflow result
    expect(userHandle.nickname).toBe("registereduser");
    expect(userHandle.isActive).toBe(true);

    // Test that profile validation now passes
    const profile = JazzAppProfile.create({
      name: "Registered User",
      userHandle,
      version: 1,
    });

    const result = validateJazzAppProfile(profile);
    expect(result.isValid).toBe(true);
  });
});
