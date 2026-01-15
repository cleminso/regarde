import { describe, expect, it } from "vitest";

import { loginTool } from "../tools/login.js";
import { registerAppTool } from "../tools/registerApp.js";
import { signupTool } from "../tools/signup.js";

describe("tool output schemas", () => {
  it("login schema accepts ok result", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema = loginTool.outputSchema as any;
    const parsed = schema.parse({
      ok: true,
      command: "login",
      data: {
        accountId: "co_123",
        authMethod: "passphrase",
        storedCredentials: true,
      },
    });
    expect(parsed.ok).toBe(true);
  });

  it("signup schema accepts ok result", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema = signupTool.outputSchema as any;
    const parsed = schema.parse({
      ok: true,
      command: "signup",
      data: {
        accountId: "co_123",
        passphrase: "word ".repeat(12).trim(),
        storedCredentials: true,
      },
    });
    expect(parsed.ok).toBe(true);
  });

  it("register-app schema accepts ok result", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema = registerAppTool.outputSchema as any;
    const parsed = schema.parse({
      ok: true,
      command: "register-app",
      data: {
        appId: "co_app",
        webhookUrl: "https://example.com/webhook",
        webhookSecret: "secret",
      },
    });
    expect(parsed.ok).toBe(true);
  });
});



