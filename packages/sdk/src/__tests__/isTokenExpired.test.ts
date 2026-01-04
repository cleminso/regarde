import { describe, it, expect } from "vitest";
import { isTokenExpired } from "#managers/auth";

describe("isKeyExpired", () => {
  it("should return false for future expiry", () => {
    const futureKey = { expiresAt: Date.now() + 10000 };
    expect(isTokenExpired(futureKey)).toBe(false);
  });

  it("should return true for past expiry", () => {
    const pastKey = { expiresAt: Date.now() - 10000 };
    expect(isTokenExpired(pastKey)).toBe(true);
  });

  it("should return true for null expiresAt", () => {
    const noExpiryKey = { expiresAt: null };
    expect(isTokenExpired(noExpiryKey)).toBe(true);
  });

  it("should return true for undefined expiresAt", () => {
    const noExpiryKey = { expiresAt: undefined };
    expect(isTokenExpired(noExpiryKey)).toBe(true);
  });

  it("should return true for null key", () => {
    expect(isTokenExpired(null)).toBe(true);
  });

  it("should return true for undefined key", () => {
    expect(isTokenExpired(undefined)).toBe(true);
  });

  it("should return true for key without expiresAt property", () => {
    const invalidKey = { key: "some-key" };
    expect(isTokenExpired(invalidKey)).toBe(true);
  });

  it("should handle edge case of expiry exactly at current time", () => {
    const now = Date.now();
    const keyExpiringNow = { expiresAt: now };
    expect(isTokenExpired(keyExpiringNow)).toBe(false);
  });
});
