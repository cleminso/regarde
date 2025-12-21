import {
  type ToolConfig,
  SimpleChalk as chalk,
} from "@alcyone-labs/arg-parser";
import fetch from "node-fetch";
import {
  loadAuthenticatedRegardeSDK,
  getAuthenticationHeaders,
} from "../authUtils.js";
import { createApp } from "@regarde-dev/sdk/app";

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
    console.log(chalk.blue("Validating authentication..."));

    try {
      // Use shared authentication utility - handles all credential loading and regardeSDK initialization
      const regardeSDK = await loadAuthenticatedRegardeSDK();

      console.log(chalk.green("✓ Authentication valid"));

      // Get authentication headers for API request
      const authHeaders = getAuthenticationHeaders(regardeSDK);

      // Create the app client-side first
      console.log(chalk.blue("Creating app..."));
      const app = await createApp(regardeSDK, {
        name: ctx.args.name,
        description: "",
        paymentProvider: ctx.args.paymentProvider,
      });

      console.log(chalk.green("✓ App created successfully"));
      console.log(chalk.blue("Registering app via API..."));

      // Register the existing app with the API
      const payload = {
        appId: app.$jazz.id,
      };

      // Include authentication headers in API request
      const response = await fetch("https://api.regarde.dev/register-app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Handle authentication errors specifically
        if (response.status === 401 || response.status === 403) {
          console.error(chalk.red("Authentication failed. Please re-login."));
          return { success: false, error: "Authentication failed" };
        }

        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      console.log(chalk.green("App registered successfully!"));
      console.log(chalk.blue("Webhook URL:"), data.webhookUrl);
      console.log(chalk.blue("App ID:"), data.appId);

      return { success: true, data };
    } catch (error: any) {
      console.error(chalk.red("Failed to register app:"), error.message);

      // Provide helpful error messages for common issues
      if (
        error.message.includes("Authentication") ||
        error.message.includes("Not logged in")
      ) {
        console.error(
          chalk.yellow("Try running 'regarde login' to refresh your session."),
        );
      }

      return { success: false, error: error.message };
    }
  },
};
