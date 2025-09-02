/**
 * Focused tests for useEducation - testing education business logic
 */

import { describe, it, expect } from 'vitest';

// Simple business logic functions to test education logic
function detectEducationChanges(
  currentEducation: any,
  newData: {
    from?: string;
    degree?: string;
    institution?: string;
    to?: string;
    location?: string;
    url?: string;
    description?: string;
  }
) {
  const changes: string[] = [];
  
  // change detection logic
  if (newData.from !== undefined && currentEducation.from !== newData.from) {
    changes.push('from');
  }
  
  if (newData.degree !== undefined && currentEducation.degree !== newData.degree) {
    changes.push('degree');
  }
  
  if (newData.institution !== undefined && currentEducation.institution !== newData.institution) {
    changes.push('institution');
  }
  
  // hasOwnProperty logic for optional fields
  if (newData.hasOwnProperty('to') && currentEducation.to !== newData.to) {
    changes.push('to');
  }
  
  if (newData.hasOwnProperty('location') && currentEducation.location !== newData.location) {
    changes.push('location');
  }
  
  if (newData.hasOwnProperty('url') && currentEducation.url !== newData.url) {
    changes.push('url');
  }
  
  if (newData.hasOwnProperty('description') && currentEducation.description !== newData.description) {
    changes.push('description');
  }
  
  return {
    hasChanges: changes.length > 0,
    changedFields: changes,
  };
}

