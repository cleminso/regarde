import { type ToolConfig, SimpleChalk } from "@alcyone-labs/arg-parser";
import fetch from "node-fetch";
import {
  loadAuthenticatedRegardeSDK,
  getAuthenticationHeaders,
} from "../authUtils.js";
import { createApp, RegardeAccount } from "@regarde-dev/core";
import { co } from "jazz-tools";

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
    console.log(SimpleChalk.blue("Validating authentication..."));

    try {
      // Use stored credentials from previous login
      const { regardeSDK, account } = await loadAuthenticatedRegardeSDK();
      if (!account.$isLoaded)
        throw new Error("Account not loaded after loadAuthenticatedRegardeSDK");
      if (!account.root.$isLoaded)
        throw new Error(
          "Account root not loaded after loadAuthenticatedRegardeSDK",
        );

      console.log(SimpleChalk.green("✓ Authentication valid"));

      // Get authentication headers for API request
      const authHeaders = getAuthenticationHeaders(regardeSDK);

      // Create the app client-side first
      console.log(SimpleChalk.blue("Creating app..."));

      const app = await createApp(account, {
        name: ctx.args.name,
        description: "",
        paymentProvider: ctx.args.paymentProvider,
      });

      console.log(SimpleChalk.green("✓ App created successfully"));
      console.log(SimpleChalk.blue("Registering app via API..."));

      // Register the existing app with the API
      const payload = {
        appId: app.$jazz.id,
        jazzAccountId: account.$jazz.id,
      };

      // Include authentication headers in API request
      const response = await fetch("http://localhost:3000/register-app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      const responseSuccessful = response.ok === true;
      if (responseSuccessful === false) {
        const errorText = await response.text();

        if (response.status === 401 || response.status === 403) {
          console.error(
            SimpleChalk.red("Authentication failed. Please re-login."),
          );
          return { success: false, error: "Authentication failed" };
        }

        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data: RegisterAppResponse = await response.json();

      // Validate response structure
      const responseDataValid =
        data.appId !== null &&
        data.webhookUrl !== null &&
        data.webhookSecret !== null;
      if (responseDataValid === false) {
        throw new Error("Invalid API response format");
      }

      // Display successful registration details to user
      console.log(SimpleChalk.green("✓ App registered successfully!"));
      console.log(SimpleChalk.blue("Registration Details:"));
      console.log(`  • App ID: ${data.appId}`);
      console.log(`  • Webhook URL: ${data.webhookUrl}`);
      console.log(`  • Webhook Secret: ${data.webhookSecret}`);

      console.log(
        SimpleChalk.green("App is now available for payment subscriptions"),
      );

      const result = { success: true, data };

      // Force process exit for clean termination
      setTimeout(() => process.exit(0), 100);

      return result;
    } catch (error: any) {
      console.error(SimpleChalk.red("Failed to register app:"), error.message);

      const authRelatedError =
        error.message.includes("Authentication") === true ||
        error.message.includes("Not logged in") === true;
      if (authRelatedError === true) {
        console.error(
          SimpleChalk.yellow(
            "Try running 'regarde login' to refresh your session.",
          ),
        );
      }

      // Force process exit on error
      setTimeout(() => process.exit(1), 100);

      return { success: false, error: error.message };
    }
  },
};
