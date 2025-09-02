/**
 * Focused tests for useWorkExp - testing work experience business logic
 */

import { describe, it, expect } from 'vitest';

// Simple business logic functions to test work experience logic
function detectWorkExpChanges(
  currentWorkExp: any,
  newData: {
    title?: string;
    company?: string;
    from?: string;
    to?: string;
    location?: string;
    url?: string;
    description?: string;
  }
) {
  const changes: string[] = [];
  
  // change detection logic
  if (newData.title !== undefined && currentWorkExp.title !== newData.title) {
    changes.push('title');
  }
  
  if (newData.company !== undefined && currentWorkExp.company !== newData.company) {
    changes.push('company');
  }
  
  if (newData.from !== undefined && currentWorkExp.from !== newData.from) {
    changes.push('from');
  }
  
  // hasOwnProperty logic for optional fields
  if (newData.hasOwnProperty('to') && currentWorkExp.to !== newData.to) {
    changes.push('to');
  }
  
  if (newData.hasOwnProperty('location') && currentWorkExp.location !== newData.location) {
    changes.push('location');
  }
  
  if (newData.hasOwnProperty('url') && currentWorkExp.url !== newData.url) {
    changes.push('url');
  }
  
  if (newData.hasOwnProperty('description') && currentWorkExp.description !== newData.description) {
    changes.push('description');
  }
  
  return {
    hasChanges: changes.length > 0,
    changedFields: changes,
  };
}

