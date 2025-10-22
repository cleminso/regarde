import { describe, it, expect } from 'vitest';
import { isKeyExpired } from '../auth/utils';

describe('isKeyExpired', () => {
  it('should return false for future expiry', () => {
    const futureKey = { expiresAt: Date.now() + 10000 };
    expect(isKeyExpired(futureKey)).toBe(false);
  });

  it('should return true for past expiry', () => {
    const pastKey = { expiresAt: Date.now() - 10000 };
    expect(isKeyExpired(pastKey)).toBe(true);
  });

  it('should return true for null expiresAt', () => {
    const noExpiryKey = { expiresAt: null };
    expect(isKeyExpired(noExpiryKey)).toBe(true);
  });

  it('should return true for undefined expiresAt', () => {
    const noExpiryKey = { expiresAt: undefined };
    expect(isKeyExpired(noExpiryKey)).toBe(true);
  });

  it('should return true for null key', () => {
    expect(isKeyExpired(null)).toBe(true);
  });

  it('should return true for undefined key', () => {
    expect(isKeyExpired(undefined)).toBe(true);
  });

  it('should return true for key without expiresAt property', () => {
    const invalidKey = { key: 'some-key' };
    expect(isKeyExpired(invalidKey)).toBe(true);
  });

  it('should handle edge case of expiry exactly at current time', () => {
    const now = Date.now();
    const keyExpiringNow = { expiresAt: now };
    expect(isKeyExpired(keyExpiringNow)).toBe(false);
  });
});

