import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyRegistrationKeyViaServer } from '../verify/client';

describe('verifyRegistrationKeyViaServer', () => {
  const mockParams = {
    baseUrl: 'https://api.example.com',
    jazzAccountId: 'account-123',
    registrationKey: 'test-key-123',
    registrationKeyId: 'key-id-456',
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call the verify endpoint with correct headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: true }),
    });
    global.fetch = mockFetch;

    await verifyRegistrationKeyViaServer(mockParams);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/verify',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'X-Registration-Key': 'test-key-123',
          'X-Registration-Key-Id': 'key-id-456',
          'X-Jazz-Account-Id': 'account-123',
          'X-API-Key': 'test-api-key',
        },
      })
    );
  });

  it('should return isValid true on successful verification', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: true }),
    });
    global.fetch = mockFetch;

    const result = await verifyRegistrationKeyViaServer(mockParams);

    expect(result).toEqual({ isValid: true });
  });

  it('should return isValid false with error on failed verification', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: false, error: 'Invalid key' }),
    });
    global.fetch = mockFetch;

    const result = await verifyRegistrationKeyViaServer(mockParams);

    expect(result).toEqual({ isValid: false, error: 'Invalid key' });
  });

  it('should handle non-ok response status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });
    global.fetch = mockFetch;

    const result = await verifyRegistrationKeyViaServer(mockParams);

    expect(result).toEqual({
      isValid: false,
      error: 'Server returned 403: Forbidden',
    });
  });

  it('should handle network errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    const result = await verifyRegistrationKeyViaServer(mockParams);

    expect(result).toEqual({
      isValid: false,
      error: 'Network error',
    });
  });

  it('should handle unknown errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue('Unknown error');
    global.fetch = mockFetch;

    const result = await verifyRegistrationKeyViaServer(mockParams);

    expect(result).toEqual({
      isValid: false,
      error: 'Unknown error',
    });
  });

  it('should pass abort signal if provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: true }),
    });
    global.fetch = mockFetch;

    const controller = new AbortController();
    await verifyRegistrationKeyViaServer({
      ...mockParams,
      signal: controller.signal,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: controller.signal,
      })
    );
  });

  it('should handle aborted requests', async () => {
    const controller = new AbortController();
    const mockFetch = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    global.fetch = mockFetch;

    controller.abort();

    const result = await verifyRegistrationKeyViaServer({
      ...mockParams,
      signal: controller.signal,
    });

    expect(result).toEqual({
      isValid: false,
      error: 'Aborted',
    });
  });
});

