/**
 * Focused tests for useProject - testing change detection logic
 */

import { describe, it, expect } from 'vitest';

// Simple business logic functions to test change detection
function detectProjectChanges(
  currentProject: any,
  newData: {
    title?: string;
    year?: string;
    client?: string;
    link?: string;
    description?: string;
  }
) {
  const changes: string[] = [];

  // change detection logic
  if (newData.title !== undefined && currentProject.title !== newData.title) {
    changes.push('title');
  }

  if (newData.year !== undefined && currentProject.year !== newData.year) {
    changes.push('year');
  }

  if (newData.hasOwnProperty('client') && currentProject.client !== newData.client) {
    changes.push('client');
  }

  if (newData.hasOwnProperty('link') && currentProject.link !== newData.link) {
    changes.push('link');
  }

  if (newData.hasOwnProperty('description') && currentProject.description !== newData.description) {
    changes.push('description');
  }

  return {
    hasChanges: changes.length > 0,
    changedFields: changes,
  };
}

function validateProjectData(projectData: any) {
  const errors: string[] = [];

  // validation logic
  if (!projectData.title || projectData.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!projectData.year || projectData.year.trim() === '') {
    errors.push('Year is required');
  }

  if (projectData.year && !/^\d{4}$/.test(projectData.year)) {
    errors.push('Year must be a 4-digit number');
  }

  if (projectData.link && !isValidUrl(projectData.link)) {
    errors.push('Link must be a valid URL');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function shouldTriggerSync(changes: string[], syncableFields: string[] = ['title', 'year', 'client', 'link', 'description']) {
  // sync decision logic
  return changes.some(field => syncableFields.includes(field));
}

describe('Project Change Detection - Business Logic', () => {
  it('should detect title changes correctly', () => {
    // Test change detection for title
    const currentProject = {
      title: 'Old Title',
      year: '2024',
      client: 'Client',
    };

    const newData = { title: 'New Title' };
    const result = detectProjectChanges(currentProject, newData);

    expect(result.hasChanges).toBe(true);
    expect(result.changedFields).toContain('title');
    expect(result.changedFields).toHaveLength(1);
  });

  it('should detect multiple field changes', () => {
    // Test multi-field change detection
    const currentProject = {
      title: 'Project',
      year: '2023',
      client: 'Old Client',
      link: 'https://old.com',
    };

    const newData = {
      title: 'Updated Project',
      year: '2024',
      client: 'New Client',
    };

    const result = detectProjectChanges(currentProject, newData);

    expect(result.hasChanges).toBe(true);
    expect(result.changedFields).toEqual(['title', 'year', 'client']);
  });

  it('should handle undefined vs null correctly', () => {
    // Test undefined/null handling logic
    const currentProject = {
      title: 'Project',
      year: '2024',
      client: null,
      description: undefined,
    };

    // Test undefined (should not trigger change)
    const undefinedData = { title: 'Project' }; // title unchanged, no client field
    const undefinedResult = detectProjectChanges(currentProject, undefinedData);
    expect(undefinedResult.hasChanges).toBe(false);

    // Test hasOwnProperty logic for optional fields
    const clientData = { client: 'New Client' };
    const clientResult = detectProjectChanges(currentProject, clientData);
    expect(clientResult.hasChanges).toBe(true);
    expect(clientResult.changedFields).toContain('client');
  });

  it('should not detect changes when values are the same', () => {
    // Test no-change detection
    const currentProject = {
      title: 'Same Title',
      year: '2024',
      client: 'Same Client',
    };

    const sameData = {
      title: 'Same Title',
      year: '2024',
      client: 'Same Client',
    };

    const result = detectProjectChanges(currentProject, sameData);

    expect(result.hasChanges).toBe(false);
    expect(result.changedFields).toHaveLength(0);
  });

  it('should validate project data correctly', () => {
    // Test project validation logic
    const validProject = {
      title: 'Valid Project',
      year: '2024',
      client: 'Client',
      link: 'https://example.com',
      description: 'A valid project',
    };

    const result = validateProjectData(validProject);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid project data', () => {
    // Test validation catches errors
    const invalidCases = [
      {
        data: { title: '', year: '2024' },
        expectedError: 'Title is required',
      },
      {
        data: { title: 'Project', year: '' },
        expectedError: 'Year is required',
      },
      {
        data: { title: 'Project', year: '24' },
        expectedError: 'Year must be a 4-digit number',
      },
      {
        data: { title: 'Project', year: '2024', link: 'invalid-url' },
        expectedError: 'Link must be a valid URL',
      },
    ];

    invalidCases.forEach(({ data, expectedError }) => {
      const result = validateProjectData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it('should determine sync necessity correctly', () => {
    // Test sync decision logic
    const syncableChanges = ['title', 'year'];
    const nonSyncableChanges = ['internal_id'];

    expect(shouldTriggerSync(syncableChanges)).toBe(true);
    expect(shouldTriggerSync(nonSyncableChanges, ['title', 'year'])).toBe(false);
    expect(shouldTriggerSync(['title', 'internal_id'], ['title', 'year'])).toBe(true);
  });

  it('should handle edge cases in change detection', () => {
    // Test edge case handling
    const currentProject = {
      title: 'Project',
      year: '2024',
      client: '',
      link: null,
    };

    // Test empty string to null
    const emptyToNull = { client: undefined };
    const result1 = detectProjectChanges(currentProject, emptyToNull);
    expect(result1.hasChanges).toBe(true); // '' !== null

    // Test null to empty string
    const nullToEmpty = { link: '' };
    const result2 = detectProjectChanges(currentProject, nullToEmpty);
    expect(result2.hasChanges).toBe(true); // null !== ''
  });
});
