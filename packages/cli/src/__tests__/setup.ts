import { config } from "dotenv";
import { resolve } from "path";

// Load .env.test for integration tests (from package root)
config({ path: resolve(__dirname, "../../.env.test") });

