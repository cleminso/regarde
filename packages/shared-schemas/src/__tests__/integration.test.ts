/**
 * Integration tests - testing how YOUR schemas work together
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JazzAppProfile, validateJazzAppProfile } from '../profile.js';
import { UserHandle, setNicknameFromRegistry } from '../nickname.js';
import { setupJazzTestEnvironment, createTestOnboardingAccount } from '../test-utils/jazz-setup.js';
import { createTestProfile, createTestUserHandle } from '../test-utils/fixtures.js';

describe('Integration Tests - Your Application Logic', () => {
  beforeEach(async () => {
    await setupJazzTestEnvironment();
    await createTestOnboardingAccount({
      isCurrentActiveAccount: true,
      name: 'Test User',
    });
  });

  it('should integrate JazzAppProfile with UserHandle (YOUR schemas)', () => {
    // Test how YOUR schemas work together
    const userHandle = createTestUserHandle({
      nickname: 'integrationuser',
      isActive: true,
    });

    const profile = JazzAppProfile.create({
      name: 'Integration User',
      userHandle,
      bio: 'Testing schema integration',
      version: 1,
    });

    // Verify YOUR schemas integrate correctly
    expect(profile.userHandle.nickname).toBe('integrationuser');
    expect(profile.userHandle.isActive).toBe(true);
    expect(profile.name).toBe('Integration User');
  });

  it('should validate profiles with integrated schemas (YOUR validation)', () => {
    // Test YOUR validation logic across schemas
    const validProfile = createTestProfile({
      name: 'Valid Integration User',
      nickname: 'validuser',
    });

    const result = validateJazzAppProfile(validProfile);
    expect(result.isValid).toBe(true);

    // Test invalid integration
    const invalidProfile = JazzAppProfile.create({
      name: 'Invalid User',
      userHandle: createTestUserHandle({ isActive: false }), // Invalid: inactive
      version: 1,
    });

    const invalidResult = validateJazzAppProfile(invalidProfile);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.message).toContain('Nickname must be active');
  });

  it('should handle nickname registration workflow (YOUR business process)', () => {
    // Test YOUR specific business workflow
    const userHandle = createTestUserHandle({
      nickname: '',
      isActive: false,
    });

    // Initial state
    expect(userHandle.isActive).toBe(false);
    expect(userHandle.nickname).toBe('');

    // YOUR business logic: register nickname
    setNicknameFromRegistry(userHandle, 'registereduser');

    // Verify YOUR workflow result
    expect(userHandle.nickname).toBe('registereduser');
    expect(userHandle.isActive).toBe(true);

    // Test that profile validation now passes
    const profile = JazzAppProfile.create({
      name: 'Registered User',
      userHandle,
      version: 1,
    });

    const result = validateJazzAppProfile(profile);
    expect(result.isValid).toBe(true);
  });
});
