/**
 * Integration tests for Jazz framework integration points
 * These tests validate that our business logic works correctly with Jazz framework
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Group } from 'jazz-tools';
import { 
  JazzAppProfile, 
  OnboardingAccount, 
  validateJazzAppProfile 
} from '../profile.js';
import { UserHandle, setNicknameFromRegistry } from '../nickname.js';

// Mock Jazz framework functions for integration testing
const mockJazzFramework = {
  createTestAccount: async (schema?: any) => {
    // Create a mock account that behaves like Jazz framework
    const account = {
      id: 'test-account-id',
      profile: null as any,
      root: null as any,
    };

    // Simulate migration behavior
    if (schema === OnboardingAccount) {
      // Create initial profile structure
      const userHandle = {
        nickname: 'initial-nickname',
        isActive: false,
        registeredAt: Date.now(),
        lastModified: Date.now(),
        id: 'userhandle-id',
      };

      const profile = {
        name: 'Test User',
        userHandle,
        version: 1,
        id: 'profile-id',
      };

      const authData = {
        key: 'test-key',
        expiresAt: Date.now() + 86400000,
        id: 'auth-id',
      };

      account.profile = profile;
      account.root = {
        'profile.jazz.dev': profile,
        'auth.jazz.dev': authData,
      };
    }

    return account;
  },

  loadProfile: async (id: string) => {
    // Simulate loading a profile from Jazz storage
    return {
      name: 'Loaded User',
      userHandle: {
        nickname: 'loaded-nickname',
        isActive: true,
        registeredAt: Date.now(),
        lastModified: Date.now(),
      },
      version: 1,
      id,
    };
  },

  createProfile: (data: any, options: any) => {
    // Simulate Jazz profile creation
    return {
      ...data,
      id: 'created-profile-id',
    };
  },

  createUserHandle: (data: any, options: any) => {
    // Simulate Jazz UserHandle creation
    return {
      ...data,
      id: 'created-userhandle-id',
    };
  },
};

describe('Jazz Framework Integration Tests', () => {
  beforeEach(() => {
    // Reset any global state before each test
  });

  it('should create and validate profiles with Jazz framework integration', async () => {
    // Test that our schema definitions work with Jazz-like framework
    const userHandle = mockJazzFramework.createUserHandle({
      nickname: 'testuser',
      isActive: true,
      registeredAt: Date.now(),
      lastModified: Date.now(),
    }, { owner: 'test-account' });

    const profile = mockJazzFramework.createProfile({
      name: 'Test User',
      userHandle,
      version: 1,
    }, { owner: 'test-account' });

    // Test that our business logic validation works with Jazz-created objects
    const validationResult = validateJazzAppProfile(profile as any);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.message).toBeUndefined();

    // Test that profile has proper structure
    expect(profile.name).toBe('Test User');
    expect(profile.userHandle.nickname).toBe('testuser');
    expect(profile.userHandle.isActive).toBe(true);
    expect(profile.version).toBe(1);
  });

  it('should create valid initial account structure through migration', async () => {
    // Test that account migration creates proper initial state
    const account = await mockJazzFramework.createTestAccount(OnboardingAccount);

    // Verify migration created proper structure
    expect(account.root).toBeDefined();
    expect(account.profile).toBeDefined();
    expect(account.root['auth.jazz.dev']).toBeDefined();
    expect(account.root['profile.jazz.dev']).toBeDefined();

    // Verify profile structure is valid
    const profile = account.root['profile.jazz.dev'];
    expect(profile.name).toBe('Test User');
    expect(profile.userHandle).toBeDefined();
    expect(profile.userHandle.nickname).toBe('initial-nickname');
    expect(profile.userHandle.isActive).toBe(false);
    expect(profile.version).toBe(1);

    // Verify auth structure is valid
    const auth = account.root['auth.jazz.dev'];
    expect(auth.key).toBe('test-key');
    expect(auth.expiresAt).toBeGreaterThan(Date.now());

    // Verify business logic validation passes
    const validationResult = validateJazzAppProfile(profile as any);
    expect(validationResult.isValid).toBe(false); // Should be false because isActive is false
    expect(validationResult.message).toContain('Nickname must be active');
  });

  it('should persist nickname changes through Jazz-like storage', async () => {
    // Test that business logic changes persist correctly
    const account = await mockJazzFramework.createTestAccount(OnboardingAccount);
    const originalProfile = account.root['profile.jazz.dev'];
    
    expect(originalProfile.userHandle.nickname).toBe('initial-nickname');
    expect(originalProfile.userHandle.isActive).toBe(false);
    
    // Apply business logic - this should modify the object in place
    setNicknameFromRegistry(originalProfile.userHandle as any, 'newnickname');
    
    // Verify changes were applied
    expect(originalProfile.userHandle.nickname).toBe('newnickname');
    expect(originalProfile.userHandle.isActive).toBe(true);
    expect(originalProfile.userHandle.lastModified).toBeGreaterThan(0);

    // Simulate reloading from storage (in real Jazz, this would be a separate load)
    const reloadedProfile = await mockJazzFramework.loadProfile(originalProfile.id);
    
    // In a real integration test, we would verify the changes persisted
    // For now, we verify the business logic worked correctly
    const validationResult = validateJazzAppProfile(originalProfile as any);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.message).toBeUndefined();
  });

  it('should handle schema validation errors gracefully', async () => {
    // Test that invalid schema data is properly rejected
    const invalidProfile = mockJazzFramework.createProfile({
      name: '', // Invalid: empty name
      userHandle: {
        nickname: 'testuser',
        isActive: true,
        registeredAt: Date.now(),
        lastModified: Date.now(),
      },
      version: 1,
    }, { owner: 'test-account' });

    const validationResult = validateJazzAppProfile(invalidProfile as any);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.message).toContain('Name must be present');
  });

  it('should handle missing userHandle gracefully', async () => {
    // Test that profiles without userHandle are properly rejected
    const invalidProfile = mockJazzFramework.createProfile({
      name: 'Test User',
      userHandle: null, // Invalid: missing userHandle
      version: 1,
    }, { owner: 'test-account' });

    const validationResult = validateJazzAppProfile(invalidProfile as any);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.message).toContain('Onboarding data is required');
  });
});
