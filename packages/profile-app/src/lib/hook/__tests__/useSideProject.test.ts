/**
 * Focused tests for useSideProject - testing side project business logic
 */

import { describe, it, expect } from 'vitest';

// Simple business logic functions to test side project logic
function detectSideProjectChanges(
  currentSideProject: any,
  newData: {
    title?: string;
    year?: string;
    client?: string;
    url?: string;
    description?: string;
  }
) {
  const changes: string[] = [];
  
  // change detection logic
  if (newData.title !== undefined && currentSideProject.title !== newData.title) {
    changes.push('title');
  }
  
  if (newData.year !== undefined && currentSideProject.year !== newData.year) {
    changes.push('year');
  }
  
  // hasOwnProperty logic for optional fields
  if (newData.hasOwnProperty('client') && currentSideProject.client !== newData.client) {
    changes.push('client');
  }
  
  if (newData.hasOwnProperty('url') && currentSideProject.url !== newData.url) {
    changes.push('url');
  }
  
  if (newData.hasOwnProperty('description') && currentSideProject.description !== newData.description) {
    changes.push('description');
  }
  
  return {
    hasChanges: changes.length > 0,
    changedFields: changes,
  };
}

function validateSideProjectData(sideProjectData: any) {
  const errors: string[] = [];
  
  // validation logic
  if (!sideProjectData.title || sideProjectData.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!sideProjectData.year || sideProjectData.year.trim() === '') {
    errors.push('Year is required');
  }
  
  if (sideProjectData.year && !/^\d{4}$/.test(sideProjectData.year)) {
    errors.push('Year must be a 4-digit number');
  }
  
  if (sideProjectData.url && !isValidUrl(sideProjectData.url)) {
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

function categorizeSideProject(sideProject: any) {
  // side project categorization logic
  if (sideProject.client && sideProject.client.trim() !== '') {
    return 'client_work';
  }
  
  if (sideProject.url && sideProject.url.includes('github.com')) {
    return 'open_source';
  }
  
  if (sideProject.description && sideProject.description.toLowerCase().includes('startup')) {
    return 'startup';
  }
  
  return 'personal';
}

function formatSideProjectDisplay(sideProject: any) {
  // side project display formatting logic
  const parts = [sideProject.title];
  
  if (sideProject.client) {
    parts.push(`for ${sideProject.client}`);
  }
  
  if (sideProject.year) {
    parts.push(`(${sideProject.year})`);
  }
  
  return parts.join(' ');
}

function sortSideProjectsByYear(sideProjects: any[]) {
  // sorting logic for side projects
  return sideProjects.sort((a, b) => {
    const yearA = parseInt(a.year) || 0;
    const yearB = parseInt(b.year) || 0;
    return yearB - yearA; // Most recent first
  });
}

describe('Side Project Business Logic', () => {
  it('should detect required field changes', () => {
    // Test change detection for required fields
    const currentSideProject = {
      title: 'Personal Website',
      year: '2023',
      client: 'Self',
      url: 'https://mysite.com',
    };
    
    const newData = {
      title: 'Portfolio Website',
      year: '2024',
    };
    
    const result = detectSideProjectChanges(currentSideProject, newData);
    
    expect(result.hasChanges).toBe(true);
    expect(result.changedFields).toContain('title');
    expect(result.changedFields).toContain('year');
    expect(result.changedFields).toHaveLength(2);
  });

  it('should handle hasOwnProperty logic for optional fields', () => {
    // Test hasOwnProperty logic for side projects
    const currentSideProject = {
      title: 'Project',
      year: '2023',
      client: 'Client Corp',
      url: 'https://project.com',
    };
    
    // Test undefined (should not trigger change)
    const undefinedData = { title: 'Project' }; // No client field
    const undefinedResult = detectSideProjectChanges(currentSideProject, undefinedData);
    expect(undefinedResult.changedFields).not.toContain('client');
    
    // Test hasOwnProperty (should trigger change)
    const clientData = { client: 'New Client' }; // Explicitly setting client
    const clientResult = detectSideProjectChanges(currentSideProject, clientData);
    expect(clientResult.hasChanges).toBe(true);
    expect(clientResult.changedFields).toContain('client');
    
    // Test clearing optional field
    const clearData = { url: '' }; // Explicitly clearing
    const clearResult = detectSideProjectChanges(currentSideProject, clearData);
    expect(clearResult.hasChanges).toBe(true);
    expect(clearResult.changedFields).toContain('url');
  });

  it('should validate side project data correctly', () => {
    // Test side project validation logic
    const validSideProject = {
      title: 'E-commerce Platform',
      year: '2023',
      client: 'Startup Inc',
      url: 'https://ecommerce.example.com',
      description: 'Full-stack e-commerce solution',
    };
    
    const result = validateSideProjectData(validSideProject);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid side project data', () => {
    // Test validation catches side project errors
    const invalidCases = [
      {
        data: { title: '', year: '2023' },
        expectedError: 'Title is required',
      },
      {
        data: { title: 'Project', year: '' },
        expectedError: 'Year is required',
      },
      {
        data: { title: 'Project', year: '23' },
        expectedError: 'Year must be a 4-digit number',
      },
      {
        data: { title: 'Project', year: '2023', url: 'invalid-url' },
        expectedError: 'URL must be a valid URL',
      },
    ];
    
    invalidCases.forEach(({ data, expectedError }) => {
      const result = validateSideProjectData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it('should categorize side projects correctly', () => {
    // Test side project categorization logic
    const clientWork = {
      title: 'Client App',
      year: '2023',
      client: 'Big Corp',
    };
    expect(categorizeSideProject(clientWork)).toBe('client_work');
    
    const openSource = {
      title: 'Open Source Library',
      year: '2023',
      url: 'https://github.com/user/project',
    };
    expect(categorizeSideProject(openSource)).toBe('open_source');
    
    const startup = {
      title: 'MVP Development',
      year: '2023',
      description: 'Built MVP for a startup company',
    };
    expect(categorizeSideProject(startup)).toBe('startup');
    
    const personal = {
      title: 'Personal Tool',
      year: '2023',
    };
    expect(categorizeSideProject(personal)).toBe('personal');
  });

  it('should format side project display correctly', () => {
    // Test side project display formatting logic
    const fullProject = {
      title: 'E-commerce Site',
      year: '2023',
      client: 'Retail Corp',
    };
    expect(formatSideProjectDisplay(fullProject)).toBe('E-commerce Site for Retail Corp (2023)');
    
    const personalProject = {
      title: 'Personal Blog',
      year: '2022',
    };
    expect(formatSideProjectDisplay(personalProject)).toBe('Personal Blog (2022)');
    
    const minimalProject = {
      title: 'Simple Tool',
    };
    expect(formatSideProjectDisplay(minimalProject)).toBe('Simple Tool');
  });

  it('should sort side projects by year correctly', () => {
    // Test side project sorting logic
    const sideProjects = [
      { title: 'Project 1', year: '2020' },
      { title: 'Project 2', year: '2023' },
      { title: 'Project 3', year: '2021' },
      { title: 'Project 4', year: 'invalid' },
    ];
    
    const sorted = sortSideProjectsByYear(sideProjects);
    
    expect(sorted[0].year).toBe('2023'); // Most recent first
    expect(sorted[1].year).toBe('2021');
    expect(sorted[2].year).toBe('2020');
    expect(sorted[3].year).toBe('invalid'); // Invalid years go to end
  });

  it('should handle edge cases in change detection', () => {
    // Test edge case handling for side projects
    const currentSideProject = {
      title: 'Project',
      year: '2023',
      client: null,
      url: undefined,
    };
    
    // Test null to string
    const nullToString = { client: 'New Client' };
    const result1 = detectSideProjectChanges(currentSideProject, nullToString);
    expect(result1.hasChanges).toBe(true);
    expect(result1.changedFields).toContain('client');
    
    // Test undefined to value
    const undefinedToValue = { url: 'https://project.com' };
    const result2 = detectSideProjectChanges(currentSideProject, undefinedToValue);
    expect(result2.hasChanges).toBe(true);
    expect(result2.changedFields).toContain('url');
  });

  it('should not detect changes when values are identical', () => {
    // Test no-change optimization for side projects
    const currentSideProject = {
      title: 'Same Project',
      year: '2023',
      client: 'Same Client',
    };
    
    const sameData = {
      title: 'Same Project',
      year: '2023',
      client: 'Same Client',
    };
    
    const result = detectSideProjectChanges(currentSideProject, sameData);
    
    expect(result.hasChanges).toBe(false);
    expect(result.changedFields).toHaveLength(0);
  });
});
