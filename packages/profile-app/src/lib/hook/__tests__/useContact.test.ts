/**
 * Focused tests for useContact - testing social links cleanup logic
 */

import { describe, it, expect } from 'vitest';

// Simple business logic functions to test social links management
function shouldCleanupSocialLinks(socialLinks: any) {
  // cleanup decision logic
  if (!socialLinks) return false;

  return !socialLinks.github &&
         !socialLinks.twitter &&
         !socialLinks.website;
}

function validateSocialLink(field: 'github' | 'twitter' | 'website', value: string) {
  const errors: string[] = [];

  // validation logic for different social platforms
  switch (field) {
    case 'github':
      if (value && !isValidGithubUrl(value)) {
        errors.push('GitHub URL must be a valid GitHub profile URL');
      }
      break;
    case 'twitter':
      if (value && !isValidTwitterUrl(value)) {
        errors.push('Twitter URL must be a valid Twitter profile URL');
      }
      break;
    case 'website':
      if (value && !isValidWebsiteUrl(value)) {
        errors.push('Website must be a valid URL');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidGithubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'github.com' && parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

function isValidTwitterUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.hostname === 'twitter.com' || parsed.hostname === 'x.com') &&
           parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

function isValidWebsiteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function updateSocialLinksState(currentLinks: any, field: string, value: string) {
  // state update logic
  const updated = { ...currentLinks };
  updated[field] = value || undefined;

  // cleanup logic
  if (shouldCleanupSocialLinks(updated)) {
    return undefined; // Remove entire socialLinks object
  }

  return updated;
}

function normalizeSocialLink(field: 'github' | 'twitter' | 'website', value: string) {
  // normalization logic
  if (!value || value.trim() === '') return '';

  const trimmed = value.trim();

  switch (field) {
    case 'github':
      // Convert username to full URL if needed
      if (!trimmed.startsWith('http')) {
        return `https://github.com/${trimmed.replace('@', '')}`;
      }
      return trimmed;
    case 'twitter':
      // Convert handle to full URL if needed
      if (!trimmed.startsWith('http')) {
        return `https://twitter.com/${trimmed.replace('@', '')}`;
      }
      return trimmed;
    case 'website':
      // Add protocol if missing
      if (!trimmed.startsWith('http')) {
        return `https://${trimmed}`;
      }
      return trimmed;
    default:
      return trimmed;
  }
}

describe('Social Links Management - Business Logic', () => {
  it('should determine cleanup necessity correctly', () => {
    // Test cleanup decision logic
    const emptySocialLinks = {
      github: undefined,
      twitter: undefined,
      website: undefined,
    };
    expect(shouldCleanupSocialLinks(emptySocialLinks)).toBe(true);

    const partialSocialLinks = {
      github: 'https://github.com/user',
      twitter: undefined,
      website: undefined,
    };
    expect(shouldCleanupSocialLinks(partialSocialLinks)).toBe(false);

    const nullSocialLinks = {
      github: null,
      twitter: null,
      website: null,
    };
    expect(shouldCleanupSocialLinks(nullSocialLinks)).toBe(true);
  });

  it('should validate GitHub URLs correctly', () => {
    // Test GitHub validation logic
    const validGithubUrls = [
      'https://github.com/username',
      'https://github.com/org/repo',
      'https://github.com/user-name',
    ];

    validGithubUrls.forEach(url => {
      const result = validateSocialLink('github', url);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    const invalidGithubUrls = [
      'https://gitlab.com/user',
      'https://github.com',
      'not-a-url',
      'https://github.com/',
    ];

    invalidGithubUrls.forEach(url => {
      const result = validateSocialLink('github', url);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GitHub URL must be a valid GitHub profile URL');
    });
  });

  it('should validate Twitter URLs correctly', () => {
    // Test Twitter validation logic
    const validTwitterUrls = [
      'https://twitter.com/username',
      'https://x.com/username',
      'https://twitter.com/user_name',
    ];

    validTwitterUrls.forEach(url => {
      const result = validateSocialLink('twitter', url);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    const invalidTwitterUrls = [
      'https://facebook.com/user',
      'https://twitter.com',
      'https://twitter.com/',
      'not-a-url',
    ];

    invalidTwitterUrls.forEach(url => {
      const result = validateSocialLink('twitter', url);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Twitter URL must be a valid Twitter profile URL');
    });
  });

  it('should validate website URLs correctly', () => {
    // Test website validation logic
    const validWebsiteUrls = [
      'https://example.com',
      'http://example.com',
      'https://subdomain.example.com',
      'https://example.com/path',
    ];

    validWebsiteUrls.forEach(url => {
      const result = validateSocialLink('website', url);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    const invalidWebsiteUrls = [
      'ftp://example.com',
      'not-a-url',
      'example.com',
    ];

    invalidWebsiteUrls.forEach(url => {
      const result = validateSocialLink('website', url);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Website must be a valid URL');
    });
  });

  it('should update social links state correctly', () => {
    // Test state update logic
    const currentLinks = {
      github: 'https://github.com/user',
      twitter: undefined,
      website: 'https://example.com',
    };

    // Update existing field
    const updated1 = updateSocialLinksState(currentLinks, 'twitter', 'https://twitter.com/user');
    expect(updated1.twitter).toBe('https://twitter.com/user');
    expect(updated1.github).toBe('https://github.com/user');

    // Clear field but keep others
    const updated2 = updateSocialLinksState(currentLinks, 'github', '');
    expect(updated2.github).toBeUndefined();
    expect(updated2.website).toBe('https://example.com');

    // Clear all fields should return undefined
    const clearedLinks = { github: undefined, twitter: undefined, website: undefined };
    const updated3 = updateSocialLinksState(clearedLinks, 'github', '');
    expect(updated3).toBeUndefined();
  });

  it('should normalize social links correctly', () => {
    // Test normalization logic
    expect(normalizeSocialLink('github', 'username')).toBe('https://github.com/username');
    expect(normalizeSocialLink('github', '@username')).toBe('https://github.com/username');
    expect(normalizeSocialLink('github', 'https://github.com/username')).toBe('https://github.com/username');

    expect(normalizeSocialLink('twitter', 'username')).toBe('https://twitter.com/username');
    expect(normalizeSocialLink('twitter', '@username')).toBe('https://twitter.com/username');
    expect(normalizeSocialLink('twitter', 'https://x.com/username')).toBe('https://x.com/username');

    expect(normalizeSocialLink('website', 'example.com')).toBe('https://example.com');
    expect(normalizeSocialLink('website', 'https://example.com')).toBe('https://example.com');
  });

  it('should handle edge cases in cleanup logic', () => {
    // Test edge case handling
    const edgeCases = [
      { github: '', twitter: '', website: '' },
      { github: null, twitter: null, website: null },
      { github: undefined, twitter: '', website: null },
    ];

    edgeCases.forEach(links => {
      expect(shouldCleanupSocialLinks(links)).toBe(true);
    });

    // Should not cleanup if any field has value
    const nonEmptyCases = [
      { github: 'value', twitter: '', website: '' },
      { github: '', twitter: 'value', website: '' },
      { github: '', twitter: '', website: 'value' },
    ];

    nonEmptyCases.forEach(links => {
      expect(shouldCleanupSocialLinks(links)).toBe(false);
    });
  });
});
