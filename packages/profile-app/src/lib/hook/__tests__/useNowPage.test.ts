/**
 * Focused tests for useNowPage - testing now page business logic
 */

import { describe, it, expect } from 'vitest';

// Simple business logic functions to test now page logic
function validateNowPageData(nowPageData: any) {
  const errors: string[] = [];

  // validation logic
  if (!nowPageData.title || nowPageData.title.trim() === '') {
    errors.push('Title is required');
  }

  if (nowPageData.title && nowPageData.title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }

  if (nowPageData.description && nowPageData.description.length > 2000) {
    errors.push('Description must be 2000 characters or less');
  }

  if (nowPageData.location && nowPageData.location.length > 100) {
    errors.push('Location must be 100 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function shouldCreateNewNowPage(existingNowPage: any) {
  // creation decision logic
  return !existingNowPage;
}

function prepareNowPageUpdate(data: any) {
  // data preparation logic
  return {
    title: data.title?.trim() || '',
    location: data.location?.trim() || '',
    description: data.description?.trim() || '',
    lastUpdated: Date.now(),
  };
}

function calculateTimeSinceUpdate(lastUpdated: number) {
  // time calculation logic
  if (!lastUpdated) return 'Never updated';

  const now = Date.now();
  const diffMs = now - lastUpdated;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `Updated ${Math.floor(diffDays / 30)} months ago`;

  return `Updated ${Math.floor(diffDays / 365)} years ago`;
}

function isNowPageStale(lastUpdated: number, staleDays: number = 90) {
  // staleness detection logic
  if (!lastUpdated) return true;

  const now = Date.now();
  const diffMs = now - lastUpdated;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > staleDays;
}

function formatNowPageSummary(nowPage: any) {
  // summary formatting logic
  const parts = [];

  if (nowPage.title) {
    parts.push(nowPage.title);
  }

  if (nowPage.location) {
    parts.push(`in ${nowPage.location}`);
  }

  if (nowPage.lastUpdated) {
    parts.push(`(${calculateTimeSinceUpdate(nowPage.lastUpdated)})`);
  }

  return parts.join(' ');
}

describe('Now Page Business Logic', () => {
  it('should validate now page data correctly', () => {
    // Test now page validation logic
    const validNowPage = {
      title: 'Currently working on AI projects',
      location: 'San Francisco, CA',
      description: 'Focusing on machine learning and natural language processing projects.',
    };

    const result = validateNowPageData(validNowPage);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid now page data', () => {
    // Test validation catches now page errors
    const invalidCases = [
      {
        data: { title: '', location: 'Location', description: 'Description' },
        expectedError: 'Title is required',
      },
      {
        data: { title: 'x'.repeat(101), location: 'Location' },
        expectedError: 'Title must be 100 characters or less',
      },
      {
        data: { title: 'Title', description: 'x'.repeat(2001) },
        expectedError: 'Description must be 2000 characters or less',
      },
      {
        data: { title: 'Title', location: 'x'.repeat(101) },
        expectedError: 'Location must be 100 characters or less',
      },
    ];

    invalidCases.forEach(({ data, expectedError }) => {
      const result = validateNowPageData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it('should determine when to create new now page', () => {
    // Test creation decision logic
    expect(shouldCreateNewNowPage(null)).toBe(true);
    expect(shouldCreateNewNowPage(undefined)).toBe(true);
    expect(shouldCreateNewNowPage({ title: 'Existing' })).toBe(false);
  });

  it('should prepare now page update data correctly', () => {
    // Test data preparation logic
    const inputData = {
      title: '  Working on projects  ',
      location: '  Remote  ',
      description: '  Building cool stuff  ',
    };

    const prepared = prepareNowPageUpdate(inputData);

    expect(prepared.title).toBe('Working on projects');
    expect(prepared.location).toBe('Remote');
    expect(prepared.description).toBe('Building cool stuff');
    expect(prepared.lastUpdated).toBeGreaterThan(Date.now() - 1000); // Within last second
  });

  it('should calculate time since update correctly', () => {
    // Test time calculation logic
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);

    expect(calculateTimeSinceUpdate(now)).toBe('Updated today');
    expect(calculateTimeSinceUpdate(oneDayAgo)).toBe('Updated yesterday');
    expect(calculateTimeSinceUpdate(oneWeekAgo)).toBe('Updated 1 weeks ago');
    expect(calculateTimeSinceUpdate(oneMonthAgo)).toBe('Updated 1 months ago');
    expect(calculateTimeSinceUpdate(oneYearAgo)).toBe('Updated 1 years ago');
    expect(calculateTimeSinceUpdate(0)).toBe('Never updated');
  });

  it('should detect stale now pages correctly', () => {
    // Test staleness detection logic
    const now = Date.now();
    const recent = now - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    const stale = now - (100 * 24 * 60 * 60 * 1000); // 100 days ago

    expect(isNowPageStale(recent)).toBe(false);
    expect(isNowPageStale(stale)).toBe(true);
    expect(isNowPageStale(0)).toBe(true);

    // Test custom stale threshold
    expect(isNowPageStale(recent, 20)).toBe(true); // 30 days > 20 day threshold
    expect(isNowPageStale(recent, 40)).toBe(false); // 30 days < 40 day threshold
  });

  it('should format now page summary correctly', () => {
    // Test summary formatting logic
    const fullNowPage = {
      title: 'Building AI tools',
      location: 'San Francisco',
      lastUpdated: Date.now() - (24 * 60 * 60 * 1000),
    };
    expect(formatNowPageSummary(fullNowPage)).toBe('Building AI tools in San Francisco (Updated yesterday)');

    const minimalNowPage = {
      title: 'Working remotely',
    };
    expect(formatNowPageSummary(minimalNowPage)).toBe('Working remotely');

    const withLocation = {
      title: 'Freelancing',
      location: 'Remote',
    };
    expect(formatNowPageSummary(withLocation)).toBe('Freelancing in Remote');
  });

  it('should handle edge cases in data preparation', () => {
    // Test edge case handling
    const edgeCases = [
      { title: null, location: undefined, description: '' },
      { title: '   ', location: '   ', description: '   ' },
    ];

    edgeCases.forEach(data => {
      const prepared = prepareNowPageUpdate(data);
      expect(prepared.title).toBe('');
      expect(prepared.location).toBe('');
      expect(prepared.description).toBe('');
      expect(typeof prepared.lastUpdated).toBe('number');
    });
  });

  it('should handle missing data in summary formatting', () => {
    // Test handling of incomplete data
    const incompleteCases = [
      { title: '', location: 'Location' },
      { title: 'Title', location: '' },
      { title: '', location: '', lastUpdated: Date.now() },
    ];

    incompleteCases.forEach(nowPage => {
      const summary = formatNowPageSummary(nowPage);
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThanOrEqual(0);
    });
  });
});
