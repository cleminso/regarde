#!/usr/bin/env node
import { ArgParser } from "@alcyone-labs/arg-parser";
import { loginTool } from "./tools/login.js";
import { registerAppTool } from "./tools/registerApp.js";
import "dotenv/config";

const cli = new ArgParser({
  appName: "Regarde CLI",
  appCommandName: "regarde",
  description: "CLI for Regarde User",
});

cli.addTool(loginTool);
cli.addTool(registerAppTool);

async function main() {
  try {
    await cli.parse(process.argv.slice(2));
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
