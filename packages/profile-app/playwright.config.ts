import { defineConfig, devices } from "@playwright/test";
import isCI from "is-ci";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: "http://localhost:5173/",

    trace: "on-first-retry",
    permissions: ["clipboard-read", "clipboard-write"],
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "pnpm build && pnpm preview --port 5173",
      url: "http://localhost:5173/",
      reuseExistingServer: !isCI,
      timeout: 120000,
    },
    {
      command: "pnpm dev",
      url: "http://localhost:3000/health",
      cwd: "../profile-worker",
      reuseExistingServer: !isCI,
      timeout: 120000,
    },
  ],
});
