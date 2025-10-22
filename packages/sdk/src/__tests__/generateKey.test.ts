import { describe, it, expect } from 'vitest';
import { generateRegistrationKey } from '../auth/generateKey';

describe('generateRegistrationKey', () => {
  it('should generate a key with correct length', () => {
    const key = generateRegistrationKey();
    expect(key).toHaveLength(16);
  });

  it('should generate a string', () => {
    const key = generateRegistrationKey();
    expect(typeof key).toBe('string');
  });

  it('should not have whitespace', () => {
    const key = generateRegistrationKey();
    expect(key.trim()).toBe(key);
  });

  it('should not be empty', () => {
    const key = generateRegistrationKey();
    expect(key).not.toBe('');
  });

  it('should only contain valid characters', () => {
    const key = generateRegistrationKey();
    const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"[]{}';
    const allCharsValid = key.split('').every(char => validChars.includes(char));
    expect(allCharsValid).toBe(true);
  });

  it('should generate unique keys', () => {
    const key1 = generateRegistrationKey();
    const key2 = generateRegistrationKey();
    expect(key1).not.toBe(key2);
  });

  it('should generate statistically unique keys over multiple iterations', () => {
    const keys = new Set<string>();
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      keys.add(generateRegistrationKey());
    }
    
    expect(keys.size).toBe(iterations);
  });
});

