/**
 * Focused tests for user details retrieval - testing business logic
 */

import { describe, it, expect } from "vitest";
import {
  createMockUserDetailsRequest,
  createMockJazzAccount,
} from "../../test-utils/index.js";

// Simple business logic functions to test user details logic
function validateUserDetailsRequest(request: any) {
  const errors: string[] = [];

  if (!request.nickname || request.nickname.trim() === "") {
    errors.push("Nickname is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function formatUserProfile(account: any) {
  const profileData = account.root["profile.jazz.dev"];

  if (!profileData) {
    return null;
  }

  return {
    name: profileData.name || "",
    bio: profileData.bio || "",
    nickname: profileData.userHandle?.nickname || "",
    isActive: profileData.userHandle?.isActive || false,
    projects: profileData.projects || [],
    workExp: profileData.workExp || [],
    socialLinks: profileData.socialLinks || {},
    version: profileData.version || 1,
  };
}

function getUserDetails(nickname: string, accounts: any[] = []) {
  // Find account by nickname
  const account = accounts.find((acc) => {
    const profile = acc.root["profile.jazz.dev"];
    return (
      profile?.userHandle?.nickname?.toLowerCase() === nickname.toLowerCase()
    );
  });

  if (!account) {
    return {
      found: false,
      error: "User not found",
    };
  }

  const profile = formatUserProfile(account);

  if (!profile) {
    return {
      found: false,
      error: "Profile data not available",
    };
  }

  return {
    found: true,
    profile,
  };
}

describe("User Details Logic - Business Rules", () => {
  it("should validate user details request correctly", () => {
    // Test request validation logic
    const validRequest = createMockUserDetailsRequest({
      nickname: "testuser",
    });

    const result = validateUserDetailsRequest(validRequest);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject invalid user details requests", () => {
    // Test validation catches errors
    const invalidRequest = createMockUserDetailsRequest({
      nickname: "",
    });

    const result = validateUserDetailsRequest(invalidRequest);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Nickname is required");
  });

  it("should format user profile correctly", () => {
    // Test profile formatting logic
    const mockAccount = createMockJazzAccount({
      root: {
        "profile.jazz.dev": {
          name: "John Doe",
          bio: "Software engineer",
          userHandle: {
            nickname: "johndoe",
            isActive: true,
          },
          projects: [{ title: "Project 1", year: "2024" }],
          workExp: [{ title: "Engineer", company: "Tech Corp" }],
          socialLinks: {
            github: "https://github.com/johndoe",
          },
          version: 1,
        },
      },
    });

    const formatted = formatUserProfile(mockAccount);

    expect(formatted).toEqual({
      name: "John Doe",
      bio: "Software engineer",
      nickname: "johndoe",
      isActive: true,
      projects: [{ title: "Project 1", year: "2024" }],
      workExp: [{ title: "Engineer", company: "Tech Corp" }],
      socialLinks: { github: "https://github.com/johndoe" },
      version: 1,
    });
  });

  it("should handle missing profile data gracefully", () => {
    // Test error handling for missing data
    const accountWithoutProfile = {
      id: "test-account",
      root: {},
    };

    const formatted = formatUserProfile(accountWithoutProfile);
    expect(formatted).toBeNull();
  });

  it("should find user by nickname successfully", () => {
    // Test user lookup logic
    const mockAccounts = [
      createMockJazzAccount({
        root: {
          "profile.jazz.dev": {
            name: "John Doe",
            userHandle: { nickname: "johndoe", isActive: true },
            bio: "Software engineer",
            version: 1,
          },
        },
      }),
      createMockJazzAccount({
        root: {
          "profile.jazz.dev": {
            name: "Jane Smith",
            userHandle: { nickname: "janesmith", isActive: true },
            bio: "Designer",
            version: 1,
          },
        },
      }),
    ];

    const result = getUserDetails("johndoe", mockAccounts);

    expect(result.found).toBe(true);
    expect(result.profile?.name).toBe("John Doe");
    expect(result.profile?.nickname).toBe("johndoe");
  });

  it("should handle case insensitive nickname lookup", () => {
    // Test case handling logic
    const mockAccounts = [
      createMockJazzAccount({
        root: {
          "profile.jazz.dev": {
            name: "John Doe",
            userHandle: { nickname: "JohnDoe", isActive: true },
            version: 1,
          },
        },
      }),
    ];

    const result = getUserDetails("johndoe", mockAccounts);

    expect(result.found).toBe(true);
    expect(result.profile?.nickname).toBe("JohnDoe");
  });

  it("should return error for non-existent user", () => {
    // Test error handling for missing users
    const mockAccounts = [
      createMockJazzAccount({
        root: {
          "profile.jazz.dev": {
            userHandle: { nickname: "existinguser", isActive: true },
            version: 1,
          },
        },
      }),
    ];

    const result = getUserDetails("nonexistentuser", mockAccounts);

    expect(result.found).toBe(false);
    expect(result.error).toBe("User not found");
  });

  it("should handle empty accounts list", () => {
    // Test edge case handling
    const result = getUserDetails("anyuser", []);

    expect(result.found).toBe(false);
    expect(result.error).toBe("User not found");
  });
});
