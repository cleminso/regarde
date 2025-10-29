import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyRegardeAuthViaServer } from "../verify-token/verifyApi";

describe("verifyRegardeAuthViaServer", () => {
  const mockParams = {
    baseUrl: "https://api.example.com",
    jazzAccountId: "account-123",
    regardeAuth: "test-token-123",
    regardeAuthId: "token-id-456",
    apiToken: "test-api-token",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call the verify endpoint with correct headers", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: true }),
    });
    global.fetch = mockFetch;

    await verifyRegardeAuthViaServer(mockParams);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/verify",
      expect.objectContaining({
        method: "POST",
        headers: {
          "X-Registration-Token": "test-token-123",
          "X-Registration-Token-Id": "token-id-456",
          "X-Regarde-Account-Id": "account-123",
          "X-API-Token": "test-api-token",
        },
      }),
    );
  });

  it("should return isValid true on successful verification", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: true }),
    });
    global.fetch = mockFetch;

    const result = await verifyRegardeAuthViaServer(mockParams);

    expect(result).toEqual({ isValid: true });
  });

  it("should return isValid false with error on failed verification", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: false, error: "Invalid token" }),
    });
    global.fetch = mockFetch;

    const result = await verifyRegardeAuthViaServer(mockParams);

    expect(result).toEqual({ isValid: false, error: "Invalid token" });
  });

  it("should handle non-ok response status", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });
    global.fetch = mockFetch;

    const result = await verifyRegardeAuthViaServer(mockParams);

    expect(result).toEqual({
      isValid: false,
      error: "Server returned 403: Forbidden",
    });
  });

  it("should handle network errors", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    global.fetch = mockFetch;

    const result = await verifyRegardeAuthViaServer(mockParams);

    expect(result).toEqual({
      isValid: false,
      error: "Network error",
    });
  });

  it("should handle unknown errors", async () => {
    const mockFetch = vi.fn().mockRejectedValue("Unknown error");
    global.fetch = mockFetch;

    const result = await verifyRegardeAuthViaServer(mockParams);

    expect(result).toEqual({
      isValid: false,
      error: "Unknown error",
    });
  });

  it("should pass abort signal if provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: true }),
    });
    global.fetch = mockFetch;

    const controller = new AbortController();
    await verifyRegardeAuthViaServer({
      ...mockParams,
      signal: controller.signal,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: controller.signal,
      }),
    );
  });

  it("should handle aborted requests", async () => {
    const controller = new AbortController();
    const mockFetch = vi
      .fn()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));
    global.fetch = mockFetch;

    controller.abort();

    const result = await verifyRegardeAuthViaServer({
      ...mockParams,
      signal: controller.signal,
    });

    expect(result).toEqual({
      isValid: false,
      error: "Aborted",
    });
  });
});
