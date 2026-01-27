import { resolve } from "path";

import { config } from "dotenv";

// Load .env.test for integration tests (from package root)
config({ path: resolve(__dirname, "../../.env.test") });
