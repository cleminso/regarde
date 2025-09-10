/**
 * Tests for useRegistrationKey hook - focused on business logic and integration points
 * Following "test businness logic, trust the framework" philosophy
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useRegistrationKey,
  generateRegistrationKey,
  isKeyExpired
} from '../useRegistrationKey';
import { useMyJazz } from '../useMyJazz';

// Mock Jazz integration - trust the framework, test our integration
vi.mock('../useMyJazz', () => ({
  useMyJazz: vi.fn()
}));

// Test helpers for maintainability - using type assertions to avoid complex Jazz type matching
function createMockAccountWithValidKey(expiresAt = Date.now() + 3600000) {
  return {
    root: {
      'auth.regarde.dev': {
        id: 'test-key-id',
        key: 'valid-test-key',
        expiresAt
      }
    },
    ensureLoaded: vi.fn().mockResolvedValue(undefined),
    waitForSync: vi.fn().mockResolvedValue(undefined)
  } as any; // Use type assertion to avoid complex Jazz type matching
}

function createMockAccountWithExpiredKey() {
  return createMockAccountWithValidKey(Date.now() - 1000);
}

// Create a complete mock for useMyJazz return value
function createMockUseMyJazzReturn(account: any, isAccountReady: boolean) {
  return {
    account,
    isAccountReady,
    isAuthenticated: isAccountReady,
    profile: null,
    logOut: vi.fn(),
    jazzAppProfile: null,
    hasStableProfile: false,
    isLoading: !isAccountReady
  } as any; // Use type assertion to avoid complex Jazz type matching
}

describe('useRegistrationKey Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Business Logic Functions', () => {
    it('should generate valid registration keys', () => {
      const key = generateRegistrationKey();

      // Test key properties
      expect(key).toHaveLength(16);
      expect(typeof key).toBe('string');
      expect(key.trim()).toBe(key); // No whitespace
      expect(key).not.toBe(''); // Not empty

      // Test character set
      const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"[]{}';
      const allCharsValid = key.split('').every(char => validChars.includes(char));
      expect(allCharsValid).toBe(true);

      // Test uniqueness
      const key2 = generateRegistrationKey();
      expect(key).not.toBe(key2);
    });

    it('should correctly identify expired keys', () => {
      const futureKey = { expiresAt: Date.now() + 1000 };
      const pastKey = { expiresAt: Date.now() - 1000 };
      const noExpiryKey = { expiresAt: null };

      expect(isKeyExpired(futureKey)).toBe(false);
      expect(isKeyExpired(pastKey)).toBe(true);
      expect(isKeyExpired(noExpiryKey)).toBe(true);
      expect(isKeyExpired(null)).toBe(true);
      expect(isKeyExpired(undefined)).toBe(true);
    });
  });

  describe('Hook State Management', () => {
    it('should return correct state when account is not ready', () => {
      const mockUseMyJazz = vi.mocked(useMyJazz);
      mockUseMyJazz.mockReturnValue(createMockUseMyJazzReturn(undefined, false));

      const { result } = renderHook(() => useRegistrationKey());

      expect(result.current.isAccountReady).toBe(false);
      expect(result.current.hasRegistrationKey).toBe(false);
      expect(result.current.isKeyExpired).toBe(true);
      expect(result.current.isRegistrationKeyLoading).toBe(true);
      // When account is undefined, registrationKey is undefined, so isAccessible = undefined !== null = true
      expect(result.current.isRegistrationKeyAccessible).toBe(true);
    });

    it('should handle account with valid registration key', () => {
      const mockAccount = createMockAccountWithValidKey();
      const mockUseMyJazz = vi.mocked(useMyJazz);
      mockUseMyJazz.mockReturnValue(createMockUseMyJazzReturn(mockAccount, true));

      const { result } = renderHook(() => useRegistrationKey());

      expect(result.current.isAccountReady).toBe(true);
      expect(result.current.hasRegistrationKey).toBe(true);
      expect(result.current.isKeyExpired).toBe(false);
      expect(result.current.isRegistrationKeyLoading).toBe(false);
      expect(result.current.isRegistrationKeyAccessible).toBe(true);
    });

    it('should handle account with expired registration key', () => {
      const mockAccount = createMockAccountWithExpiredKey();
      const mockUseMyJazz = vi.mocked(useMyJazz);
      mockUseMyJazz.mockReturnValue(createMockUseMyJazzReturn(mockAccount, true));

      const { result } = renderHook(() => useRegistrationKey());

      expect(result.current.isAccountReady).toBe(true);
      expect(result.current.hasRegistrationKey).toBe(true);
      expect(result.current.isKeyExpired).toBe(true);
      expect(result.current.isRegistrationKeyLoading).toBe(false);
      expect(result.current.isRegistrationKeyAccessible).toBe(true);
    });
  });

  describe('Integration with Jazz Account', () => {
    it('should handle getValidKey when account is not ready', async () => {
      const mockUseMyJazz = vi.mocked(useMyJazz);
      mockUseMyJazz.mockReturnValue(createMockUseMyJazzReturn(null, false));

      const { result } = renderHook(() => useRegistrationKey());

      await act(async () => {
        const keyResult = await result.current.getValidKey();
        expect(keyResult).toBeNull();
      });
    });

    it('should return existing valid key', async () => {
      const mockAccount = createMockAccountWithValidKey();
      const mockUseMyJazz = vi.mocked(useMyJazz);
      mockUseMyJazz.mockReturnValue(createMockUseMyJazzReturn(mockAccount, true));

      const { result } = renderHook(() => useRegistrationKey());

      await act(async () => {
        const keyResult = await result.current.getValidKey();
        expect(keyResult).toEqual({
          key: 'valid-test-key',
          registrationKeyId: 'test-key-id'
        });
      });
    });
  });
});
