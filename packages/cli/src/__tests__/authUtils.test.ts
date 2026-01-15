import { describe, expect, it, vi } from "vitest";

import { getAuthenticationHeaders, isAuthenticationValid } from "../authUtils.js";

describe("authUtils", () => {
  it("isAuthenticationValid returns false when auth is missing", () => {
    const regardeSDK = { $isLoaded: true } as any;
    expect(isAuthenticationValid(regardeSDK)).toBe(false);
  });

  it("isAuthenticationValid returns false when token is expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const regardeSDK = {
      $isLoaded: true,
      auth: {
        $isLoaded: true,
        expiresAt: Date.now() - 1,
        token: "t",
        $jazz: { id: "co_token" },
      },
    } as any;

    expect(isAuthenticationValid(regardeSDK)).toBe(false);

    vi.useRealTimers();
  });

  it("getAuthenticationHeaders returns expected headers when auth is valid", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const regardeSDK = {
      $isLoaded: true,
      auth: {
        $isLoaded: true,
        expiresAt: Date.now() + 60_000,
        token: "token",
        $jazz: { id: "co_token" },
      },
    } as any;

    expect(getAuthenticationHeaders(regardeSDK)).toEqual({
      "X-Regarde-Token": "token",
      "X-Regarde-Token-Id": "co_token",
    });

    vi.useRealTimers();
  });

  it("getAuthenticationHeaders throws when auth is invalid", () => {
    const regardeSDK = {
      $isLoaded: true,
      auth: {
        $isLoaded: true,
        expiresAt: 0,
        token: "token",
        $jazz: { id: "co_token" },
      },
    } as any;

    expect(() => getAuthenticationHeaders(regardeSDK)).toThrow(
      "Authentication not valid. Please re-login.",
    );
  });
});
