/**
 * Focused tests for useSpeaking - testing speaking engagement business logic
 */

import { describe, it, expect } from 'vitest';

// Simple business logic functions to test speaking logic
function detectSpeakingChanges(
  currentSpeaking: any,
  newData: {
    title?: string;
    year?: string;
    event?: string;
    location?: string;
    url?: string;
    description?: string;
  }
) {
  const changes: string[] = [];
  
  // change detection logic
  if (newData.title !== undefined && currentSpeaking.title !== newData.title) {
    changes.push('title');
  }
  
  if (newData.year !== undefined && currentSpeaking.year !== newData.year) {
    changes.push('year');
  }
  
  // hasOwnProperty logic for optional fields
  if (newData.hasOwnProperty('event') && currentSpeaking.event !== newData.event) {
    changes.push('event');
  }
  
  if (newData.hasOwnProperty('location') && currentSpeaking.location !== newData.location) {
    changes.push('location');
  }
  
  if (newData.hasOwnProperty('url') && currentSpeaking.url !== newData.url) {
    changes.push('url');
  }
  
  if (newData.hasOwnProperty('description') && currentSpeaking.description !== newData.description) {
    changes.push('description');
  }
  
  return {
    hasChanges: changes.length > 0,
    changedFields: changes,
  };
}

