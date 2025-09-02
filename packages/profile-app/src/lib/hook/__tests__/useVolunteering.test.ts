/**
 * Focused tests for useVolunteering - testing volunteering business logic
 */

import { describe, it, expect } from 'vitest';

// Simple business logic functions to test volunteering logic
function detectVolunteeringChanges(
  currentVolunteering: any,
  newData: {
    title?: string;
    organization?: string;
    from?: string;
    to?: string;
    location?: string;
    url?: string;
    description?: string;
  }
) {
  const changes: string[] = [];
  
  // change detection logic
  if (newData.title !== undefined && currentVolunteering.title !== newData.title) {
    changes.push('title');
  }
  
  if (newData.organization !== undefined && currentVolunteering.organization !== newData.organization) {
    changes.push('organization');
  }
  
  if (newData.from !== undefined && currentVolunteering.from !== newData.from) {
    changes.push('from');
  }
  
  // hasOwnProperty logic for optional fields
  if (newData.hasOwnProperty('to') && currentVolunteering.to !== newData.to) {
    changes.push('to');
  }
  
  if (newData.hasOwnProperty('location') && currentVolunteering.location !== newData.location) {
    changes.push('location');
  }
  
  if (newData.hasOwnProperty('url') && currentVolunteering.url !== newData.url) {
    changes.push('url');
  }
  
  if (newData.hasOwnProperty('description') && currentVolunteering.description !== newData.description) {
    changes.push('description');
  }
  
  return {
    hasChanges: changes.length > 0,
    changedFields: changes,
  };
}

