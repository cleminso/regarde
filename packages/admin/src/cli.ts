#!/usr/bin/env node
import "dotenv/config";
import { createCLI } from "./cli/index.js";

// Create and execute the CLI
async function main() {
  try {
    const cli = createCLI();
    await cli.parse(process.argv.slice(2));
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