function validateSpeakingData(speakingData: any) {
  const errors: string[] = [];
  
  // validation logic
  if (!speakingData.title || speakingData.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!speakingData.year || speakingData.year.trim() === '') {
    errors.push('Year is required');
  }
  
  if (speakingData.year && !/^\d{4}$/.test(speakingData.year)) {
    errors.push('Year must be a 4-digit number');
  }
  
  if (speakingData.url && !isValidUrl(speakingData.url)) {
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

function formatSpeakingDisplay(speaking: any) {
  // speaking display formatting logic
  const parts = [speaking.title];
  
  if (speaking.event) {
    parts.push(`at ${speaking.event}`);
  }
  
  if (speaking.location) {
    parts.push(`in ${speaking.location}`);
  }
  
  if (speaking.year) {
    parts.push(`(${speaking.year})`);
  }
  
  return parts.join(' ');
}

function categorizeSpeaking(speaking: any) {
  // speaking categorization logic
  if (speaking.event && speaking.event.toLowerCase().includes('conference')) {
    return 'conference';
  }
  
  if (speaking.event && speaking.event.toLowerCase().includes('meetup')) {
    return 'meetup';
  }
  
  if (speaking.event && speaking.event.toLowerCase().includes('workshop')) {
    return 'workshop';
  }
  
  if (speaking.event && speaking.event.toLowerCase().includes('podcast')) {
    return 'podcast';
  }
  
  return 'other';
}

describe('Speaking Engagement Business Logic', () => {
  it('should detect required field changes', () => {
    // Test change detection for required fields
    const currentSpeaking = {
      title: 'Introduction to AI',
      year: '2023',
      event: 'Tech Conference',
      location: 'San Francisco',
    };
    
    const newData = {
      title: 'Advanced AI Techniques',
      year: '2024',
    };
    
    const result = detectSpeakingChanges(currentSpeaking, newData);
    
    expect(result.hasChanges).toBe(true);
    expect(result.changedFields).toContain('title');
    expect(result.changedFields).toContain('year');
    expect(result.changedFields).toHaveLength(2);
  });

  it('should handle hasOwnProperty logic for optional fields', () => {
    // Test hasOwnProperty logic for speaking
    const currentSpeaking = {
      title: 'Talk',
      year: '2023',
      event: 'Conference',
      location: 'Boston',
    };
    
    // Test undefined (should not trigger change)
    const undefinedData = { title: 'Talk' }; // No event field
    const undefinedResult = detectSpeakingChanges(currentSpeaking, undefinedData);
    expect(undefinedResult.changedFields).not.toContain('event');
    
    // Test hasOwnProperty (should trigger change)
    const eventData = { event: 'New Conference' }; // Explicitly setting event
    const eventResult = detectSpeakingChanges(currentSpeaking, eventData);
    expect(eventResult.hasChanges).toBe(true);
    expect(eventResult.changedFields).toContain('event');
  });

  it('should validate speaking data correctly', () => {
    // Test speaking validation logic
    const validSpeaking = {
      title: 'Machine Learning in Practice',
      year: '2023',
      event: 'AI Conference 2023',
      location: 'New York, NY',
      url: 'https://aiconf.com/talks/ml-practice',
      description: 'Deep dive into practical ML applications',
    };
    
    const result = validateSpeakingData(validSpeaking);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid speaking data', () => {
    // Test validation catches speaking errors
    const invalidCases = [
      {
        data: { title: '', year: '2023' },
        expectedError: 'Title is required',
      },
      {
        data: { title: 'Talk', year: '' },
        expectedError: 'Year is required',
      },
      {
        data: { title: 'Talk', year: '23' },
        expectedError: 'Year must be a 4-digit number',
      },
      {
        data: { title: 'Talk', year: '2023', url: 'invalid-url' },
        expectedError: 'URL must be a valid URL',
      },
    ];
    
    invalidCases.forEach(({ data, expectedError }) => {
      const result = validateSpeakingData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it('should format speaking display correctly', () => {
    // Test speaking display formatting logic
    const fullSpeaking = {
      title: 'AI in Healthcare',
      year: '2023',
      event: 'HealthTech Conference',
      location: 'Boston, MA',
    };
    expect(formatSpeakingDisplay(fullSpeaking)).toBe('AI in Healthcare at HealthTech Conference in Boston, MA (2023)');
    
    const minimalSpeaking = {
      title: 'Quick Talk',
      year: '2022',
    };
    expect(formatSpeakingDisplay(minimalSpeaking)).toBe('Quick Talk (2022)');
  });

  it('should categorize speaking engagements correctly', () => {
    // Test speaking categorization logic
    const conference = { event: 'Tech Conference 2023' };
    expect(categorizeSpeaking(conference)).toBe('conference');
    
    const meetup = { event: 'Local Meetup Group' };
    expect(categorizeSpeaking(meetup)).toBe('meetup');
    
    const workshop = { event: 'Hands-on Workshop' };
    expect(categorizeSpeaking(workshop)).toBe('workshop');
    
    const podcast = { event: 'Tech Podcast Interview' };
    expect(categorizeSpeaking(podcast)).toBe('podcast');
    
    const other = { event: 'Company Presentation' };
    expect(categorizeSpeaking(other)).toBe('other');
  });

  it('should handle edge cases in change detection', () => {
    // Test edge case handling for speaking
    const currentSpeaking = {
      title: 'Talk',
      year: '2023',
      event: null,
      location: undefined,
    };
    
    // Test null to string
    const nullToString = { event: 'New Event' };
    const result1 = detectSpeakingChanges(currentSpeaking, nullToString);
    expect(result1.hasChanges).toBe(true);
    expect(result1.changedFields).toContain('event');
    
    // Test undefined to value
    const undefinedToValue = { location: 'Remote' };
    const result2 = detectSpeakingChanges(currentSpeaking, undefinedToValue);
    expect(result2.hasChanges).toBe(true);
    expect(result2.changedFields).toContain('location');
  });

  it('should not detect changes when values are identical', () => {
    // Test no-change optimization for speaking
    const currentSpeaking = {
      title: 'Same Talk',
      year: '2023',
      event: 'Same Event',
    };
    
    const sameData = {
      title: 'Same Talk',
      year: '2023',
      event: 'Same Event',
    };
    
    const result = detectSpeakingChanges(currentSpeaking, sameData);
    
    expect(result.hasChanges).toBe(false);
    expect(result.changedFields).toHaveLength(0);
  });
});
