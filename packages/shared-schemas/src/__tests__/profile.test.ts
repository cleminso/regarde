/**
 * Focused tests for JazzAppProfile - testing YOUR business logic, not Jazz framework
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JazzAppProfile, validateJazzAppProfile } from '../profile.js';
import { UserHandle } from '../nickname.js';
import { setupJazzTestEnvironment, createTestOnboardingAccount } from '../test-utils/jazz-setup.js';
import { createTestProfile, createTestUserHandle } from '../test-utils/fixtures.js';

describe('JazzAppProfile - Application Logic', () => {
  beforeEach(async () => {
    await setupJazzTestEnvironment();
    await createTestOnboardingAccount({
      isCurrentActiveAccount: true,
      name: 'Test User',
    });
  });

  it('should create profile with your specific data structure', () => {
    // Test YOUR specific profile structure and data patterns
    const profile = JazzAppProfile.create({
      name: 'John Doe',
      userHandle: createTestUserHandle({ nickname: 'johndoe' }),
      bio: 'Software engineer',
      projects: [
        {
          title: 'Project Alpha',
          year: '2024',
          client: 'Tech Corp',
          description: 'Revolutionary project',
        },
      ],
      workExp: [
        {
          title: 'Senior Engineer',
          from: '2020',
          company: 'Innovation Inc',
          description: 'Led development',
        },
      ],
      socialLinks: {
        github: 'https://github.com/johndoe',
        website: 'https://johndoe.dev',
      },
      version: 1,
    });

    // Verify YOUR specific data structure works
    expect(profile.name).toBe('John Doe');
    expect(profile.projects?.[0]?.title).toBe('Project Alpha');
    expect(profile.workExp?.[0]?.company).toBe('Innovation Inc');
    expect(profile.socialLinks?.github).toBe('https://github.com/johndoe');
  });

  it('should validate correct profiles (YOUR business logic)', () => {
    const validProfile = createTestProfile({
      name: 'Valid User',
      nickname: 'validuser',
    });

    const result = validateJazzAppProfile(validProfile);

    expect(result.isValid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('should reject invalid profiles (YOUR validation rules)', () => {
    // Test YOUR specific validation rules
    const invalidProfiles = [
      {
        profile: JazzAppProfile.create({
          name: '', // YOUR rule: name required
          userHandle: createTestUserHandle({ isActive: true }),
          version: 1,
        }),
        expectedError: 'Name must be present and non-empty',
      },
      {
        profile: JazzAppProfile.create({
          name: 'Valid Name',
          userHandle: createTestUserHandle({ isActive: false }), // YOUR rule: handle must be active
          version: 1,
        }),
        expectedError: 'Nickname must be active',
      },
      {
        profile: JazzAppProfile.create({
          name: 'Valid Name',
          userHandle: createTestUserHandle({ nickname: '' }), // YOUR rule: nickname required
          version: 1,
        }),
        expectedError: 'Nickname must be non-empty',
      },
    ];

    invalidProfiles.forEach(({ profile, expectedError }) => {
      const result = validateJazzAppProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain(expectedError);
    });
  });

  it('should handle complex nested data for your use case', () => {
    // Test YOUR specific complex data patterns
    const complexProfile = JazzAppProfile.create({
      name: 'Complex User',
      userHandle: createTestUserHandle({ nickname: 'complexuser' }),
      projects: [
        { title: 'Project 1', year: '2024' },
        { title: 'Project 2', year: '2023' },
      ],
      workExp: [
        { title: 'Engineer', company: 'Corp A', from: '2020' },
        { title: 'Senior Engineer', company: 'Corp B', from: '2022' },
      ],
      version: 1,
    });

    // Verify YOUR complex data structure works as expected
    expect(complexProfile.projects?.length).toBe(2);
    expect(complexProfile.workExp?.length).toBe(2);
    expect(complexProfile.projects?.[0]?.title).toBe('Project 1');
    expect(complexProfile.workExp?.[1]?.title).toBe('Senior Engineer');
  });
});
