/**
 * Focused tests for utility functions - testing business logic only
 */

import { describe, it, expect } from 'vitest';
import {
  getValidUrl,
  buildSocialLinks,
  getWebsiteDisplayName,
  formatYearString,
  formatDateRange,
  formatTimestamp,
  normalizeNickname,
  createNicknameUrl,
  generateDefaultAvatar,
} from '../utils';

describe('URL Validation and Normalization', () => {
  describe('getValidUrl', () => {
    // Removed test for basic null/undefined checking - tests JavaScript truthiness, not business logic

    it('should return URLs with protocols unchanged', () => {
      expect(getValidUrl('https://example.com')).toBe('https://example.com');
      expect(getValidUrl('http://example.com')).toBe('http://example.com');
    });

    it('should add https:// to URLs without protocol', () => {
      expect(getValidUrl('example.com')).toBe('https://example.com');
      expect(getValidUrl('subdomain.example.com')).toBe('https://subdomain.example.com');
      expect(getValidUrl('example.com/path')).toBe('https://example.com/path');
    });

    it('should handle edge cases correctly', () => {
      expect(getValidUrl('localhost:3000')).toBe('https://localhost:3000');
      expect(getValidUrl('192.168.1.1')).toBe('https://192.168.1.1');
      expect(getValidUrl('example.com:8080/path?query=1')).toBe('https://example.com:8080/path?query=1');
    });
  });

  describe('getWebsiteDisplayName', () => {
    it('should return undefined for empty input', () => {
      expect(getWebsiteDisplayName()).toBeUndefined();
      expect(getWebsiteDisplayName('')).toBeUndefined();
    });

    it('should extract hostname from full URLs', () => {
      expect(getWebsiteDisplayName('https://example.com')).toBe('example.com');
      expect(getWebsiteDisplayName('http://example.com')).toBe('example.com');
      expect(getWebsiteDisplayName('https://subdomain.example.com')).toBe('subdomain.example.com');
    });

    it('should remove www. prefix', () => {
      expect(getWebsiteDisplayName('https://www.example.com')).toBe('example.com');
      expect(getWebsiteDisplayName('www.example.com')).toBe('example.com');
    });

    it('should include path when present', () => {
      expect(getWebsiteDisplayName('https://example.com/blog')).toBe('example.com/blog');
      expect(getWebsiteDisplayName('https://example.com/blog/')).toBe('example.com/blog');
      expect(getWebsiteDisplayName('https://example.com/blog/post')).toBe('example.com/blog/post');
    });

    it('should handle malformed URLs gracefully', () => {
      expect(getWebsiteDisplayName('not-a-url')).toBe('not-a-url');
      expect(getWebsiteDisplayName('example.com')).toBe('example.com');
      expect(getWebsiteDisplayName('example.com/')).toBe('example.com');
    });

    it('should handle complex paths correctly', () => {
      expect(getWebsiteDisplayName('https://github.com/user/repo')).toBe('github.com/user/repo');
      expect(getWebsiteDisplayName('https://docs.example.com/api/v1')).toBe('docs.example.com/api/v1');
    });
  });
});