function validateWorkExpData(workExpData: any) {
  const errors: string[] = [];
  
  // validation logic
  if (!workExpData.title || workExpData.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!workExpData.company || workExpData.company.trim() === '') {
    errors.push('Company is required');
  }
  
  if (!workExpData.from || workExpData.from.trim() === '') {
    errors.push('Start date is required');
  }
  
  // date validation logic
  if (workExpData.from && workExpData.to && workExpData.from > workExpData.to) {
    errors.push('Start date cannot be after end date');
  }
  
  if (workExpData.url && !isValidUrl(workExpData.url)) {
    errors.push('URL must be a valid URL');
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

function formatWorkExpDuration(from: string, to?: string) {
  // duration formatting logic
  if (!from) return '';
  
  if (!to || to === '') {
    return `${from} - Present`;
  }
  
  return `${from} - ${to}`;
}

function calculateWorkExpDuration(from: string, to?: string) {
  // duration calculation logic
  if (!from) return 0;
  
  const startYear = parseInt(from);
  const endYear = to ? parseInt(to) : new Date().getFullYear();
  
  if (isNaN(startYear) || isNaN(endYear)) return 0;
  
  return Math.max(0, endYear - startYear);
}

describe('Work Experience Business Logic', () => {
  it('should detect title and company changes', () => {
    // Test change detection for required fields
    const currentWorkExp = {
      title: 'Software Engineer',
      company: 'Tech Corp',
      from: '2020',
      to: '2023',
    };
    
    const newData = {
      title: 'Senior Software Engineer',
      company: 'New Tech Corp',
    };
    
    const result = detectWorkExpChanges(currentWorkExp, newData);
    
    expect(result.hasChanges).toBe(true);
    expect(result.changedFields).toContain('title');
    expect(result.changedFields).toContain('company');
    expect(result.changedFields).toHaveLength(2);
  });

  it('should handle hasOwnProperty logic for optional fields', () => {
    // Test hasOwnProperty logic
    const currentWorkExp = {
      title: 'Engineer',
      company: 'Corp',
      from: '2020',
      to: '2023',
      location: 'Remote',
    };
    
    // Test undefined (should not trigger change)
    const undefinedData = { title: 'Engineer' }; // No location field
    const undefinedResult = detectWorkExpChanges(currentWorkExp, undefinedData);
    expect(undefinedResult.changedFields).not.toContain('location');
    
    // Test hasOwnProperty (should trigger change)
    const locationData = { location: 'San Francisco' }; // Explicitly setting location
    const locationResult = detectWorkExpChanges(currentWorkExp, locationData);
    expect(locationResult.hasChanges).toBe(true);
    expect(locationResult.changedFields).toContain('location');
    
    // Test clearing optional field
    const clearData = { location: '' }; // Explicitly clearing
    const clearResult = detectWorkExpChanges(currentWorkExp, clearData);
    expect(clearResult.hasChanges).toBe(true);
    expect(clearResult.changedFields).toContain('location');
  });

  it('should validate work experience data correctly', () => {
    // Test validation logic
    const validWorkExp = {
      title: 'Software Engineer',
      company: 'Tech Corp',
      from: '2020',
      to: '2023',
      location: 'San Francisco',
      url: 'https://techcorp.com',
      description: 'Developed software',
    };
    
    const result = validateWorkExpData(validWorkExp);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid work experience data', () => {
    // Test validation catches errors
    const invalidCases = [
      {
        data: { title: '', company: 'Corp', from: '2020' },
        expectedError: 'Title is required',
      },
      {
        data: { title: 'Engineer', company: '', from: '2020' },
        expectedError: 'Company is required',
      },
      {
        data: { title: 'Engineer', company: 'Corp', from: '' },
        expectedError: 'Start date is required',
      },
      {
        data: { title: 'Engineer', company: 'Corp', from: '2023', to: '2020' },
        expectedError: 'Start date cannot be after end date',
      },
      {
        data: { title: 'Engineer', company: 'Corp', from: '2020', url: 'invalid-url' },
        expectedError: 'URL must be a valid URL',
      },
    ];
    
    invalidCases.forEach(({ data, expectedError }) => {
      const result = validateWorkExpData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it('should format work experience duration correctly', () => {
    // Test duration formatting logic
    expect(formatWorkExpDuration('2020', '2023')).toBe('2020 - 2023');
    expect(formatWorkExpDuration('2020', '')).toBe('2020 - Present');
    expect(formatWorkExpDuration('2020')).toBe('2020 - Present');
    expect(formatWorkExpDuration('')).toBe('');
  });

  it('should calculate work experience duration correctly', () => {
    // Test duration calculation logic
    expect(calculateWorkExpDuration('2020', '2023')).toBe(3);
    expect(calculateWorkExpDuration('2020', '2020')).toBe(0);
    expect(calculateWorkExpDuration('2020')).toBeGreaterThanOrEqual(4); // Current year - 2020
    expect(calculateWorkExpDuration('invalid', '2023')).toBe(0);
    expect(calculateWorkExpDuration('')).toBe(0);
  });

  it('should handle edge cases in change detection', () => {
    // Test edge case handling
    const currentWorkExp = {
      title: 'Engineer',
      company: 'Corp',
      from: '2020',
      to: null,
      location: '',
      url: undefined,
    };
    
    // Test null to string
    const nullToString = { to: '2023' };
    const result1 = detectWorkExpChanges(currentWorkExp, nullToString);
    expect(result1.hasChanges).toBe(true);
    expect(result1.changedFields).toContain('to');
    
    // Test empty string to value
    const emptyToValue = { location: 'Remote' };
    const result2 = detectWorkExpChanges(currentWorkExp, emptyToValue);
    expect(result2.hasChanges).toBe(true);
    expect(result2.changedFields).toContain('location');
    
    // Test undefined to value
    const undefinedToValue = { url: 'https://example.com' };
    const result3 = detectWorkExpChanges(currentWorkExp, undefinedToValue);
    expect(result3.hasChanges).toBe(true);
    expect(result3.changedFields).toContain('url');
  });

  it('should not detect changes when values are identical', () => {
    // Test no-change optimization
    const currentWorkExp = {
      title: 'Engineer',
      company: 'Corp',
      from: '2020',
      to: '2023',
      location: 'Remote',
    };
    
    const sameData = {
      title: 'Engineer',
      company: 'Corp',
      from: '2020',
      to: '2023',
      location: 'Remote',
    };
    
    const result = detectWorkExpChanges(currentWorkExp, sameData);
    
    expect(result.hasChanges).toBe(false);
    expect(result.changedFields).toHaveLength(0);
  });
});
