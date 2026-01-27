import { getRegardeAuth } from "#managers/auth";
import { TOKEN_LIFETIME_SECONDS } from "#managers/auth";
import { RegardeAuth } from "#schemas/regardeAuth";
import type { Loaded } from "jazz-tools";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("getRegardeAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate and set a new token on the CoMap", async () => {
    const mockSet = vi.fn();
    const mockWaitForSync = vi.fn().mockResolvedValue(undefined);

    const mockCoMap = {
      $isLoaded: true,
      $jazz: {
        set: mockSet,
        waitForSync: mockWaitForSync,
      },
    } as unknown as Loaded<typeof RegardeAuth>;

    const result = await getRegardeAuth({ loadedRegardeAuthCoMap: mockCoMap });

    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    expect(result).toHaveLength(16);

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith("token", expect.any(String));
    expect(mockSet).toHaveBeenCalledWith("expiresAt", expect.any(Number));

    expect(mockWaitForSync).toHaveBeenCalledTimes(1);
  });

  it("should set expiry to 24 hours from now", async () => {
    const mockSet = vi.fn();
    const mockWaitForSync = vi.fn().mockResolvedValue(undefined);

    const mockCoMap = {
      $isLoaded: true,
      $jazz: {
        set: mockSet,
        waitForSync: mockWaitForSync,
      },
    } as unknown as Loaded<typeof RegardeAuth>;

    const beforeCall = Date.now();
    await getRegardeAuth({ loadedRegardeAuthCoMap: mockCoMap });
    const afterCall = Date.now();

    const expiresAtCall = mockSet.mock.calls.find((call) => call[0] === "expiresAt");
    expect(expiresAtCall).toBeDefined();

    const expiresAt = expiresAtCall![1];
    const expectedMin = beforeCall + TOKEN_LIFETIME_SECONDS * 1000;
    const expectedMax = afterCall + TOKEN_LIFETIME_SECONDS * 1000;

    expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
    expect(expiresAt).toBeLessThanOrEqual(expectedMax);
  });

  it("should return null if CoMap is null", async () => {
    const result = await getRegardeAuth({
      loadedRegardeAuthCoMap: null,
    });
    expect(result).toBeNull();
  });

  it("should return null if CoMap is undefined", async () => {
    const result = await getRegardeAuth({
      loadedRegardeAuthCoMap: undefined,
    });
    expect(result).toBeNull();
  });

  it("should return null and log error if set throws", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockSet = vi.fn().mockImplementation(() => {
      throw new Error("Set failed");
    });

    const mockCoMap = {
      $isLoaded: true,
      $jazz: {
        set: mockSet,
        waitForSync: vi.fn(),
      },
    } as unknown as Loaded<typeof RegardeAuth>;

    const result = await getRegardeAuth({ loadedRegardeAuthCoMap: mockCoMap });

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[ERROR] Failed to store authentication token:",
      expect.any(Error),
      ". Verify Jazz network connection and account permissions.",
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return null and log error if waitForSync throws", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockSet = vi.fn();
    const mockWaitForSync = vi.fn().mockRejectedValue(new Error("Sync failed"));

    const mockCoMap = {
      $isLoaded: true,
      $jazz: {
        set: mockSet,
        waitForSync: mockWaitForSync,
      },
    } as unknown as Loaded<typeof RegardeAuth>;

    const result = await getRegardeAuth({ loadedRegardeAuthCoMap: mockCoMap });

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[ERROR] Failed to store authentication token:",
      expect.any(Error),
      ". Verify Jazz network connection and account permissions.",
    );

    consoleErrorSpy.mockRestore();
  });
});
