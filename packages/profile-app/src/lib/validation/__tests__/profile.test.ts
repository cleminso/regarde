/**
 * Focused tests for profile validation logic - testing business logic only
 */

import { describe, it, expect } from 'vitest';
import { validateJazzAppProfile } from '@onboarding.jazz/shared-schemas';

// Mock profile data for testing
function createMockProfile(overrides: any = {}) {
  return {
    name: 'John Doe',
    userHandle: {
      nickname: 'johndoe',
      isActive: true,
      registeredAt: Date.now(),
      lastModified: Date.now(),
    },
    bio: 'Software developer',
    version: 1,
    ...overrides,
  } as any;
}

describe('Profile Validation Logic', () => {
  describe('validateJazzAppProfile', () => {
    it('should validate a complete valid profile', () => {
      const validProfile = createMockProfile();
      const result = validateJazzAppProfile(validProfile);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should reject profile with empty name', () => {
      const profileWithEmptyName = createMockProfile({ name: '' });
      const result = validateJazzAppProfile(profileWithEmptyName);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Name must be present and non-empty.');
    });

    it('should reject profile with whitespace-only name', () => {
      const profileWithWhitespaceName = createMockProfile({ name: '   \n\t   ' });
      const result = validateJazzAppProfile(profileWithWhitespaceName);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Name must be present and non-empty.');
    });

    it('should reject profile with null name', () => {
      const profileWithNullName = createMockProfile({ name: null });
      const result = validateJazzAppProfile(profileWithNullName);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Name must be present and non-empty.');
    });

    it('should reject profile with undefined name', () => {
      const profileWithUndefinedName = createMockProfile({ name: undefined });
      const result = validateJazzAppProfile(profileWithUndefinedName);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Name must be present and non-empty.');
    });

    it('should reject profile without userHandle', () => {
      const profileWithoutUserHandle = createMockProfile({ userHandle: null });
      const result = validateJazzAppProfile(profileWithoutUserHandle);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Onboarding data is required.');
    });

    it('should reject profile with undefined userHandle', () => {
      const profileWithUndefinedUserHandle = createMockProfile({ userHandle: undefined });
      const result = validateJazzAppProfile(profileWithUndefinedUserHandle);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Onboarding data is required.');
    });

    it('should reject profile with empty nickname', () => {
      const profileWithEmptyNickname = createMockProfile({
        userHandle: {
          nickname: '',
          isActive: true,
          registeredAt: Date.now(),
          lastModified: Date.now(),
        },
      });
      const result = validateJazzAppProfile(profileWithEmptyNickname);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Nickname must be non-empty.');
    });

    it('should reject profile with whitespace-only nickname', () => {
      const profileWithWhitespaceNickname = createMockProfile({
        userHandle: {
          nickname: '   \t\n   ',
          isActive: true,
          registeredAt: Date.now(),
          lastModified: Date.now(),
        },
      });
      const result = validateJazzAppProfile(profileWithWhitespaceNickname);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Nickname must be non-empty.');
    });

    it('should reject profile with null nickname', () => {
      const profileWithNullNickname = createMockProfile({
        userHandle: {
          nickname: null,
          isActive: true,
          registeredAt: Date.now(),
          lastModified: Date.now(),
        },
      });
      const result = validateJazzAppProfile(profileWithNullNickname);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Nickname must be non-empty.');
    });

    it('should reject profile with undefined nickname', () => {
      const profileWithUndefinedNickname = createMockProfile({
        userHandle: {
          nickname: undefined,
          isActive: true,
          registeredAt: Date.now(),
          lastModified: Date.now(),
        },
      });
      const result = validateJazzAppProfile(profileWithUndefinedNickname);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Nickname must be non-empty.');
    });

    it('should reject profile with inactive nickname', () => {
      const profileWithInactiveNickname = createMockProfile({
        userHandle: {
          nickname: 'johndoe',
          isActive: false,
          registeredAt: Date.now(),
          lastModified: Date.now(),
        },
      });
      const result = validateJazzAppProfile(profileWithInactiveNickname);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Nickname must be active.');
    });

    it('should accept profile with valid name and active nickname', () => {
      const validProfile = createMockProfile({
        name: 'Jane Smith',
        userHandle: {
          nickname: 'janesmith',
          isActive: true,
          registeredAt: Date.now(),
          lastModified: Date.now(),
        },
      });
      const result = validateJazzAppProfile(validProfile);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should accept profile with optional fields missing', () => {
      const minimalProfile = createMockProfile({
        bio: undefined,
        avatarImage: undefined,
        socialLinks: undefined,
        projects: undefined,
      });
      const result = validateJazzAppProfile(minimalProfile);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should handle edge cases in name validation', () => {
      const edgeCases = [
        { name: 'A', expected: true, description: 'Single character name' },
        { name: 'John Doe Jr.', expected: true, description: 'Name with punctuation' },
        { name: 'José María', expected: true, description: 'Name with accents' },
        { name: '李小明', expected: true, description: 'Non-Latin characters' },
        { name: 'John-Paul O\'Connor', expected: true, description: 'Name with hyphens and apostrophes' },
        { name: '123', expected: true, description: 'Numeric name' },
        { name: 'Name with    spaces', expected: true, description: 'Name with multiple spaces' },
      ];

      edgeCases.forEach(({ name, expected }) => {
        const profile = createMockProfile({ name });
        const result = validateJazzAppProfile(profile);
        expect(result.isValid).toBe(expected);
      });
    });

    it('should handle edge cases in nickname validation', () => {
      const edgeCases = [
        { nickname: 'a', isActive: true, expected: true, description: 'Single character nickname' },
        { nickname: 'user123', isActive: true, expected: true, description: 'Alphanumeric nickname' },
        { nickname: 'user-name', isActive: true, expected: true, description: 'Nickname with hyphen' },
        { nickname: 'user_name', isActive: true, expected: true, description: 'Nickname with underscore' },
        { nickname: 'validnick', isActive: false, expected: false, description: 'Valid nickname but inactive' },
      ];

      edgeCases.forEach(({ nickname, isActive, expected }) => {
        const profile = createMockProfile({
          userHandle: {
            nickname,
            isActive,
            registeredAt: Date.now(),
            lastModified: Date.now(),
          },
        });
        const result = validateJazzAppProfile(profile);
        expect(result.isValid).toBe(expected);
      });
    });
  });

  describe('Profile Validation Workflow', () => {
    it('should validate profiles in different states', () => {
      const profileStates = [
        {
          description: 'New user profile',
          profile: createMockProfile({
            name: 'New User',
            userHandle: {
              nickname: 'newuser',
              isActive: true,
              registeredAt: Date.now(),
              lastModified: Date.now(),
            },
            bio: undefined,
          }),
          expectedValid: true,
        },
        {
          description: 'Complete user profile',
          profile: createMockProfile({
            name: 'Complete User',
            userHandle: {
              nickname: 'completeuser',
              isActive: true,
              registeredAt: Date.now(),
              lastModified: Date.now(),
            },
            bio: 'I am a complete user with all fields filled',
            socialLinks: {
              github: 'completeuser',
              twitter: 'completeuser',
              website: 'https://completeuser.com',
            },
          }),
          expectedValid: true,
        },
        {
          description: 'Incomplete profile - missing name',
          profile: createMockProfile({
            name: '',
            userHandle: {
              nickname: 'incompleteuser',
              isActive: true,
              registeredAt: Date.now(),
              lastModified: Date.now(),
            },
          }),
          expectedValid: false,
        },
        {
          description: 'Incomplete profile - inactive nickname',
          profile: createMockProfile({
            name: 'User With Inactive Nickname',
            userHandle: {
              nickname: 'inactiveuser',
              isActive: false,
              registeredAt: Date.now(),
              lastModified: Date.now(),
            },
          }),
          expectedValid: false,
        },
      ];

      profileStates.forEach(({ profile, expectedValid }) => {
        const result = validateJazzAppProfile(profile);
        expect(result.isValid).toBe(expectedValid);

        if (!expectedValid) {
          expect(result.message).toBeTruthy();
          expect(typeof result.message).toBe('string');
        }
      });
    });

    it('should provide specific error messages for different validation failures', () => {
      const errorCases = [
        {
          profile: createMockProfile({ name: '' }),
          expectedMessage: 'Name must be present and non-empty.',
        },
        {
          profile: createMockProfile({ userHandle: null }),
          expectedMessage: 'Onboarding data is required.',
        },
        {
          profile: createMockProfile({
            userHandle: {
              nickname: '',
              isActive: true,
              registeredAt: Date.now(),
              lastModified: Date.now(),
            },
          }),
          expectedMessage: 'Nickname must be non-empty.',
        },
        {
          profile: createMockProfile({
            userHandle: {
              nickname: 'validnick',
              isActive: false,
              registeredAt: Date.now(),
              lastModified: Date.now(),
            },
          }),
          expectedMessage: 'Nickname must be active.',
        },
      ];

      errorCases.forEach(({ profile, expectedMessage }) => {
        const result = validateJazzAppProfile(profile);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe(expectedMessage);
      });
    });

    it('should handle malformed profile data gracefully', () => {
      const malformedProfiles = [
        // null and undefined will throw, so we test them separately
        {},
        { name: 'Test' }, // Missing userHandle
        { userHandle: {} }, // Missing name
        { name: 'Test', userHandle: {} }, // Missing nickname and isActive
      ];

      malformedProfiles.forEach(profile => {
        expect(() => {
          const result = validateJazzAppProfile(profile as any);
          expect(result.isValid).toBe(false);
          expect(typeof result.message).toBe('string');
        }).not.toThrow();
      });

      // Test null and undefined separately - they may throw
      [null, undefined].forEach(profile => {
        expect(() => {
          validateJazzAppProfile(profile as any);
        }).toThrow();
      });
    });
  });

  // Removed performance tests - these test JavaScript execution speed, not business logic
  // Removed consistency tests - these test JavaScript behavior, not business logic
  // Removed concurrent validation tests - these test framework behavior, not business logic
});