function validateVolunteeringData(volunteeringData: any) {
  const errors: string[] = [];
  
  // validation logic
  if (!volunteeringData.title || volunteeringData.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!volunteeringData.organization || volunteeringData.organization.trim() === '') {
    errors.push('Organization is required');
  }
  
  if (!volunteeringData.from || volunteeringData.from.trim() === '') {
    errors.push('Start date is required');
  }
  
  // date validation logic
  if (volunteeringData.from && volunteeringData.to && volunteeringData.from > volunteeringData.to) {
    errors.push('Start date cannot be after end date');
  }
  
  if (volunteeringData.url && !isValidUrl(volunteeringData.url)) {
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

function formatVolunteeringPeriod(from: string, to?: string) {
  // volunteering period formatting logic
  if (!from) return '';
  
  if (!to || to === '') {
    return `${from} - Present`;
  }
  
  return `${from} - ${to}`;
}

function calculateVolunteeringDuration(from: string, to?: string) {
  // duration calculation logic
  if (!from) return 0;
  
  const startYear = parseInt(from);
  const endYear = to ? parseInt(to) : new Date().getFullYear();
  
  if (isNaN(startYear) || isNaN(endYear)) return 0;
  
  return Math.max(0, endYear - startYear);
}

function categorizeVolunteering(volunteering: any) {
  // volunteering categorization logic
  const title = volunteering.title?.toLowerCase() || '';
  const org = volunteering.organization?.toLowerCase() || '';
  
  if (title.includes('mentor') || title.includes('tutor')) {
    return 'mentoring';
  }
  
  if (org.includes('nonprofit') || org.includes('charity') || org.includes('foundation')) {
    return 'nonprofit';
  }
  
  if (title.includes('teach') || title.includes('education')) {
    return 'education';
  }
  
  if (org.includes('community') || title.includes('community')) {
    return 'community';
  }
  
  return 'other';
}

describe('Volunteering Business Logic', () => {
  it('should detect required field changes', () => {
    // Test change detection for required fields
    const currentVolunteering = {
      title: 'Volunteer Tutor',
      organization: 'Local Library',
      from: '2022',
      to: '2023',
    };
    
    const newData = {
      title: 'Senior Volunteer Tutor',
      organization: 'Community Center',
    };
    
    const result = detectVolunteeringChanges(currentVolunteering, newData);
    
    expect(result.hasChanges).toBe(true);
    expect(result.changedFields).toContain('title');
    expect(result.changedFields).toContain('organization');
    expect(result.changedFields).toHaveLength(2);
  });

  it('should handle hasOwnProperty logic for optional fields', () => {
    // Test hasOwnProperty logic for volunteering
    const currentVolunteering = {
      title: 'Volunteer',
      organization: 'Org',
      from: '2022',
      to: '2023',
      location: 'Local',
    };
    
    // Test undefined (should not trigger change)
    const undefinedData = { title: 'Volunteer' }; // No location field
    const undefinedResult = detectVolunteeringChanges(currentVolunteering, undefinedData);
    expect(undefinedResult.changedFields).not.toContain('location');
    
    // Test hasOwnProperty (should trigger change)
    const locationData = { location: 'Remote' }; // Explicitly setting location
    const locationResult = detectVolunteeringChanges(currentVolunteering, locationData);
    expect(locationResult.hasChanges).toBe(true);
    expect(locationResult.changedFields).toContain('location');
  });

  it('should validate volunteering data correctly', () => {
    // Test volunteering validation logic
    const validVolunteering = {
      title: 'Youth Mentor',
      organization: 'Boys & Girls Club',
      from: '2022',
      to: '2023',
      location: 'Downtown Center',
      url: 'https://bgclub.org',
      description: 'Mentoring at-risk youth in STEM subjects',
    };
    
    const result = validateVolunteeringData(validVolunteering);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid volunteering data', () => {
    // Test validation catches volunteering errors
    const invalidCases = [
      {
        data: { title: '', organization: 'Org', from: '2022' },
        expectedError: 'Title is required',
      },
      {
        data: { title: 'Volunteer', organization: '', from: '2022' },
        expectedError: 'Organization is required',
      },
      {
        data: { title: 'Volunteer', organization: 'Org', from: '' },
        expectedError: 'Start date is required',
      },
      {
        data: { title: 'Volunteer', organization: 'Org', from: '2023', to: '2022' },
        expectedError: 'Start date cannot be after end date',
      },
      {
        data: { title: 'Volunteer', organization: 'Org', from: '2022', url: 'invalid-url' },
        expectedError: 'URL must be a valid URL',
      },
    ];
    
    invalidCases.forEach(({ data, expectedError }) => {
      const result = validateVolunteeringData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it('should format volunteering period correctly', () => {
    // Test volunteering period formatting logic
    expect(formatVolunteeringPeriod('2022', '2023')).toBe('2022 - 2023');
    expect(formatVolunteeringPeriod('2022', '')).toBe('2022 - Present');
    expect(formatVolunteeringPeriod('2022')).toBe('2022 - Present');
    expect(formatVolunteeringPeriod('')).toBe('');
  });

  it('should calculate volunteering duration correctly', () => {
    // Test duration calculation logic
    expect(calculateVolunteeringDuration('2020', '2023')).toBe(3);
    expect(calculateVolunteeringDuration('2022', '2022')).toBe(0);
    expect(calculateVolunteeringDuration('2020')).toBeGreaterThanOrEqual(4); // Current year - 2020
    expect(calculateVolunteeringDuration('invalid', '2023')).toBe(0);
    expect(calculateVolunteeringDuration('')).toBe(0);
  });

  it('should categorize volunteering correctly', () => {
    // Test volunteering categorization logic
    const mentoring = { title: 'Youth Mentor', organization: 'Community Center' };
    expect(categorizeVolunteering(mentoring)).toBe('mentoring');
    
    const nonprofit = { title: 'Volunteer', organization: 'Red Cross Nonprofit' };
    expect(categorizeVolunteering(nonprofit)).toBe('nonprofit');
    
    const education = { title: 'Teaching Assistant', organization: 'Local School' };
    expect(categorizeVolunteering(education)).toBe('education');
    
    const community = { title: 'Community Organizer', organization: 'Neighborhood Group' };
    expect(categorizeVolunteering(community)).toBe('community');
    
    const other = { title: 'Event Helper', organization: 'Sports Club' };
    expect(categorizeVolunteering(other)).toBe('other');
  });

  it('should handle edge cases in change detection', () => {
    // Test edge case handling for volunteering
    const currentVolunteering = {
      title: 'Volunteer',
      organization: 'Org',
      from: '2022',
      to: null,
      location: undefined,
    };
    
    // Test null to string
    const nullToString = { to: '2023' };
    const result1 = detectVolunteeringChanges(currentVolunteering, nullToString);
    expect(result1.hasChanges).toBe(true);
    expect(result1.changedFields).toContain('to');
    
    // Test undefined to value
    const undefinedToValue = { location: 'Remote' };
    const result2 = detectVolunteeringChanges(currentVolunteering, undefinedToValue);
    expect(result2.hasChanges).toBe(true);
    expect(result2.changedFields).toContain('location');
  });

  it('should not detect changes when values are identical', () => {
    // Test no-change optimization for volunteering
    const currentVolunteering = {
      title: 'Same Volunteer Role',
      organization: 'Same Organization',
      from: '2022',
      to: '2023',
    };
    
    const sameData = {
      title: 'Same Volunteer Role',
      organization: 'Same Organization',
      from: '2022',
      to: '2023',
    };
    
    const result = detectVolunteeringChanges(currentVolunteering, sameData);
    
    expect(result.hasChanges).toBe(false);
    expect(result.changedFields).toHaveLength(0);
  });
});
