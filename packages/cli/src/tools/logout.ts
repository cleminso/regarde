import { ToolConfig, SimpleChalk as chalk } from "@alcyone-labs/arg-parser";
import { clearCredentials } from "../utils/storage.js";
import { getStoredCredentials } from "../auth.js";
import { loadAuthenticatedRegardeSDK } from "../authUtils.js";

export const logoutTool: ToolConfig = {
  name: "logout",
  description: "Logout from Regarde and clear stored credentials",
  flags: [],
  handler: async () => {
    const credsStr = await getStoredCredentials();
    if (!credsStr) {
      console.log(
        chalk.yellow(
          "No stored credentials found. You are already logged out.",
        ),
      );
      return { success: true };
    }

    let creds;
    try {
      creds = JSON.parse(credsStr);
    } catch (e) {
      console.log(
        chalk.yellow("Invalid credentials format. Clearing anyway..."),
      );
    }

    const { accountID } = creds || {};
    if (accountID) {
      try {
        console.log(
          chalk.blue("Clearing authentication token from RegardeSDK..."),
        );

        // Use shared authentication utility to load RegardeSDK with proper typing
        const regardeSDK = await loadAuthenticatedRegardeSDK();

        if (regardeSDK.auth?.$isLoaded) {
          // Clear the authentication token by setting it to invalid
          regardeSDK.auth.$jazz.set({
            token: "cleared-" + Math.random(),
            expiresAt: 0,
          });
          console.log(
            chalk.green("✓ Authentication token cleared from RegardeSDK"),
          );
        } else {
          console.log(
            chalk.yellow("RegardeSDK or auth not loaded for token cleanup"),
          );
        }
      } catch (error: any) {
        console.log(
          chalk.yellow(
            `Warning: Could not clear RegardeSDK token: ${error.message}`,
          ),
        );
      }
    }

    // Clear local credential storage
    try {
      await clearCredentials();
      console.log(chalk.green("✓ Local credentials cleared"));
    } catch (error: any) {
      console.log(
        chalk.yellow(
          `Warning: Could not clear local credentials: ${error.message}`,
        ),
      );
    }

    console.log(chalk.green("Logout successful!"));
    return { success: true };
  },
};