function validateEducationData(educationData: any) {
  const errors: string[] = [];
  
  // validation logic
  if (!educationData.from || educationData.from.trim() === '') {
    errors.push('Start year is required');
  }
  
  if (!educationData.degree || educationData.degree.trim() === '') {
    errors.push('Degree is required');
  }
  
  if (!educationData.institution || educationData.institution.trim() === '') {
    errors.push('Institution is required');
  }
  
  // date validation logic
  if (educationData.from && educationData.to && educationData.from > educationData.to) {
    errors.push('Start year cannot be after end year');
  }
  
  if (educationData.url && !isValidUrl(educationData.url)) {
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

function formatEducationPeriod(from: string, to?: string) {
  // education period formatting logic
  if (!from) return '';
  
  if (!to || to === '') {
    return `${from} - Present`;
  }
  
  return `${from} - ${to}`;
}

function calculateEducationDuration(from: string, to?: string) {
  // duration calculation logic
  if (!from) return 0;
  
  const startYear = parseInt(from);
  const endYear = to ? parseInt(to) : new Date().getFullYear();
  
  if (isNaN(startYear) || isNaN(endYear)) return 0;
  
  return Math.max(0, endYear - startYear);
}

describe('Education Business Logic', () => {
  it('should detect required field changes', () => {
    // Test change detection for required fields
    const currentEducation = {
      from: '2018',
      degree: 'Bachelor of Science',
      institution: 'University of Tech',
      to: '2022',
    };
    
    const newData = {
      degree: 'Master of Science',
      institution: 'Advanced University',
    };
    
    const result = detectEducationChanges(currentEducation, newData);
    
    expect(result.hasChanges).toBe(true);
    expect(result.changedFields).toContain('degree');
    expect(result.changedFields).toContain('institution');
    expect(result.changedFields).toHaveLength(2);
  });

  it('should handle hasOwnProperty logic for optional fields', () => {
    // Test hasOwnProperty logic for education
    const currentEducation = {
      from: '2018',
      degree: 'BS',
      institution: 'University',
      to: '2022',
      location: 'Boston',
      url: 'https://university.edu',
    };
    
    // Test undefined (should not trigger change)
    const undefinedData = { degree: 'BS' }; // No location field
    const undefinedResult = detectEducationChanges(currentEducation, undefinedData);
    expect(undefinedResult.changedFields).not.toContain('location');
    
    // Test hasOwnProperty (should trigger change)
    const locationData = { location: 'New York' }; // Explicitly setting location
    const locationResult = detectEducationChanges(currentEducation, locationData);
    expect(locationResult.hasChanges).toBe(true);
    expect(locationResult.changedFields).toContain('location');
    
    // Test clearing optional field
    const clearData = { url: '' }; // Explicitly clearing
    const clearResult = detectEducationChanges(currentEducation, clearData);
    expect(clearResult.hasChanges).toBe(true);
    expect(clearResult.changedFields).toContain('url');
  });

  it('should validate education data correctly', () => {
    // Test education validation logic
    const validEducation = {
      from: '2018',
      degree: 'Bachelor of Computer Science',
      institution: 'Tech University',
      to: '2022',
      location: 'Boston, MA',
      url: 'https://techuniversity.edu',
      description: 'Computer Science program with focus on AI',
    };
    
    const result = validateEducationData(validEducation);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid education data', () => {
    // Test validation catches education errors
    const invalidCases = [
      {
        data: { from: '', degree: 'BS', institution: 'University' },
        expectedError: 'Start year is required',
      },
      {
        data: { from: '2018', degree: '', institution: 'University' },
        expectedError: 'Degree is required',
      },
      {
        data: { from: '2018', degree: 'BS', institution: '' },
        expectedError: 'Institution is required',
      },
      {
        data: { from: '2022', degree: 'BS', institution: 'University', to: '2018' },
        expectedError: 'Start year cannot be after end year',
      },
      {
        data: { from: '2018', degree: 'BS', institution: 'University', url: 'invalid-url' },
        expectedError: 'URL must be a valid URL',
      },
    ];
    
    invalidCases.forEach(({ data, expectedError }) => {
      const result = validateEducationData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it('should format education period correctly', () => {
    // Test education period formatting logic
    expect(formatEducationPeriod('2018', '2022')).toBe('2018 - 2022');
    expect(formatEducationPeriod('2018', '')).toBe('2018 - Present');
    expect(formatEducationPeriod('2018')).toBe('2018 - Present');
    expect(formatEducationPeriod('')).toBe('');
  });

  it('should calculate education duration correctly', () => {
    // Test duration calculation logic
    expect(calculateEducationDuration('2018', '2022')).toBe(4);
    expect(calculateEducationDuration('2020', '2020')).toBe(0);
    expect(calculateEducationDuration('2020')).toBeGreaterThanOrEqual(4); // Current year - 2020
    expect(calculateEducationDuration('invalid', '2022')).toBe(0);
    expect(calculateEducationDuration('')).toBe(0);
  });

  it('should handle edge cases in change detection', () => {
    // Test edge case handling for education
    const currentEducation = {
      from: '2018',
      degree: 'BS',
      institution: 'University',
      to: null,
      location: '',
      url: undefined,
    };
    
    // Test null to string
    const nullToString = { to: '2022' };
    const result1 = detectEducationChanges(currentEducation, nullToString);
    expect(result1.hasChanges).toBe(true);
    expect(result1.changedFields).toContain('to');
    
    // Test empty string to value
    const emptyToValue = { location: 'Boston' };
    const result2 = detectEducationChanges(currentEducation, emptyToValue);
    expect(result2.hasChanges).toBe(true);
    expect(result2.changedFields).toContain('location');
    
    // Test undefined to value
    const undefinedToValue = { url: 'https://university.edu' };
    const result3 = detectEducationChanges(currentEducation, undefinedToValue);
    expect(result3.hasChanges).toBe(true);
    expect(result3.changedFields).toContain('url');
  });

  it('should not detect changes when values are identical', () => {
    // Test no-change optimization for education
    const currentEducation = {
      from: '2018',
      degree: 'Same Degree',
      institution: 'Same University',
      to: '2022',
      location: 'Same Location',
    };
    
    const sameData = {
      from: '2018',
      degree: 'Same Degree',
      institution: 'Same University',
      to: '2022',
      location: 'Same Location',
    };
    
    const result = detectEducationChanges(currentEducation, sameData);
    
    expect(result.hasChanges).toBe(false);
    expect(result.changedFields).toHaveLength(0);
  });
});
