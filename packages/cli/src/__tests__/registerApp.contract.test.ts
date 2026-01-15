import { ArgParser } from "@alcyone-labs/arg-parser";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.spyOn(console, "log").mockImplementation(() => { });
vi.spyOn(console, "error").mockImplementation(() => { });

vi.mock("../authUtils.js", () => {
  return {
    loadAuthenticatedRegardeSDK: vi.fn(async () => {
      return {
        regardeSDK: {
          $isLoaded: true,
          auth: {
            $isLoaded: true,
            expiresAt: Date.now() + 60_000,
            token: "token",
            $jazz: { id: "co_token" },
          },
        },
        account: {
          $isLoaded: true,
          root: { $isLoaded: true },
          $jazz: { id: "co_account" },
        },
      };
    }),
    getAuthenticationHeaders: vi.fn(() => ({
      "X-Regarde-Token": "token",
      "X-Regarde-Token-Id": "co_token",
    })),
  };
});

vi.mock("@regarde-dev/core", () => {
  return {
    createApp: vi.fn(async () => ({ $jazz: { id: "co_app" } })),
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchMock: any = vi.fn(async () => {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      appId: "co_app",
      webhookUrl: "https://example.com/webhook",
      webhookSecret: "secret",
    }),
    text: async () => "",
  };
});

vi.mock("node-fetch", () => ({ default: fetchMock }));

describe("register-app contract", () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  it("parses args via ArgParser and returns structured ok output", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        appId: "co_app",
        webhookUrl: "https://example.com/webhook",
        webhookSecret: "secret",
      }),
      text: async () => "",
    });

    const { registerAppTool } = await import("../tools/registerApp.js");

    const cli = new ArgParser({ appName: "Test", appCommandName: "test" });
    cli.addTool(registerAppTool);

    const result = await cli.parse([
      "register-app",
      "--name",
      "My App",
      "--payment-provider",
      "stripe",
    ]);

    expect(result.handlerResponse).toEqual({
      ok: true,
      command: "register-app",
      data: {
        appId: "co_app",
        webhookUrl: "https://example.com/webhook",
        webhookSecret: "secret",
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns error on 401 authentication failure", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
      text: async () => "Unauthorized",
    });

    const { registerAppTool } = await import("../tools/registerApp.js");

    const cli = new ArgParser({ appName: "Test", appCommandName: "test" });
    cli.addTool(registerAppTool);

    const result = await cli.parse([
      "register-app",
      "--name",
      "My App",
      "--payment-provider",
      "stripe",
    ]);

    expect(result.handlerResponse).toEqual({
      ok: false,
      command: "register-app",
      error: {
        code: "REGISTER_APP_FAILED",
        message: "Authentication failed",
      },
    });
  });

  it("returns error on 400 invalid request", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({}),
      text: async () => "Missing required field: name",
    });

    const { registerAppTool } = await import("../tools/registerApp.js");

    const cli = new ArgParser({ appName: "Test", appCommandName: "test" });
    cli.addTool(registerAppTool);

    const result = await cli.parse([
      "register-app",
      "--name",
      "My App",
      "--payment-provider",
      "stripe",
    ]);

    expect(result.handlerResponse).toEqual({
      ok: false,
      command: "register-app",
      error: {
        code: "REGISTER_APP_FAILED",
        message: "Invalid request",
      },
    });
  });

  it("returns error on 500 server error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
      text: async () => "Internal Server Error",
    });

    const { registerAppTool } = await import("../tools/registerApp.js");

    const cli = new ArgParser({ appName: "Test", appCommandName: "test" });
    cli.addTool(registerAppTool);

    const result = await cli.parse([
      "register-app",
      "--name",
      "My App",
      "--payment-provider",
      "stripe",
    ]);

    expect(result.handlerResponse).toEqual({
      ok: false,
      command: "register-app",
      error: {
        code: "REGISTER_APP_FAILED",
        message: "Server error: 500",
      },
    });
  });
});

