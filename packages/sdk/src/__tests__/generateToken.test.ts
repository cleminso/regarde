import { describe, it, expect } from 'vitest';
import { generateRegardeAuth } from '../auth/generateKey';

describe('generateRegardeAuth', () => {
  it('should generate a key with correct length', () => {
    const key = generateRegardeAuth();
    expect(key).toHaveLength(16);
  });

  it('should generate a string', () => {
    const key = generateRegardeAuth();
    expect(typeof key).toBe('string');
  });

  it('should not have whitespace', () => {
    const key = generateRegardeAuth();
    expect(key.trim()).toBe(key);
  });

  it('should not be empty', () => {
    const key = generateRegardeAuth();
    expect(key).not.toBe('');
  });

  it('should only contain valid characters', () => {
    const key = generateRegardeAuth();
    const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"[]{}';
    const allCharsValid = key.split('').every(char => validChars.includes(char));
    expect(allCharsValid).toBe(true);
  });

  it('should generate unique keys', () => {
    const key1 = generateRegardeAuth();
    const key2 = generateRegardeAuth();
    expect(key1).not.toBe(key2);
  });

  it('should generate statistically unique keys over multiple iterations', () => {
    const keys = new Set<string>();
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      keys.add(generateRegardeAuth());
    }
    
    expect(keys.size).toBe(iterations);
  });
});

