/**
 * Simple tests for utility functions - testing business logic only
 */

import { describe, it, expect } from 'vitest';
import { createMockProfile } from '#/test-utils';

// Simple utility functions to test business logic
function validateProfileData(profile: any) {
  const errors: string[] = [];

  if (!profile.name || profile.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!profile.userHandle?.nickname || profile.userHandle.nickname.trim() === '') {
    errors.push('Nickname is required');
  }

  if (!profile.userHandle?.isActive) {
    errors.push('Nickname must be active');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function formatProfileForDisplay(profile: any) {
  return {
    displayName: profile.name || 'Unknown User',
    nickname: profile.userHandle?.nickname || 'nickname-not-set',
    bio: profile.bio || '',
    hasAvatar: !!profile.avatarImage,
    projectCount: profile.projects?.length || 0,
    workExpCount: profile.workExp?.length || 0,
  };
}

describe('Profile Utility Functions - Business Logic', () => {
  it('should validate complete profile data', () => {
    // Test validation logic
    const validProfile = createMockProfile({
      name: 'John Doe',
      userHandle: {
        nickname: 'johndoe',
        isActive: true,
      },
    });

    const result = validateProfileData(validProfile);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should catch validation errors', () => {
    // Test validation catches errors
    const invalidProfile = createMockProfile({
      name: '',
      userHandle: {
        nickname: '',
        isActive: false,
      },
    });

    const result = validateProfileData(invalidProfile);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Name is required');
    expect(result.errors).toContain('Nickname is required');
    expect(result.errors).toContain('Nickname must be active');
  });

  it('should format profile for display correctly', () => {
    // Test display formatting logic
    const profile = createMockProfile({
      name: 'Jane Smith',
      bio: 'Software engineer',
      userHandle: {
        nickname: 'janesmith',
        isActive: true,
      },
      projects: [
        { title: 'Project 1' },
        { title: 'Project 2' },
      ],
      workExp: [
        { title: 'Engineer' },
      ],
    });

    const formatted = formatProfileForDisplay(profile);

    expect(formatted.displayName).toBe('Jane Smith');
    expect(formatted.nickname).toBe('janesmith');
    expect(formatted.bio).toBe('Software engineer');
    expect(formatted.projectCount).toBe(2);
    expect(formatted.workExpCount).toBe(1);
  });

  it('should handle missing profile data gracefully', () => {
    // Test error handling
    const incompleteProfile = createMockProfile({
      name: 'Incomplete User',
      bio: '',
      userHandle: {
        nickname: '',
        isActive: false,
      },
    });

    const formatted = formatProfileForDisplay(incompleteProfile);

    expect(formatted.displayName).toBe('Incomplete User');
    expect(formatted.nickname).toBe('nickname-not-set');
    expect(formatted.bio).toBe('');
    expect(formatted.projectCount).toBe(0);
    expect(formatted.workExpCount).toBe(0);
  });
});
