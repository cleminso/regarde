import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRegistrationKey } from '../auth/getRegistrationKey';
import { KEY_LIFETIME_SECONDS } from '../auth/utils';

describe('getRegistrationKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate and set a new key on the CoMap', async () => {
    const mockSet = vi.fn();
    const mockWaitForSync = vi.fn().mockResolvedValue(undefined);
    
    const mockCoMap = {
      $jazz: {
        set: mockSet,
        waitForSync: mockWaitForSync,
      },
    } as any;

    const result = await getRegistrationKey({ loadedRegistrationKeyCoMap: mockCoMap });

    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(16);
    
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith('key', expect.any(String));
    expect(mockSet).toHaveBeenCalledWith('expiresAt', expect.any(Number));
    
    expect(mockWaitForSync).toHaveBeenCalledTimes(1);
  });

  it('should set expiry to 24 hours from now', async () => {
    const mockSet = vi.fn();
    const mockWaitForSync = vi.fn().mockResolvedValue(undefined);
    
    const mockCoMap = {
      $jazz: {
        set: mockSet,
        waitForSync: mockWaitForSync,
      },
    } as any;

    const beforeCall = Date.now();
    await getRegistrationKey({ loadedRegistrationKeyCoMap: mockCoMap });
    const afterCall = Date.now();

    const expiresAtCall = mockSet.mock.calls.find(call => call[0] === 'expiresAt');
    expect(expiresAtCall).toBeDefined();
    
    const expiresAt = expiresAtCall![1];
    const expectedMin = beforeCall + KEY_LIFETIME_SECONDS * 1000;
    const expectedMax = afterCall + KEY_LIFETIME_SECONDS * 1000;
    
    expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
    expect(expiresAt).toBeLessThanOrEqual(expectedMax);
  });

  it('should return null if CoMap is null', async () => {
    const result = await getRegistrationKey({ loadedRegistrationKeyCoMap: null as any });
    expect(result).toBeNull();
  });

  it('should return null if CoMap is undefined', async () => {
    const result = await getRegistrationKey({ loadedRegistrationKeyCoMap: undefined as any });
    expect(result).toBeNull();
  });

  it('should return null and log error if set throws', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockSet = vi.fn().mockImplementation(() => {
      throw new Error('Set failed');
    });
    
    const mockCoMap = {
      $jazz: {
        set: mockSet,
        waitForSync: vi.fn(),
      },
    } as any;

    const result = await getRegistrationKey({ loadedRegistrationKeyCoMap: mockCoMap });

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to store registration key:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });

  it('should return null and log error if waitForSync throws', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockSet = vi.fn();
    const mockWaitForSync = vi.fn().mockRejectedValue(new Error('Sync failed'));
    
    const mockCoMap = {
      $jazz: {
        set: mockSet,
        waitForSync: mockWaitForSync,
      },
    } as any;

    const result = await getRegistrationKey({ loadedRegistrationKeyCoMap: mockCoMap });

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to store registration key:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });
});