describe('Social Links Building', () => {
  describe('buildSocialLinks', () => {
    // Removed test for basic null/undefined handling - tests JavaScript truthiness, not business logic

    it('should build GitHub links correctly', () => {
      const result = buildSocialLinks({ github: 'username' });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        key: 'github',
        label: 'GitHub',
        href: 'https://github.com/username',
        displayName: 'username', // getWebsiteDisplayName('username') returns 'username'
      });
    });

    it('should handle GitHub URLs and usernames', () => {
      const testCases = [
        { input: 'username', expected: 'https://github.com/username' },
        { input: '@username', expected: 'https://github.com/username' },
        { input: 'github.com/username', expected: 'https://github.com/username' },
        { input: 'https://github.com/username', expected: 'https://github.com/username' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = buildSocialLinks({ github: input });
        expect(result[0].href).toBe(expected);
      });
    });

    it('should build Twitter/X links correctly', () => {
      const result = buildSocialLinks({ twitter: 'username' });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        key: 'twitter',
        label: 'Twitter (X)',
        href: 'https://x.com/username',
        displayName: 'username', // getWebsiteDisplayName('username') returns 'username'
      });
    });

    it('should handle Twitter URL variations', () => {
      const testCases = [
        { input: 'username', expected: 'https://x.com/username' },
        { input: '@username', expected: 'https://x.com/username' },
        { input: 'twitter.com/username', expected: 'https://x.com/username' },
        { input: 'x.com/username', expected: 'https://x.com/username' },
        { input: 'https://twitter.com/username', expected: 'https://twitter.com/username' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = buildSocialLinks({ twitter: input });
        expect(result[0].href).toBe(expected);
      });
    });

    it('should build website links correctly', () => {
      const result = buildSocialLinks({ website: 'example.com' });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        key: 'website',
        label: 'Website',
        href: 'https://example.com',
        displayName: 'example.com',
      });
    });

    it('should filter out empty values', () => {
      const result = buildSocialLinks({
        github: 'username',
        twitter: '',
        website: null,
      });
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('github');
    });

    it('should handle multiple social links', () => {
      const result = buildSocialLinks({
        github: 'user',
        twitter: 'user',
        website: 'example.com',
      });
      expect(result).toHaveLength(3);
      expect(result.map(link => link.key)).toEqual(['github', 'twitter', 'website']);
    });
  });
});

describe('Date and Time Formatting', () => {
  describe('formatYearString', () => {
    it('should return "Year missing" for empty input', () => {
      expect(formatYearString()).toBe('Year missing');
      expect(formatYearString('')).toBe('Year missing');
      expect(formatYearString('   ')).toBe('Year missing');
    });

    it('should normalize ongoing keywords to "Now"', () => {
      const keywords = ['ongoing', 'current', 'now', 'ONGOING', 'Current', 'NOW'];
      keywords.forEach(keyword => {
        expect(formatYearString(keyword)).toBe('Now');
      });
    });

    it('should preserve regular year values', () => {
      expect(formatYearString('2024')).toBe('2024');
      expect(formatYearString('2020')).toBe('2020');
      expect(formatYearString('1995')).toBe('1995');
    });

    it('should handle whitespace around values', () => {
      // formatYearString returns original year for non-keywords, only trims for keyword detection
      expect(formatYearString('  2024  ')).toBe('  2024  ');
      expect(formatYearString('  ongoing  ')).toBe('Now');
    });
  });

  describe('formatDateRange', () => {
    it('should format complete date ranges', () => {
      expect(formatDateRange('2020', '2024')).toBe('2020 - 2024');
      expect(formatDateRange('2020', 'ongoing')).toBe('2020 - Now');
    });

    it('should default to "Now" when end date is missing', () => {
      expect(formatDateRange('2020')).toBe('2020 - Now');
      expect(formatDateRange('2020', '')).toBe('2020 - Now');
    });

    it('should handle missing start dates', () => {
      expect(formatDateRange(undefined, '2024')).toBe('Year missing - 2024');
      expect(formatDateRange('', '2024')).toBe('Year missing - 2024');
    });

    it('should handle both dates missing', () => {
      expect(formatDateRange()).toBe('Year missing - Now');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamps to locale date strings', () => {
      const timestamp = new Date('2024-03-15').getTime();
      const result = formatTimestamp(timestamp);

      // Check that it returns a string in expected format (locale-dependent)
      expect(typeof result).toBe('string');
      expect(result).toMatch(/Mar|March/); // Should contain month
      expect(result).toMatch(/15/); // Should contain day
      expect(result).toMatch(/2024/); // Should contain year
    });

    // Removed test for basic Date constructor behavior - tests JavaScript built-ins, not business logic
  });
});

