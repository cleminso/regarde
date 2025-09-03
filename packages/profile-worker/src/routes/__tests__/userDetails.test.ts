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
  it("should format user profile correctly", () => {
    // Test profile formatting business logic
    const mockAccount = createMockJazzAccount({
      root: {
        "profile.jazz.dev": {
          name: "John Doe",
          bio: "Software engineer",
          userHandle: { nickname: "johndoe", isActive: true },
          projects: [{ title: "Project 1", year: "2024" }],
          version: 1,
        },
      },
    });

    const formatted = formatUserProfile(mockAccount);
    expect(formatted?.name).toBe("John Doe");
    expect(formatted?.nickname).toBe("johndoe");
    expect(formatted?.isActive).toBe(true);
  });

  it("should find user by nickname", () => {
    // Test user lookup business logic
    const mockAccounts = [
      createMockJazzAccount({
        root: {
          "profile.jazz.dev": {
            name: "John Doe",
            userHandle: { nickname: "johndoe", isActive: true },
            version: 1,
          },
        },
      }),
    ];

    const result = getUserDetails("johndoe", mockAccounts);
    expect(result.found).toBe(true);
    expect(result.profile?.name).toBe("John Doe");
  });

  it("should handle case insensitive lookup", () => {
    // Test case handling business logic
    const mockAccounts = [
      createMockJazzAccount({
        root: {
          "profile.jazz.dev": {
            userHandle: { nickname: "JohnDoe", isActive: true },
            version: 1,
          },
        },
      }),
    ];

    expect(getUserDetails("johndoe", mockAccounts).found).toBe(true);
    expect(getUserDetails("JOHNDOE", mockAccounts).found).toBe(true);
  });

  it("should return error for non-existent user", () => {
    // Test error handling business logic
    const result = getUserDetails("nonexistent", []);
    expect(result.found).toBe(false);
    expect(result.error).toBe("User not found");
  });
});
