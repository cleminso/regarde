/**
 * Focused tests for nickname validation utilities - testing business logic only
 */

import { describe, it, expect } from 'vitest';
import {
  isPlaceholderNickname,
  isValidNicknameFormat,
  getNicknameValidationError,
} from '../utils';

describe('Nickname Placeholder Detection', () => {
  describe('isPlaceholderNickname', () => {
    it('should detect undefined and null as placeholders', () => {
      expect(isPlaceholderNickname(undefined)).toBe(true);
      expect(isPlaceholderNickname(null as any)).toBe(true);
    });

    it('should detect empty strings as placeholders', () => {
      expect(isPlaceholderNickname('')).toBe(true);
      expect(isPlaceholderNickname('   ')).toBe(true);
      expect(isPlaceholderNickname('\t\n')).toBe(true);
    });

    it('should detect default placeholder value', () => {
      expect(isPlaceholderNickname('your-nickname')).toBe(true);
    });

    it('should not detect valid nicknames as placeholders', () => {
      expect(isPlaceholderNickname('username')).toBe(false);
      expect(isPlaceholderNickname('user123')).toBe(false);
      expect(isPlaceholderNickname('user-name')).toBe(false);
      expect(isPlaceholderNickname('user_name')).toBe(false);
    });

    it('should handle edge cases correctly', () => {
      expect(isPlaceholderNickname('a')).toBe(false); // Single character
      expect(isPlaceholderNickname('YOUR-NICKNAME')).toBe(false); // Case sensitive
      expect(isPlaceholderNickname('your-nickname-2')).toBe(false); // Similar but different
    });
  });
});

describe('Nickname Format Validation', () => {
  describe('isValidNicknameFormat', () => {
    it('should validate correct nickname formats', () => {
      const validNicknames = [
        'username',
        'user123',
        'user-name',
        'user_name',
        'abc', // Minimum 3 characters
        'user123name',
        'a-b-c',
        'test_user',
        'user-123',
        'ABC123',
      ];

      validNicknames.forEach(nickname => {
        expect(isValidNicknameFormat(nickname)).toBe(true);
      });
    });

    it('should reject invalid nickname formats', () => {
      const invalidNicknames = [
        '', // Empty
        '   ', // Whitespace only
        'a', // Too short (< 3 chars)
        'ab', // Too short (< 3 chars)
        'a'.repeat(21), // Too long (> 20 chars)
        'user name', // Spaces
        'user@name', // Special characters
        'user.name', // Dots
        'user#name', // Hash
        'user$name', // Dollar sign
        'user%name', // Percent
        'user&name', // Ampersand
        'user*name', // Asterisk
        'user+name', // Plus
        'user=name', // Equals
        'user?name', // Question mark
        'user!name', // Exclamation
        'user/name', // Slash
        'user\\name', // Backslash
        'user|name', // Pipe
        'user<name', // Less than
        'user>name', // Greater than
        'user[name]', // Brackets
        'user{name}', // Braces
        'user(name)', // Parentheses
        'user"name', // Quotes
        "user'name", // Single quotes
        'user`name', // Backticks
        'user~name', // Tilde
        'user^name', // Caret
      ];

      invalidNicknames.forEach(nickname => {
        expect(isValidNicknameFormat(nickname)).toBe(false);
      });
    });

    it('should handle case sensitivity correctly', () => {
      // Assuming the schema allows both cases
      expect(isValidNicknameFormat('USERNAME')).toBe(true);
      expect(isValidNicknameFormat('username')).toBe(true);
      expect(isValidNicknameFormat('UserName')).toBe(true);
    });

    it('should validate length constraints', () => {
      // Test length boundaries
      expect(isValidNicknameFormat('ab')).toBe(false); // Too short
      expect(isValidNicknameFormat('abc')).toBe(true); // Minimum length
      expect(isValidNicknameFormat('a'.repeat(20))).toBe(true); // Maximum length
      expect(isValidNicknameFormat('a'.repeat(21))).toBe(false); // Too long
    });
  });

  describe('getNicknameValidationError', () => {
    it('should return null for valid nicknames', () => {
      const validNicknames = [
        'username',
        'user123',
        'user-name',
        'user_name',
        'abc',
        'test-user',
      ];

      validNicknames.forEach(nickname => {
        expect(getNicknameValidationError(nickname)).toBeNull();
      });
    });

    it('should return error messages for invalid nicknames', () => {
      const invalidNicknames = [
        '',
        '   ',
        'ab', // Too short
        'a'.repeat(21), // Too long
        'user name',
        'user@name',
        'user.name',
      ];

      invalidNicknames.forEach(nickname => {
        const error = getNicknameValidationError(nickname);
        expect(error).toBeTruthy();
        expect(typeof error).toBe('string');
        expect(error!.length).toBeGreaterThan(0);
      });
    });

    it('should provide meaningful error messages', () => {
      const testCases = [
        { nickname: '', expectedToContain: ['3', 'characters', 'least'] },
        { nickname: 'ab', expectedToContain: ['3', 'characters', 'least'] },
        { nickname: 'a'.repeat(21), expectedToContain: ['20', 'characters', 'more'] },
        { nickname: 'user name', expectedToContain: ['letters', 'numbers', 'underscores', 'hyphens'] },
        { nickname: 'user@name', expectedToContain: ['letters', 'numbers', 'underscores', 'hyphens'] },
      ];

      testCases.forEach(({ nickname, expectedToContain }) => {
        const error = getNicknameValidationError(nickname);
        expect(error).toBeTruthy();

        // Check if error message contains expected keywords (case insensitive)
        const lowerError = error!.toLowerCase();
        const hasExpectedContent = expectedToContain.some(keyword =>
          lowerError.includes(keyword.toLowerCase())
        );
        expect(hasExpectedContent).toBe(true);
      });
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        null as any,
        undefined as any,
        123 as any,
        {} as any,
        [] as any,
      ];

      edgeCases.forEach(edgeCase => {
        const error = getNicknameValidationError(edgeCase);
        expect(typeof error).toBe('string');
        expect(error!.length).toBeGreaterThan(0);
      });
    });

    it('should be consistent with isValidNicknameFormat', () => {
      const testNicknames = [
        'valid-nickname',
        'invalid nickname',
        'user@invalid',
        '',
        'a',
        'user123',
      ];

      testNicknames.forEach(nickname => {
        const isValid = isValidNicknameFormat(nickname);
        const error = getNicknameValidationError(nickname);
        
        if (isValid) {
          expect(error).toBeNull();
        } else {
          expect(error).toBeTruthy();
          expect(typeof error).toBe('string');
        }
      });
    });
  });
});