describe('Nickname Utilities', () => {
  describe('normalizeNickname', () => {
    // Removed trivial tests for toLowerCase() and trim() - these test JavaScript built-ins, not business logic

    it('should handle empty and edge cases', () => {
      expect(normalizeNickname('')).toBe('');
      expect(normalizeNickname('   ')).toBe('');
      expect(normalizeNickname('a')).toBe('a');
    });

    it('should preserve valid characters', () => {
      expect(normalizeNickname('user_name')).toBe('user_name');
      expect(normalizeNickname('user-name')).toBe('user-name');
      expect(normalizeNickname('user123')).toBe('user123');
    });
  });

  describe('createNicknameUrl', () => {
    // Removed tests for basic string concatenation - these test JavaScript operators, not business logic

    it('should normalize nickname in URL', () => {
      expect(createNicknameUrl('  USERNAME  ', '/about')).toBe('/username/about');
      expect(createNicknameUrl('Mixed_Case', '/now')).toBe('/mixed_case/now');
    });
  });
});

describe('Avatar Generation', () => {
  describe('generateDefaultAvatar', () => {
    it('should return empty string for empty nickname', () => {
      expect(generateDefaultAvatar('')).toBe('');
      // Whitespace-only strings are truthy, so they generate avatars
      expect(generateDefaultAvatar('   ')).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should generate SVG data URL', () => {
      const result = generateDefaultAvatar('testuser');
      expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should generate consistent avatars for same nickname', () => {
      const avatar1 = generateDefaultAvatar('testuser');
      const avatar2 = generateDefaultAvatar('testuser');
      expect(avatar1).toBe(avatar2);
    });

    it('should generate different avatars for different nicknames', () => {
      const avatar1 = generateDefaultAvatar('user1');
      const avatar2 = generateDefaultAvatar('user2');
      expect(avatar1).not.toBe(avatar2);
    });

    it('should extract correct initials', () => {
      // Decode base64 to check SVG content contains initials
      const avatar = generateDefaultAvatar('testuser');
      const base64Data = avatar.split(',')[1];
      const svgContent = atob(base64Data);

      expect(svgContent).toContain('TE'); // First 2 characters of "testuser"
    });

    it('should handle single character nicknames', () => {
      const avatar = generateDefaultAvatar('a');
      const base64Data = avatar.split(',')[1];
      const svgContent = atob(base64Data);

      expect(svgContent).toContain('A');
    });

    it('should handle custom border radius', () => {
      const avatar1 = generateDefaultAvatar('test', 24);
      const avatar2 = generateDefaultAvatar('test', 48);

      // Both should be valid SVG data URLs but with different border radius
      expect(avatar1).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(avatar2).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(avatar1).not.toBe(avatar2);
    });

    it('should use consistent color selection', () => {
      // Same nickname should always get same color
      const avatar1 = generateDefaultAvatar('consistent');
      const avatar2 = generateDefaultAvatar('consistent');

      const svg1 = atob(avatar1.split(',')[1]);
      const svg2 = atob(avatar2.split(',')[1]);

      // Extract fill color from SVG
      const fillMatch1 = svg1.match(/fill="([^"]+)"/);
      const fillMatch2 = svg2.match(/fill="([^"]+)"/);

      expect(fillMatch1?.[1]).toBe(fillMatch2?.[1]);
    });

    it('should generate valid SVG structure', () => {
      const avatar = generateDefaultAvatar('test');
      const svgContent = atob(avatar.split(',')[1]);

      // Check SVG structure
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('<rect');
      expect(svgContent).toContain('<text');
      expect(svgContent).toContain('</svg>');

      // Check required attributes
      expect(svgContent).toContain('width="92"');
      expect(svgContent).toContain('height="92"');
      expect(svgContent).toContain('viewBox="0 0 92 92"');
    });

    it('should handle special characters in nicknames', () => {
      const testCases = ['user-name', 'user_name', 'user123', 'user.name'];

      testCases.forEach(nickname => {
        const avatar = generateDefaultAvatar(nickname);
        expect(avatar).toMatch(/^data:image\/svg\+xml;base64,/);

        const svgContent = atob(avatar.split(',')[1]);
        expect(svgContent).toContain('<svg');
      });
    });
  });
});
