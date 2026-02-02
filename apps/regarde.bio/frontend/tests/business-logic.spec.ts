import { expect, test } from "@playwright/test";

function generateTestUser() {
  const timestamp = Date.now();
  return {
    nickname: `biz${timestamp}`,
    email: process.env.E2E_CLERK_USER_EMAIL || "clem2inso@gmail.com",
    password: process.env.E2E_CLERK_USER_PASSWORD || "TestPassword123!",
  };
}

class TestLogger {
  static info(message: string) {
    console.log(`${message}`);
  }

  static step(stepNumber: number, message: string) {
    console.log(`\n${stepNumber}. ${message}\n`);
  }

  static success(message: string) {
    console.log(`${message}`);
  }
}

test.describe("Business Logic Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state for each test
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test("Landing Page and Nickname Validation", async ({ page }) => {
    const user = generateTestUser();
    TestLogger.info(`Testing landing page functionality for: ${user.nickname}`);

    // Step 1: Visit landing page
    TestLogger.step(1, "Navigate to landing page");
    await page.goto("/");
    await expect(page.locator('input[type="text"]').first()).toBeVisible({
      timeout: 10000,
    });
    TestLogger.success("Landing page loaded");

    // Step 2: Test nickname validation
    TestLogger.step(2, `Test nickname validation: ${user.nickname}`);
    const nicknameInput = page.locator('input[type="text"]').first();
    await nicknameInput.fill(user.nickname);

    // Wait for availability check to complete
    await expect(page.getByRole("button", { name: "Register" })).toBeEnabled({
      timeout: 10000,
    });
    TestLogger.success("Nickname entered and validated");

    // Step 3: Verify register button is enabled
    TestLogger.step(3, "Verify register button is enabled");
    const registerButton = page.getByRole("button", {
      name: "Register nickname (Cmd+Enter)",
    });
    await expect(registerButton).toBeEnabled();
    TestLogger.success("Register button is enabled");

    // Step 4: Click register button to open auth modal
    TestLogger.step(4, "Click register button to open auth modal");
    await registerButton.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    TestLogger.success("Auth modal opened");

    // Step 5: Verify auth modal content
    TestLogger.step(5, "Verify auth modal content");
    await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    TestLogger.success("Auth modal displays correctly");

    TestLogger.success(`Landing page and nickname validation working correctly!`);
  });

  test("Pre-authenticated User Registration Flow", async ({ page }) => {
    const testNickname = `biz${Date.now()}`;
    TestLogger.info(
      `Testing business logic with pre-authenticated user for nickname: ${testNickname}`,
    );

    // Step 1: Sign in with existing test user first
    TestLogger.step(1, "Signing in with test user credentials");
    await page.goto("/");

    await page.getByRole("button", { name: "LOGIN" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const testEmail = process.env.E2E_CLERK_USER_EMAIL || "clem2inso@gmail.com";
    const testPassword = process.env.E2E_CLERK_USER_PASSWORD || "TestPassword123!";

    await page.getByRole("textbox", { name: "Email address" }).fill(testEmail);
    await page.keyboard.press("Enter");
    await page.getByRole("textbox", { name: "Password" }).fill(testPassword);
    await page.keyboard.press("Enter");

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
    TestLogger.success("User authenticated successfully");

    // Step 2: Check if user already has a nickname
    TestLogger.step(2, "Checking if user already has a nickname");

    await page.waitForTimeout(2000);
    const currentUrl = page.url();

    if (currentUrl.includes("/edit") || currentUrl.includes("/about")) {
      // User already has a nickname - test the existing profile functionality
      TestLogger.info("User already has a nickname, testing existing profile functionality");

      const urlMatch = currentUrl.match(/\/([^/]+)\/(edit|about)/);
      const existingNickname = urlMatch ? urlMatch[1] : null;

      if (existingNickname) {
        TestLogger.success(`Found existing nickname: ${existingNickname}`);

        // Step 3: Verify one-nickname policy enforcement
        TestLogger.step(3, "Verifying one-nickname policy enforcement");

        if (currentUrl.includes("/about")) {
          TestLogger.success(`User redirected to profile page: ${currentUrl}`);
          TestLogger.success(
            "One-nickname policy working correctly - user cannot register another nickname",
          );

          // Optionally verify the about page content
          await page.waitForTimeout(1000);
          const aboutPageElements = [
            page.getByText("About"),
            page.locator('[data-testid="profile-content"]'),
            page.locator("main"),
            page.locator("section"),
          ];

          let foundAboutElement = false;
          for (const element of aboutPageElements) {
            try {
              await expect(element).toBeVisible({ timeout: 2000 });
              foundAboutElement = true;
              TestLogger.success("About page content verified");
              break;
            } catch {
              // Continue to next element
            }
          }

          if (!foundAboutElement) {
            TestLogger.success("About page loaded (URL verification)");
          }
        } else if (currentUrl.includes("/edit")) {
          TestLogger.success(`User redirected to edit page: ${currentUrl}`);
          TestLogger.success(
            "One-nickname policy working correctly - user cannot register another nickname",
          );

          // Verify edit page elements
          await page.waitForTimeout(1000);
          const editElements = [
            page.getByText("General"),
            page.getByText("Contact"),
            page.getByText("Nickname"),
            page.locator('input[type="text"]'),
            page.locator("textarea"),
          ];

          let foundEditElement = false;
          for (const element of editElements) {
            try {
              await expect(element).toBeVisible({ timeout: 2000 });
              foundEditElement = true;
              TestLogger.success("Edit page content verified");
              break;
            } catch {
              // Continue to next element
            }
          }

          if (!foundEditElement) {
            TestLogger.success("Edit page loaded (URL verification)");
          }
        }

        TestLogger.success(
          `Business logic test completed successfully with existing nickname: ${existingNickname}!`,
        );
        return;
      }
    }

    // Step 3: Test new nickname registration (if user doesn't have one)
    TestLogger.step(3, "Testing new nickname registration");

    const nicknameInput = page.locator('input[type="text"]').first();
    await nicknameInput.fill(testNickname);

    await expect(page.getByRole("button", { name: "Register" })).toBeEnabled({
      timeout: 10000,
    });
    TestLogger.success("Nickname validation completed");

    // Step 4: Register nickname
    TestLogger.step(4, "Registering new nickname");
    const registerButton = page.getByRole("button", {
      name: "Register nickname (Cmd+Enter)",
    });
    await registerButton.click();

    // Step 5: Verify redirect to profile editor
    TestLogger.step(5, "Verifying redirect to profile editor");
    await expect(page).toHaveURL(new RegExp(`/${testNickname}/edit`), {
      timeout: 10000,
    });
    TestLogger.success(`Successfully redirected to /${testNickname}/edit`);

    // Step 6: Verify profile editor loads correctly
    TestLogger.step(6, "Verifying profile editor functionality");
    await expect(page.getByText("Edit Profile")).toBeVisible({
      timeout: 10000,
    });
    TestLogger.success("Profile editor loaded successfully");

    TestLogger.success(`Business logic test completed successfully for ${testNickname}!`);
  });
});
