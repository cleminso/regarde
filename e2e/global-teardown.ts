import { FullConfig } from "@playwright/test";

/**
 * Global teardown for E2E tests
 * Cleans up test environment and resources
 */
async function globalTeardown(config: FullConfig) {
  console.log("Starting E2E test environment cleanup...");

  // Add any cleanup logic here if needed
  // For now, just log completion

  console.log("E2E test environment cleanup complete");
}

export default globalTeardown;
