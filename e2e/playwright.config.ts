import { defineConfig, devices } from "@playwright/test";
import isCI from "is-ci";

/**
 * E2E test configuration for onboarding.jazz application
 * Following Jazz.tools ecosystem patterns for reliable E2E testing
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests sequentially to avoid data conflicts */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: isCI,
  /* Retry on CI for flaky network conditions */
  retries: isCI ? 2 : 1,
  /* Single worker to ensure test isolation */
  workers: 1,
  /* Reporter to use */
  reporter: isCI ? "github" : "html",

  /* Shared settings for all tests */
  use: {
    /* Base URL for the application */
    baseURL: "http://localhost:5173/",
    
    /* Collect trace when retrying failed tests */
    trace: "on-first-retry",
    
    /* Screenshot on failure */
    screenshot: "only-on-failure",
    
    /* Video recording for debugging */
    video: "retain-on-failure",
    
    /* Permissions needed for clipboard operations */
    permissions: ["clipboard-read", "clipboard-write"],
    
    /* Timeout for individual actions */
    actionTimeout: 10000,
    
    /* Timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Global test timeout */
  timeout: 60000,

  /* Start local dev servers before running tests */
  webServer: [
    {
      command: "pnpm dev",
      url: "http://localhost:5173/",
      reuseExistingServer: !isCI,
      timeout: 120000,
    },
    {
      command: "pnpm -F profile-worker dev",
      url: "http://localhost:8787/health",
      reuseExistingServer: !isCI,
      timeout: 120000,
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve("./global-setup.ts"),
  globalTeardown: require.resolve("./global-teardown.ts"),
});
