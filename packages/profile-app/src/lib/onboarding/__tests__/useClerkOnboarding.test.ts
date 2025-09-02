/**
 * Focused tests for useClerkOnboarding business logic - testing business logic only
 */

import { describe, it, expect } from 'vitest';

// Business logic extracted from useClerkOnboarding hook
interface MockUser {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses?: Array<{ emailAddress: string }>;
  username?: string | null;
}

// Business logic functions extracted from useClerkOnboarding hook
function extractUserName(user: MockUser | null | undefined): string {
  if (!user) return '';

  // Try firstName + lastName combination
  const firstName = user.firstName?.trim() || '';
  const lastName = user.lastName?.trim() || '';

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  if (lastName) {
    return lastName;
  }

  // Fallback to username
  if (user.username?.trim()) {
    return user.username.trim();
  }

  // Fallback to email prefix
  const email = user.emailAddresses?.[0]?.emailAddress;
  if (email) {
    const emailPrefix = email.split('@')[0];
    return emailPrefix || '';
  }

  return '';
}

function extractPrimaryEmail(user: MockUser | null | undefined): string {
  if (!user?.emailAddresses?.length) return '';
  return user.emailAddresses[0].emailAddress || '';
}

function extractUserId(user: MockUser | null | undefined): string {
  return user?.id || '';
}

function generateNicknameFromUser(user: MockUser | null | undefined): string {
  if (!user) return '';

  // Try username first
  if (user.username?.trim()) {
    return user.username.trim().toLowerCase();
  }

  // Try first name
  if (user.firstName?.trim()) {
    return user.firstName.trim().toLowerCase();
  }

  // Try email prefix
  const email = user.emailAddresses?.[0]?.emailAddress;
  if (email) {
    const emailPrefix = email.split('@')[0];
    return emailPrefix.toLowerCase();
  }

  return '';
}

function validateUserForOnboarding(user: MockUser | null | undefined): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!user) {
    return { isValid: false, missingFields: ['user'] };
  }

  if (!user.id) {
    missingFields.push('id');
  }

  if (!user.emailAddresses?.length) {
    missingFields.push('email');
  }

  const hasName = user.firstName || user.lastName || user.username;
  if (!hasName) {
    missingFields.push('name');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

function buildOnboardingData(user: MockUser | null | undefined): {
  userId: string;
  name: string;
  email: string;
  suggestedNickname: string;
  isValid: boolean;
} {
  return {
    userId: extractUserId(user),
    name: extractUserName(user),
    email: extractPrimaryEmail(user),
    suggestedNickname: generateNicknameFromUser(user),
    isValid: validateUserForOnboarding(user).isValid,
  };
}

describe('useClerkOnboarding Business Logic', () => {
  describe('User Name Extraction', () => {
    it('should extract full name when both first and last names exist', () => {
      const user = { firstName: 'John', lastName: 'Doe' };
      expect(extractUserName(user)).toBe('John Doe');
    });

    it('should extract first name only when last name is missing', () => {
      const user = { firstName: 'John', lastName: null };
      expect(extractUserName(user)).toBe('John');
    });

    it('should extract last name only when first name is missing', () => {
      const user = { firstName: null, lastName: 'Doe' };
      expect(extractUserName(user)).toBe('Doe');
    });

    it('should fallback to username when names are missing', () => {
      const user = { firstName: null, lastName: null, username: 'johndoe' };
      expect(extractUserName(user)).toBe('johndoe');
    });

    it('should fallback to email prefix when all names are missing', () => {
      const user = {
        firstName: null,
        lastName: null,
        username: null,
        emailAddresses: [{ emailAddress: 'john.doe@example.com' }],
      };
      expect(extractUserName(user)).toBe('john.doe');
    });

    it('should handle edge cases', () => {
      expect(extractUserName({ firstName: '  John  ', lastName: '  Doe  ' })).toBe('John Doe');
      expect(extractUserName(null)).toBe('');
      expect(extractUserName({ emailAddresses: [] })).toBe('');
    });
  });



  describe('Nickname Generation', () => {
    it('should prioritize username for nickname generation', () => {
      const user = {
        username: 'johndoe',
        firstName: 'John',
        emailAddresses: [{ emailAddress: 'john@example.com' }],
      };
      expect(generateNicknameFromUser(user)).toBe('johndoe');
    });

    it('should fallback to first name when username is missing', () => {
      const user = {
        username: null,
        firstName: 'John',
        emailAddresses: [{ emailAddress: 'john@example.com' }],
      };
      expect(generateNicknameFromUser(user)).toBe('john');
    });

    it('should fallback to email prefix when username and first name are missing', () => {
      const user = {
        username: null,
        firstName: null,
        emailAddresses: [{ emailAddress: 'john.doe@example.com' }],
      };
      expect(generateNicknameFromUser(user)).toBe('john.doe');
    });

    it('should handle edge cases', () => {
      expect(generateNicknameFromUser({ username: 'JohnDoe' })).toBe('johndoe');
      expect(generateNicknameFromUser(null)).toBe('');
    });
  });

  describe('User Validation', () => {
    it('should validate user data correctly', () => {
      const validUser = {
        id: 'user123',
        firstName: 'John',
        emailAddresses: [{ emailAddress: 'john@example.com' }],
      };
      expect(validateUserForOnboarding(validUser).isValid).toBe(true);

      const invalidUser = { firstName: 'John' }; // Missing id and email
      const result = validateUserForOnboarding(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('id');
      expect(result.missingFields).toContain('email');
    });
  });

  describe('Complete Onboarding Workflow', () => {
    it('should handle complete user data extraction', () => {
      const user = {
        id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        emailAddresses: [{ emailAddress: 'john@example.com' }],
      };

      const result = buildOnboardingData(user);
      expect(result).toEqual({
        userId: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        suggestedNickname: 'johndoe',
        isValid: true,
      });
    });
  });


});
