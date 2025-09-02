/**
 * Test data factories for creating consistent test data
 * These create valid instances of our schemas for testing
 */

import { JazzAppProfile } from '../profile.js';
import { UserHandle } from '../nickname.js';

/**
 * Creates a valid UserHandle for testing
 */
export function createTestUserHandle(overrides: {
  nickname?: string;
  isActive?: boolean;
  registeredAt?: number;
} = {}) {
  const {
    nickname = 'testuser',
    isActive = true,
    registeredAt = Date.now(),
  } = overrides;

  return UserHandle.create({
    nickname,
    registeredAt,
    lastModified: Date.now(),
    isActive,
  });
}

/**
 * Creates a minimal valid JazzAppProfile for testing
 */
export function createTestProfile(overrides: {
  name?: string;
  nickname?: string;
  bio?: string;
} = {}) {
  const {
    name = 'Test User',
    nickname = 'testuser',
    bio,
  } = overrides;

  const userHandle = createTestUserHandle({ nickname, isActive: true });

  return JazzAppProfile.create({
    name,
    userHandle,
    bio,
    version: 1,
  });
}

/**
 * Creates a complex JazzAppProfile with nested structures for testing
 */
export function createComplexTestProfile() {
  const userHandle = createTestUserHandle({ nickname: 'complexuser' });

  return JazzAppProfile.create({
    name: 'Complex Test User',
    userHandle,
    bio: 'A complex user profile for testing',
    projects: [
      {
        title: 'Test Project 1',
        year: '2024',
        client: 'Test Client',
        link: 'https://example.com',
        description: 'A test project for validation',
      },
      {
        title: 'Test Project 2',
        year: '2023',
        description: 'Another test project',
      },
    ],
    workExp: [
      {
        title: 'Software Engineer',
        from: '2020',
        to: '2024',
        company: 'Test Company',
        location: 'Remote',
        url: 'https://testcompany.com',
        description: 'Worked on test applications',
      },
    ],
    socialLinks: {
      github: 'https://github.com/testuser',
      twitter: 'https://twitter.com/testuser',
      website: 'https://testuser.dev',
    },
    version: 1,
  });
}

/**
 * Creates an invalid profile for testing validation
 */
export function createInvalidTestProfile(invalidationType: 'emptyName' | 'inactiveHandle' | 'emptyNickname') {
  switch (invalidationType) {
    case 'emptyName':
      return JazzAppProfile.create({
        name: '', // Invalid: empty name
        userHandle: createTestUserHandle({ isActive: true }),
        version: 1,
      });
    
    case 'inactiveHandle':
      return JazzAppProfile.create({
        name: 'Test User',
        userHandle: createTestUserHandle({ isActive: false }), // Invalid: inactive handle
        version: 1,
      });
    
    case 'emptyNickname':
      return JazzAppProfile.create({
        name: 'Test User',
        userHandle: createTestUserHandle({ nickname: '' }), // Invalid: empty nickname
        version: 1,
      });
    
    default:
      throw new Error(`Unknown invalidation type: ${invalidationType}`);
  }
}
