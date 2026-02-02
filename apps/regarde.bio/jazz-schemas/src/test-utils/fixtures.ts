/**
 * Test data factories for creating consistent test data
 * These create valid instances of our schemas for testing
 */

import { UserHandle } from "@regarde-dev/core";

import { RegardeProfile } from "../regarde.bio";

/**
 * Creates a valid UserHandle for testing
 */
export function createTestUserHandle(
  overrides: {
    nickname?: string;
    isActive?: boolean;
    registeredAt?: number;
  } = {},
) {
  const { nickname = "testuser", isActive = true, registeredAt = Date.now() } = overrides;

  return UserHandle.create({
    nickname,
    registeredAt,
    lastModified: Date.now(),
    isActive,
  });
}

/**
 * Creates a minimal valid RegardeProfile for testing
 */
export function createTestProfile(
  overrides: {
    name?: string;
    nickname?: string;
    bio?: string;
  } = {},
) {
  const { name = "Test User", nickname = "testuser", bio } = overrides;

  const userHandle = createTestUserHandle({ nickname, isActive: true });

  return RegardeProfile.create({
    name,
    bio,
    version: 1,
  });
}

/**
 * Creates a complex RegardeProfile with nested structures for testing
 */
export function createComplexTestProfile() {
  const userHandle = createTestUserHandle({ nickname: "complexuser" });

  return RegardeProfile.create({
    name: "Complex Test User",
    bio: "A complex user profile for testing",
    projects: [
      {
        title: "Test Project 1",
        year: "2024",
        client: "Test Client",
        link: "https://example.com",
        description: "A test project for validation",
      },
      {
        title: "Test Project 2",
        year: "2023",
        description: "Another test project",
      },
    ],
    workExp: [
      {
        title: "Software Engineer",
        from: "2020",
        to: "2024",
        company: "Test Company",
        location: "Remote",
        url: "https://testcompany.com",
        description: "Worked on test applications",
      },
    ],
    socialLinks: {
      github: "https://github.com/testuser",
      twitter: "https://twitter.com/testuser",
      website: "https://testuser.dev",
    },
    version: 1,
  });
}

/**
 * Creates an invalid profile for testing validation
 */
export function createInvalidTestProfile(
  invalidationType: "emptyName" | "inactiveHandle" | "emptyNickname",
) {
  switch (invalidationType) {
    case "emptyName":
      return RegardeProfile.create({
        name: "", // Invalid: empty name
        version: 1,
      });

    case "inactiveHandle":
      return RegardeProfile.create({
        name: "Test User",
        version: 1,
      });

    case "emptyNickname":
      return RegardeProfile.create({
        name: "Test User",
        version: 1,
      });

    default:
      throw new Error(`Unknown invalidation type: ${invalidationType}`);
  }
}
