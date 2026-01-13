import { type ToolConfig, SimpleChalk } from "@alcyone-labs/arg-parser";
import fetch from "node-fetch";
import {
  loadAuthenticatedRegardeSDK,
  getAuthenticationHeaders,
} from "../authUtils.js";
import { createApp, RegardeAccount } from "@regarde-dev/core";

interface RegisterAppResponse {
  appId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  message?: string;
}

export const registerAppTool: ToolConfig = {
  name: "register-app",
  description: "Register a new App in the Regarde registry",
  flags: [
    {
      name: "name",
      type: "string",
      mandatory: true,
      options: ["--name"],
      description: "Name of the App",
    },
    {
      name: "paymentProvider",
      type: "string",
      mandatory: true,
      options: ["--payment-provider"],
      enum: ["lemonsqueezy", "stripe"],
      description: "Payment provider (lemonsqueezy or stripe)",
    },
    {
      name: "description",
      type: "string",
      mandatory: false,
      options: ["--description"],
      description: "Description of the App",
    },
  ],
  handler: async (ctx) => {
    console.log(SimpleChalk.blue("Registering app..."));

    try {
      const { regardeSDK, account } = await loadAuthenticatedRegardeSDK();
      if (!account.$isLoaded)
        throw new Error("Account not loaded after loadAuthenticatedRegardeSDK");
      if (!account.root.$isLoaded)
        throw new Error(
          "Account root not loaded after loadAuthenticatedRegardeSDK",
        );

      const app = await createApp(account, {
        name: ctx.args.name,
        description: "",
        paymentProvider: ctx.args.paymentProvider,
      });

      const payload = {
        appId: app.$jazz.id,
        jazzAccountId: account.$jazz.id,
      };

      const authHeaders = getAuthenticationHeaders(regardeSDK);

      // API request
      const response = await fetch("http://localhost:3000/register-app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      // Handle API errors with meaningful messages
      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401 || response.status === 403) {
          console.error(SimpleChalk.red("Authentication failed"));
          console.error(
            SimpleChalk.grey("  Run 'regarde login' to refresh your session"),
          );
          throw new Error("Authentication failed");
        }

        if (response.status === 400) {
          console.error(SimpleChalk.red("Invalid request"));
          console.error(SimpleChalk.grey("  Server message:"), errorText);
          throw new Error("Invalid request");
        }

        if (response.status === 404) {
          console.error(SimpleChalk.red("API endpoint not found"));
          console.error(
            SimpleChalk.grey(
              "  Make sure the API server is running at http://localhost:3000",
            ),
          );
          throw new Error("API endpoint not found");
        }

        if (response.status >= 500) {
          console.error(SimpleChalk.red("Server error"));
          console.error(
            SimpleChalk.yellow(`  Status: ${response.status} - ${errorText}`),
          );
          console.error(SimpleChalk.grey("  Try again or contact support"));
          throw new Error(`Server error: ${response.status}`);
        }

        // Generic error for other status codes
        console.error(SimpleChalk.red("API request failed"));
        console.error(
          SimpleChalk.yellow(`  Status: ${response.status}`),
          errorText,
        );
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data: RegisterAppResponse = await response.json();

      // Validate response structure
      const responseDataValid =
        data.appId !== null &&
        data.webhookUrl !== null &&
        data.webhookSecret !== null;
      if (responseDataValid === false) {
        console.error(SimpleChalk.red("Invalid API response format"));
        console.error(
          SimpleChalk.yellow("  Expected: appId, webhookUrl, webhookSecret"),
        );
        throw new Error("Invalid API response format");
      }

      // Display successful registration details to user
      console.log(SimpleChalk.green("✓ App registered successfully!"));
      console.log(SimpleChalk.yellow("App Configuration:"));
      console.log(SimpleChalk.gray(`  App ID: ${data.appId}`));
      console.log(SimpleChalk.gray(`  Webhook URL: ${data.webhookUrl}`));
      console.log(SimpleChalk.gray(`  Webhook Secret: ${data.webhookSecret}`));

      console.log(
        SimpleChalk.green("App is now available for payment subscriptions"),
      );

      setTimeout(() => process.exit(0), 100);

      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Categorize and display appropriate error messages
      if (
        errorMessage.includes("Authentication") ||
        errorMessage.includes("Not logged in")
      ) {
        console.error(SimpleChalk.red("Authentication failed"));
        console.error(
          SimpleChalk.yellow("  Run 'regarde login' to refresh your session"),
        );
      } else if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("ECONNREFUSED")
      ) {
        console.error(SimpleChalk.red("Failed to connect to API"));
        console.error(
          SimpleChalk.yellow(
            "  Make sure the API server is running at http://localhost:3000",
          ),
        );
      } else if (
        errorMessage.includes("Network") ||
        errorMessage.includes("ETIMEDOUT")
      ) {
        console.error(SimpleChalk.red("Network error"));
        console.error(SimpleChalk.yellow("  Check your internet connection"));
      } else {
        console.error(SimpleChalk.red("Failed to register app"), errorMessage);
      }

      setTimeout(() => process.exit(1), 100);

      return { success: false, error: errorMessage };
    }
  },
};
