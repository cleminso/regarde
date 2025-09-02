/**
 * Focused tests for nickname registration services - testing business logic only
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerNicknameWithServer } from '../services';

// Mock the API and utilities
vi.mock('../utils', () => ({
  isPlaceholderNickname: vi.fn(),
}));

vi.mock('../../api/nickname', () => ({
  registerNickname: vi.fn(),
}));

import { isPlaceholderNickname } from '../utils';
import { registerNickname } from '../../api/nickname';

const mockIsPlaceholderNickname = vi.mocked(isPlaceholderNickname);
const mockRegisterNickname = vi.mocked(registerNickname);

describe('Nickname Registration Service', () => {
  const mockGetRegistrationKey = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRegistrationKey.mockResolvedValue('mock-key');
    mockRegisterNickname.mockResolvedValue(undefined);
  });

  describe('registerNicknameWithServer', () => {
    const baseParams = {
      nickname: 'new-nickname',
      accountId: 'account-123',
      getRegistrationKey: mockGetRegistrationKey,
    };

    it('should register new nickname without oldNickname when oldNickname is placeholder', async () => {
      // Test new registration flow
      mockIsPlaceholderNickname.mockReturnValue(true);

      await registerNicknameWithServer({
        ...baseParams,
        oldNickname: 'your-nickname',
      });

      expect(mockIsPlaceholderNickname).toHaveBeenCalledWith('your-nickname');
      expect(mockRegisterNickname).toHaveBeenCalledWith(
        {
          nickname: 'new-nickname',
          jazzAccountID: 'account-123',
          oldNickname: undefined, // Should not send placeholder
        },
        mockGetRegistrationKey
      );
    });

    it('should register with oldNickname when oldNickname is not placeholder', async () => {
      // Test update/swap flow
      mockIsPlaceholderNickname.mockReturnValue(false);

      await registerNicknameWithServer({
        ...baseParams,
        oldNickname: 'existing-nickname',
      });

      expect(mockIsPlaceholderNickname).toHaveBeenCalledWith('existing-nickname');
      expect(mockRegisterNickname).toHaveBeenCalledWith(
        {
          nickname: 'new-nickname',
          jazzAccountID: 'account-123',
          oldNickname: 'existing-nickname', // Should send real nickname
        },
        mockGetRegistrationKey
      );
    });

    it('should register without oldNickname when oldNickname is undefined', async () => {
      // Test new registration without old nickname
      await registerNicknameWithServer(baseParams);

      expect(mockIsPlaceholderNickname).not.toHaveBeenCalled();
      expect(mockRegisterNickname).toHaveBeenCalledWith(
        {
          nickname: 'new-nickname',
          jazzAccountID: 'account-123',
          oldNickname: undefined,
        },
        mockGetRegistrationKey
      );
    });

    it('should register without oldNickname when oldNickname is empty', async () => {
      // Test empty string handling - empty string is falsy, so isPlaceholderNickname won't be called
      await registerNicknameWithServer({
        ...baseParams,
        oldNickname: '',
      });

      expect(mockIsPlaceholderNickname).not.toHaveBeenCalled(); // Empty string is falsy
      expect(mockRegisterNickname).toHaveBeenCalledWith(
        {
          nickname: 'new-nickname',
          jazzAccountID: 'account-123',
          oldNickname: undefined,
        },
        mockGetRegistrationKey
      );
    });

    it('should handle registration key function correctly', async () => {
      // Test that registration key function is passed through
      const customKeyFunction = vi.fn().mockResolvedValue('custom-key');

      await registerNicknameWithServer({
        ...baseParams,
        getRegistrationKey: customKeyFunction,
      });

      expect(mockRegisterNickname).toHaveBeenCalledWith(
        expect.any(Object),
        customKeyFunction
      );
    });

    it('should propagate API errors', async () => {
      // Test error handling
      const apiError = new Error('Registration failed');
      mockRegisterNickname.mockRejectedValue(apiError);

      await expect(registerNicknameWithServer(baseParams)).rejects.toThrow('Registration failed');
    });

    it('should handle registration key errors', async () => {
      // Test registration key function errors - the error comes from registerNickname when it calls getRegistrationKey
      const keyError = new Error('Key generation failed');
      mockRegisterNickname.mockRejectedValue(keyError); // registerNickname rejects when getRegistrationKey fails

      await expect(registerNicknameWithServer(baseParams)).rejects.toThrow('Key generation failed');
    });
  });

  describe('Business Logic Decision Making', () => {
    it('should make correct decisions for different nickname scenarios', async () => {
      const testCases = [
        {
          scenario: 'New user registration',
          oldNickname: undefined,
          isPlaceholder: false, // Not called
          expectedOldNickname: undefined,
          description: 'No old nickname provided',
        },
        {
          scenario: 'Default placeholder replacement',
          oldNickname: 'your-nickname',
          isPlaceholder: true,
          expectedOldNickname: undefined,
          description: 'Replace default placeholder',
        },
        {
          scenario: 'Empty nickname replacement',
          oldNickname: '',
          isPlaceholder: false, // Not called because empty string is falsy
          expectedOldNickname: undefined,
          description: 'Replace empty nickname',
        },
        {
          scenario: 'Whitespace nickname replacement',
          oldNickname: '   ',
          isPlaceholder: true, // Called because whitespace string is truthy
          expectedOldNickname: undefined,
          description: 'Replace whitespace-only nickname',
        },
        {
          scenario: 'Existing nickname update',
          oldNickname: 'existing-user',
          isPlaceholder: false,
          expectedOldNickname: 'existing-user',
          description: 'Update existing nickname',
        },
        {
          scenario: 'Nickname swap',
          oldNickname: 'user123',
          isPlaceholder: false,
          expectedOldNickname: 'user123',
          description: 'Swap to new nickname',
        },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();

        if (testCase.oldNickname !== undefined && testCase.oldNickname) {
          // Only mock if oldNickname is truthy (will be called)
          mockIsPlaceholderNickname.mockReturnValue(testCase.isPlaceholder);
        }

        await registerNicknameWithServer({
          nickname: 'new-nickname',
          accountId: 'account-123',
          oldNickname: testCase.oldNickname,
          getRegistrationKey: mockGetRegistrationKey,
        });

        expect(mockRegisterNickname).toHaveBeenCalledWith(
          expect.objectContaining({
            oldNickname: testCase.expectedOldNickname,
          }),
          mockGetRegistrationKey
        );
      }
    });

    it('should maintain consistent parameter structure', async () => {
      // Test that all required parameters are always included
      await registerNicknameWithServer({
        nickname: 'test-nickname',
        accountId: 'test-account',
        getRegistrationKey: mockGetRegistrationKey,
      });

      const callArgs = mockRegisterNickname.mock.calls[0][0];
      
      expect(callArgs).toHaveProperty('nickname');
      expect(callArgs).toHaveProperty('jazzAccountID');
      expect(callArgs).toHaveProperty('oldNickname');
      
      expect(callArgs.nickname).toBe('test-nickname');
      expect(callArgs.jazzAccountID).toBe('test-account');
    });

    it('should handle edge cases in nickname processing', async () => {
      const edgeCases = [
        { oldNickname: null as any, shouldCallPlaceholderCheck: false }, // Falsy
        { oldNickname: 0 as any, shouldCallPlaceholderCheck: false }, // Falsy
        { oldNickname: false as any, shouldCallPlaceholderCheck: false }, // Falsy
        { oldNickname: [] as any, shouldCallPlaceholderCheck: true }, // Truthy (empty array)
        { oldNickname: {} as any, shouldCallPlaceholderCheck: true }, // Truthy (empty object)
      ];

      for (const edgeCase of edgeCases) {
        vi.clearAllMocks();
        mockIsPlaceholderNickname.mockReturnValue(true);

        await registerNicknameWithServer({
          nickname: 'new-nickname',
          accountId: 'account-123',
          oldNickname: edgeCase.oldNickname,
          getRegistrationKey: mockGetRegistrationKey,
        });

        if (edgeCase.shouldCallPlaceholderCheck) {
          expect(mockIsPlaceholderNickname).toHaveBeenCalledWith(edgeCase.oldNickname);
        } else {
          expect(mockIsPlaceholderNickname).not.toHaveBeenCalled();
        }

        expect(mockRegisterNickname).toHaveBeenCalledWith(
          expect.objectContaining({
            oldNickname: undefined, // Edge cases should result in undefined
          }),
          mockGetRegistrationKey
        );
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete registration requests efficiently', async () => {
      const startTime = performance.now();

      // Simulate multiple registration requests
      const requests = Array.from({ length: 10 }, (_, i) =>
        registerNicknameWithServer({
          nickname: `user${i}`,
          accountId: `account${i}`,
          getRegistrationKey: mockGetRegistrationKey,
        })
      );

      await Promise.all(requests);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete 10 registrations quickly (excluding network time)
      expect(executionTime).toBeLessThan(50); // Less than 50ms for business logic
    });

    it('should handle concurrent registration attempts', async () => {
      // Test concurrent registrations with different scenarios
      const concurrentRequests = [
        registerNicknameWithServer({
          nickname: 'user1',
          accountId: 'account1',
          oldNickname: 'your-nickname',
          getRegistrationKey: mockGetRegistrationKey,
        }),
        registerNicknameWithServer({
          nickname: 'user2',
          accountId: 'account2',
          oldNickname: 'existing-user',
          getRegistrationKey: mockGetRegistrationKey,
        }),
        registerNicknameWithServer({
          nickname: 'user3',
          accountId: 'account3',
          getRegistrationKey: mockGetRegistrationKey,
        }),
      ];

      mockIsPlaceholderNickname
        .mockReturnValueOnce(true)  // 'your-nickname' is placeholder
        .mockReturnValueOnce(false); // 'existing-user' is not placeholder

      await Promise.all(concurrentRequests);

      expect(mockRegisterNickname).toHaveBeenCalledTimes(3);
      expect(mockIsPlaceholderNickname).toHaveBeenCalledTimes(2);
    });
  });
});
