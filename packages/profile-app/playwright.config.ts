import { defineConfig, devices } from "@playwright/test";
import { clerkSetup } from "@clerk/testing/playwright";
// @ts-ignore - is-ci doesn't have types but works fine
import isCI from "is-ci";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

/**
 * Focused E2E Test Configuration for Jazz Profile App
 * Tests 2 core user journeys: new user registration and existing user login
 * Follows "test YOUR logic, trust the framework" philosophy
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",
  timeout: 60000,

  use: {
    baseURL: "http://localhost:5174/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    permissions: ["clipboard-read", "clipboard-write"],
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  webServer: [
    {
      command: "pnpm dev --port 5174",
      url: "http://localhost:5174/",
      reuseExistingServer: !isCI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: "PORT=3001 pnpm start:bun",
      url: "http://localhost:3001/health",
      cwd: "../profile-worker",
      reuseExistingServer: !isCI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});

const hasClerkCredentials = process.env.CLERK_SECRET_KEY &&
  process.env.CLERK_SECRET_KEY.startsWith('sk_test_');

if (hasClerkCredentials) {
  console.log('🔐 Configuring Playwright with Clerk testing support...');
  clerkSetup();
} else {
  console.log('⚠️  Clerk credentials not found - some tests may be skipped');
}