describe('Business Logic Integration', () => {
  it('should handle registration vs update flow detection', () => {
    // Test the business logic for determining registration vs update flows
    const registrationCases = [
      undefined,
      '',
      '   ',
      'your-nickname',
    ];

    const updateCases = [
      'existing-user',
      'user123',
      'valid-nickname',
    ];

    registrationCases.forEach(nickname => {
      expect(isPlaceholderNickname(nickname)).toBe(true);
    });

    updateCases.forEach(nickname => {
      expect(isPlaceholderNickname(nickname)).toBe(false);
    });
  });

  it('should validate complete nickname processing workflow', () => {
    // Test the complete workflow: placeholder check -> format validation -> error handling
    const testCases = [
      {
        nickname: undefined,
        isPlaceholder: true,
        isValidFormat: false,
        hasError: true,
        description: 'undefined nickname',
      },
      {
        nickname: 'your-nickname',
        isPlaceholder: true,
        isValidFormat: true,
        hasError: false,
        description: 'default placeholder',
      },
      {
        nickname: 'valid-user',
        isPlaceholder: false,
        isValidFormat: true,
        hasError: false,
        description: 'valid existing nickname',
      },
      {
        nickname: 'invalid user',
        isPlaceholder: false,
        isValidFormat: false,
        hasError: true,
        description: 'invalid format',
      },
    ];

    testCases.forEach(({ nickname, isPlaceholder, isValidFormat, hasError }) => {
      expect(isPlaceholderNickname(nickname)).toBe(isPlaceholder);
      expect(isValidNicknameFormat(nickname || '')).toBe(isValidFormat);
      
      const error = getNicknameValidationError(nickname || '');
      if (hasError) {
        expect(error).toBeTruthy();
      } else {
        expect(error).toBeNull();
      }
    });
  });

  it('should handle performance requirements', () => {
    // Test that validation functions perform well with various inputs
    const startTime = performance.now();
    
    const testInputs = [
      'valid-nickname',
      'invalid nickname',
      '',
      'a'.repeat(50),
      'user123',
      'your-nickname',
    ];

    // Run validation functions multiple times
    for (let i = 0; i < 100; i++) {
      testInputs.forEach(input => {
        isPlaceholderNickname(input);
        isValidNicknameFormat(input);
        getNicknameValidationError(input);
      });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Should complete 300 validations (100 iterations × 3 functions) in reasonable time
    expect(executionTime).toBeLessThan(100); // Less than 100ms
  });
});
