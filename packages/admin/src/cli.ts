#!/usr/bin/env node
import "dotenv/config";

import { createCLI } from "./cli/index.js";

await createCLI()
  .parseIfExecutedDirectly(import.meta.url)
  .catch((error) => {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
