import { type ToolConfig, SimpleChalk } from "@alcyone-labs/arg-parser";
import fetch from "node-fetch";
import {
  loadAuthenticatedRegardeSDK,
  getAuthenticationHeaders,
} from "../authUtils.js";
import { createApp } from "@regarde-dev/sdk/app";
import { co } from "jazz-tools";
import { type TRegardeAccount } from "@regarde-dev/sdk/auth";

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
      const { regardeSDK, accountID } = await loadAuthenticatedRegardeSDK();

      console.log(SimpleChalk.green("✓ Authentication valid"));

      // Get authentication headers for API request
      const authHeaders = getAuthenticationHeaders(regardeSDK);

      // Create the app client-side first
      console.log(SimpleChalk.blue("Creating app..."));
      const app = await createApp(regardeSDK, {
        name: ctx.args.name,
        description: "",
        paymentProvider: ctx.args.paymentProvider,
      });

      console.log(SimpleChalk.green("✓ App created successfully"));
      console.log(SimpleChalk.blue("Registering app via API..."));

      // Register the existing app with the API
      const payload = {
        appId: app.$jazz.id,
        jazzAccountId: accountID,
      };

      // Include authentication headers in API request
      console.log("[DEBUG] Starting fetch request...");
      const response = await fetch("http://localhost:3000/register-app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      console.log("[DEBUG] Response status:", response.status);
      console.log("[DEBUG] Response ok:", response.ok);

      const responseOk = response.ok === true;
      if (responseOk === false) {
        console.log("[DEBUG] Response was not ok, reading error text...");
        const errorText = await response.text();
        console.log("[DEBUG] Error text:", errorText);

        if (response.status === 401 || response.status === 403) {
          console.error(
            SimpleChalk.red("Authentication failed. Please re-login."),
          );
          return { success: false, error: "Authentication failed" };
        }

        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      console.log("[DEBUG] Response was ok, parsing JSON...");
      const data = await response.json();

      console.log("[DEBUG] Parsed data:", data);
      console.log(SimpleChalk.green("✓ App registered successfully"));

      const result = { success: true, data };
      console.log("[DEBUG] Returning result:", result);
      return result;
    } catch (error: any) {
      console.error(SimpleChalk.red("Failed to register app:"), error.message);

      const authRelatedError =
        error.message.includes("Authentication") ||
        error.message.includes("Not logged in");
      if (authRelatedError === true) {
        console.error(
          SimpleChalk.yellow(
            "Try running 'regarde login' to refresh your session.",
          ),
        );
      }

      return { success: false, error: error.message };
    }
  },
};
