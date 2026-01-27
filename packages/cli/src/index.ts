#!/usr/bin/env node
import "dotenv/config";

import { ArgParser } from "@alcyone-labs/arg-parser";

import { loginTool } from "./tools/login.js";
import { registerAppTool } from "./tools/registerApp.js";
import { signupTool } from "./tools/signup.js";

const cli = new ArgParser({
  appName: "Regarde CLI",
  appCommandName: "regarde",
  description: "CLI for Regarde User",
});

cli.addTool(loginTool);
cli.addTool(signupTool);
cli.addTool(registerAppTool);

async function main() {
  try {
    const result = await cli.parse(process.argv.slice(2));
    if (typeof result === "object" && result !== null && "ok" in result) {
      const ok = (result as { ok?: boolean }).ok === true;
      process.exit(ok ? 0 : 1);
    }
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
