import { ArgParser } from "@alcyone-labs/arg-parser";
import { describe, expect, it, vi } from "vitest";

import { TEST_PASSPHRASE_24 } from "./testPassphrase.js";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

vi.mock("@scure/bip39", () => {
  return {
    generateMnemonic: vi.fn(() => TEST_PASSPHRASE_24),
    mnemonicToEntropy: vi.fn(() => new Uint8Array([1, 2, 3])),
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

vi.mock("cojson-transport-ws", () => {
  return {
    createWebSocketPeer: vi.fn(() => ({ id: "upstream" })),
  };
});

const mockCreateJazzContext = vi.fn(async () => {
  return {
    account: {
      $jazz: {
        id: "co_new",
        waitForAllCoValuesSync: vi.fn(async () => {}),
      },
    },
  };
});

vi.mock("jazz-tools", () => {
  return {
    MockSessionProvider: class MockSessionProvider {},
    createJazzContextForNewAccount: mockCreateJazzContext,
  };
});

vi.mock("jazz-tools/worker", () => {
  return {
    startWorker: vi.fn(async () => {
      return { worker: { $jazz: { ensureLoaded: vi.fn(async () => {}) } } };
    }),
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

// Node doesn't have WebSocket in Vitest node env by default
(globalThis as any).WebSocket = class WebSocket {
  
};

describe("signup contract", () => {
  it("returns structured ok output with 24-word passphrase", async () => {
    mockCreateJazzContext.mockResolvedValueOnce({
      account: {
        $jazz: {
          id: "co_new",
          waitForAllCoValuesSync: vi.fn(async () => {}),
        },
      },
    });

    const { signupTool } = await import("../tools/signup.js");

    const cli = new ArgParser({ appName: "Test", appCommandName: "test" });
    cli.addTool(signupTool);

    const result = await cli.parse(["signup"]);

    expect(result.handlerResponse).toEqual({
      ok: true,
      command: "signup",
      data: {
        accountId: "co_new",
        passphrase: TEST_PASSPHRASE_24,
        storedCredentials: true,
      },
    });
  });

  it("returns error when account creation fails", async () => {
    mockCreateJazzContext.mockRejectedValueOnce(new Error("Network connection failed"));

    const { signupTool } = await import("../tools/signup.js");

    const cli = new ArgParser({ appName: "Test", appCommandName: "test" });
    cli.addTool(signupTool);

    const result = await cli.parse(["signup"]);

    expect(result.handlerResponse).toEqual({
      ok: false,
      command: "signup",
      error: {
        code: "SIGNUP_FAILED",
        message: "Network connection failed",
      },
    });
  });
});
