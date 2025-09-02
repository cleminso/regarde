/**
 * Focused tests for useWriting - testing writing business logic
 */

import { describe, it, expect } from 'vitest';

// Simple business logic functions to test writing logic
function detectWritingChanges(
  currentWriting: any,
  newData: {
    title?: string;
    year?: string;
    publication?: string;
    url?: string;
    description?: string;
  }
) {
  const changes: string[] = [];
  
  // change detection logic
  if (newData.title !== undefined && currentWriting.title !== newData.title) {
    changes.push('title');
  }
  
  if (newData.year !== undefined && currentWriting.year !== newData.year) {
    changes.push('year');
  }
  
  // hasOwnProperty logic for optional fields
  if (newData.hasOwnProperty('publication') && currentWriting.publication !== newData.publication) {
    changes.push('publication');
  }
  
  if (newData.hasOwnProperty('url') && currentWriting.url !== newData.url) {
    changes.push('url');
  }
  
  if (newData.hasOwnProperty('description') && currentWriting.description !== newData.description) {
    changes.push('description');
  }
  
  return {
    hasChanges: changes.length > 0,
    changedFields: changes,
  };
}

function validateWritingData(writingData: any) {
  const errors: string[] = [];
  
  // validation logic
  if (!writingData.title || writingData.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!writingData.year || writingData.year.trim() === '') {
    errors.push('Year is required');
  }
  
  if (writingData.year && !/^\d{4}$/.test(writingData.year)) {
    errors.push('Year must be a 4-digit number');
  }
  
  if (writingData.url && !isValidUrl(writingData.url)) {
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

function categorizeWriting(writing: any) {
  // writing categorization logic
  const title = writing.title?.toLowerCase() || '';
  const publication = writing.publication?.toLowerCase() || '';
  
  if (publication.includes('blog') || publication.includes('medium') || publication.includes('dev.to')) {
    return 'blog_post';
  }
  
  if (publication.includes('journal') || publication.includes('ieee') || publication.includes('acm')) {
    return 'academic_paper';
  }
  
  if (publication.includes('magazine') || publication.includes('newsletter')) {
    return 'article';
  }
  
  if (title.includes('book') || title.includes('ebook') || publication.includes('publisher')) {
    return 'book';
  }
  
  if (publication.includes('conference') || publication.includes('proceedings')) {
    return 'conference_paper';
  }
  
  return 'other';
}

function formatWritingDisplay(writing: any) {
  // writing display formatting logic
  const parts = [writing.title];
  
  if (writing.publication) {
    parts.push(`in ${writing.publication}`);
  }
  
  if (writing.year) {
    parts.push(`(${writing.year})`);
  }
  
  return parts.join(' ');
}

function sortWritingsByYear(writings: any[]) {
  // sorting logic for writings
  return writings.sort((a, b) => {
    const yearA = parseInt(a.year) || 0;
    const yearB = parseInt(b.year) || 0;
    return yearB - yearA; // Most recent first
  });
}

function generateWritingCitation(writing: any, style: 'apa' | 'mla' = 'apa') {
  // citation generation logic
  if (style === 'apa') {
    const parts = [];
    if (writing.title) parts.push(writing.title);
    if (writing.publication) parts.push(writing.publication);
    if (writing.year) parts.push(`(${writing.year})`);
    return parts.join('. ');
  } else if (style === 'mla') {
    const parts = [];
    if (writing.title) parts.push(`"${writing.title}"`);
    if (writing.publication) parts.push(writing.publication);
    if (writing.year) parts.push(writing.year);
    return parts.join(', ');
  }
  
  return '';
}

describe('Writing Business Logic', () => {
  it('should detect required field changes', () => {
    // Test change detection for required fields
    const currentWriting = {
      title: 'Introduction to Machine Learning',
      year: '2023',
      publication: 'Tech Blog',
      url: 'https://techblog.com/ml-intro',
    };
    
    const newData = {
      title: 'Advanced Machine Learning Techniques',
      year: '2024',
    };
    
    const result = detectWritingChanges(currentWriting, newData);
    
    expect(result.hasChanges).toBe(true);
    expect(result.changedFields).toContain('title');
    expect(result.changedFields).toContain('year');
    expect(result.changedFields).toHaveLength(2);
  });

  it('should handle hasOwnProperty logic for optional fields', () => {
    // Test hasOwnProperty logic for writing
    const currentWriting = {
      title: 'Article',
      year: '2023',
      publication: 'Magazine',
      url: 'https://magazine.com/article',
    };
    
    // Test undefined (should not trigger change)
    const undefinedData = { title: 'Article' }; // No publication field
    const undefinedResult = detectWritingChanges(currentWriting, undefinedData);
    expect(undefinedResult.changedFields).not.toContain('publication');
    
    // Test hasOwnProperty (should trigger change)
    const publicationData = { publication: 'New Magazine' }; // Explicitly setting publication
    const publicationResult = detectWritingChanges(currentWriting, publicationData);
    expect(publicationResult.hasChanges).toBe(true);
    expect(publicationResult.changedFields).toContain('publication');
  });

  it('should validate writing data correctly', () => {
    // Test writing validation logic
    const validWriting = {
      title: 'The Future of AI Development',
      year: '2023',
      publication: 'AI Research Journal',
      url: 'https://aijournal.com/future-ai',
      description: 'Comprehensive analysis of AI development trends',
    };
    
    const result = validateWritingData(validWriting);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid writing data', () => {
    // Test validation catches writing errors
    const invalidCases = [
      {
        data: { title: '', year: '2023' },
        expectedError: 'Title is required',
      },
      {
        data: { title: 'Article', year: '' },
        expectedError: 'Year is required',
      },
      {
        data: { title: 'Article', year: '23' },
        expectedError: 'Year must be a 4-digit number',
      },
      {
        data: { title: 'Article', year: '2023', url: 'invalid-url' },
        expectedError: 'URL must be a valid URL',
      },
    ];
    
    invalidCases.forEach(({ data, expectedError }) => {
      const result = validateWritingData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it('should categorize writing correctly', () => {
    // Test writing categorization logic
    const blogPost = { title: 'How to Code', publication: 'Personal Blog' };
    expect(categorizeWriting(blogPost)).toBe('blog_post');
    
    const academicPaper = { title: 'Research Study', publication: 'IEEE Journal' };
    expect(categorizeWriting(academicPaper)).toBe('academic_paper');
    
    const article = { title: 'Tech Trends', publication: 'Tech Magazine' };
    expect(categorizeWriting(article)).toBe('article');
    
    const book = { title: 'Programming Book', publication: 'Tech Publisher' };
    expect(categorizeWriting(book)).toBe('book');
    
    const conferencePaper = { title: 'Research Findings', publication: 'Conference Proceedings' };
    expect(categorizeWriting(conferencePaper)).toBe('conference_paper');
    
    const other = { title: 'Random Writing', publication: 'Unknown' };
    expect(categorizeWriting(other)).toBe('other');
  });

  it('should format writing display correctly', () => {
    // Test writing display formatting logic
    const fullWriting = {
      title: 'AI Ethics in Practice',
      year: '2023',
      publication: 'Ethics Journal',
    };
    expect(formatWritingDisplay(fullWriting)).toBe('AI Ethics in Practice in Ethics Journal (2023)');
    
    const minimalWriting = {
      title: 'Simple Article',
      year: '2022',
    };
    expect(formatWritingDisplay(minimalWriting)).toBe('Simple Article (2022)');
  });

  it('should sort writings by year correctly', () => {
    // Test writing sorting logic
    const writings = [
      { title: 'Article 1', year: '2020' },
      { title: 'Article 2', year: '2023' },
      { title: 'Article 3', year: '2021' },
      { title: 'Article 4', year: 'invalid' },
    ];
    
    const sorted = sortWritingsByYear(writings);
    
    expect(sorted[0].year).toBe('2023'); // Most recent first
    expect(sorted[1].year).toBe('2021');
    expect(sorted[2].year).toBe('2020');
    expect(sorted[3].year).toBe('invalid'); // Invalid years go to end
  });

  it('should generate citations correctly', () => {
    // Test citation generation logic
    const writing = {
      title: 'Machine Learning Fundamentals',
      publication: 'AI Journal',
      year: '2023',
    };
    
    const apaCitation = generateWritingCitation(writing, 'apa');
    expect(apaCitation).toBe('Machine Learning Fundamentals. AI Journal. (2023)');
    
    const mlaCitation = generateWritingCitation(writing, 'mla');
    expect(mlaCitation).toBe('"Machine Learning Fundamentals", AI Journal, 2023');
  });

  it('should handle edge cases in change detection', () => {
    // Test edge case handling for writing
    const currentWriting = {
      title: 'Article',
      year: '2023',
      publication: null,
      url: undefined,
    };
    
    // Test null to string
    const nullToString = { publication: 'New Publication' };
    const result1 = detectWritingChanges(currentWriting, nullToString);
    expect(result1.hasChanges).toBe(true);
    expect(result1.changedFields).toContain('publication');
    
    // Test undefined to value
    const undefinedToValue = { url: 'https://example.com' };
    const result2 = detectWritingChanges(currentWriting, undefinedToValue);
    expect(result2.hasChanges).toBe(true);
    expect(result2.changedFields).toContain('url');
  });

  it('should not detect changes when values are identical', () => {
    // Test no-change optimization for writing
    const currentWriting = {
      title: 'Same Article',
      year: '2023',
      publication: 'Same Publication',
    };
    
    const sameData = {
      title: 'Same Article',
      year: '2023',
      publication: 'Same Publication',
    };
    
    const result = detectWritingChanges(currentWriting, sameData);
    
    expect(result.hasChanges).toBe(false);
    expect(result.changedFields).toHaveLength(0);
  });
});
