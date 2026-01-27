import { ArgParser } from "@alcyone-labs/arg-parser";
import { describe, expect, it, vi } from "vitest";

import { TEST_PASSPHRASE_12 } from "./testPassphrase.js";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

vi.mock("../auth.js", () => {
  return {
    getStoredCredentials: vi.fn(async () => null),
  };
});

const mockInquirerPrompt = vi.fn(async (questions: any[]) => {
  const names = questions.map((q) => q.name);
  if (names.includes("jazzAccountId")) return { jazzAccountId: "co_123" };
  if (names.includes("passphrase")) {
    return { passphrase: TEST_PASSPHRASE_12 };
  }
  return {};
});

vi.mock("inquirer", () => {
  return {
    default: {
      prompt: mockInquirerPrompt,
    },
  };
});

const mockStartWorker = vi.fn(async () => {
  return { worker: { $jazz: { ensureLoaded: vi.fn(async () => {}) } } };
});

vi.mock("jazz-tools/worker", () => {
  return {
    startWorker: mockStartWorker,
  };
});

vi.mock("jazz-tools/napi", () => {
  return {
    NapiCrypto: {
      create: vi.fn(async () => ({
        agentSecretFromSecretSeed: vi.fn(() => "secret"),
      })),
    },
  };
});

vi.mock("../utils/storage.js", () => {
  return {
    authStorage: {
      set: vi.fn(async () => {}),
      get: vi.fn(async () => null),
      clear: vi.fn(async () => {}),
    },
  };
});

describe("login contract", () => {
  it("prompts for account + passphrase and returns structured ok output", async () => {
    mockStartWorker.mockResolvedValueOnce({
      worker: { $jazz: { ensureLoaded: vi.fn(async () => {}) } },
    });

    const { loginTool } = await import("../tools/login.js");

    const cli = new ArgParser({ appName: "Test", appCommandName: "test" });
    cli.addTool(loginTool);

    const result = await cli.parse(["login"]);
    expect(result.handlerResponse).toEqual({
      ok: true,
      command: "login",
      data: {
        accountId: "co_123",
        authMethod: "passphrase",
        storedCredentials: true,
      },
    });
  });

  it("returns error when startWorker fails (network error)", async () => {
    mockStartWorker.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const { loginTool } = await import("../tools/login.js");

    const cli = new ArgParser({ appName: "Test", appCommandName: "test" });
    cli.addTool(loginTool);

    const result = await cli.parse(["login"]);
    expect(result.handlerResponse).toEqual({
      ok: false,
      command: "login",
      error: {
        code: "LOGIN_FAILED",
        message: "ECONNREFUSED",
      },
    });
  });

  it("returns error when authentication fails (invalid secret)", async () => {
    mockStartWorker.mockRejectedValueOnce(new Error("Invalid accountSecret provided"));

    const { loginTool } = await import("../tools/login.js");

    const cli = new ArgParser({ appName: "Test", appCommandName: "test" });
    cli.addTool(loginTool);

    const result = await cli.parse(["login"]);
    expect(result.handlerResponse).toEqual({
      ok: false,
      command: "login",
      error: {
        code: "LOGIN_FAILED",
        message: "Invalid accountSecret provided",
      },
    });
  });
});
