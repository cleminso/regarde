import { type IFlag, ToolConfig, SimpleChalk } from "@alcyone-labs/arg-parser";
import inquirer from "inquirer";
import { createPassphraseAuth } from "../auth.js";
import { startWorker } from "jazz-tools/worker";
import { Account } from "jazz-tools";
import { ensureRegardeSDKLoaded } from "@regarde-dev/sdk/auth";
import { authStorage } from "../utils/storage.js";
import { getStoredCredentials } from "../auth.js";

export const loginTool: ToolConfig = {
  name: "login",
  description: "Login to Regarde using your passphrase",
  flags: [],
  handler: async () => {
    const existingCreds = await getStoredCredentials();

    if (existingCreds) {
      // Auto-login with stored credentials
      const creds = JSON.parse(existingCreds);
      console.log(SimpleChalk.blue("Using stored credentials..."));

      try {
        createPassphraseAuth(creds.passphrase);
        const { worker } = await startWorker({
          AccountSchema: Account,
          syncServer: "wss://cloud.jazz.tools",
        });

        console.log(
          SimpleChalk.green(`✓ Auto-authenticated as ${worker.$jazz.id}`),
        );
        console.log(SimpleChalk.green("✓ Credentials valid - no login needed"));
        process.exit(0);
      } catch (error: any) {
        console.log(
          SimpleChalk.yellow("Stored credentials expired. Please re-login."),
        );
      }
    }

    // First-time login flow
    console.log(
      SimpleChalk.blue("No stored credentials found. Please login..."),
    );

    const { passphrase } = await inquirer.prompt([
      {
        type: "password",
        name: "passphrase",
        message: "Enter your passphrase:",
        validate: (input) =>
          input.trim().split(" ").length >= 12 ||
          "Passphrase must be at least 12 words",
      },
    ]);

    console.log(SimpleChalk.blue("Authenticating..."));

    try {
      createPassphraseAuth(passphrase);

      // Start worker - Jazz will use the authStorage that was set up in createPassphraseAuth
      const { worker } = await startWorker({
        AccountSchema: Account,
        syncServer: "wss://cloud.jazz.tools",
      });

      console.log(
        SimpleChalk.green(`Successfully authenticated as ${worker.$jazz.id}`),
      );

      // Use shared authentication utility to initialize RegardeSDK
      console.log(
        SimpleChalk.blue("Initializing RegardeSDK and generating token..."),
      );
      await ensureRegardeSDKLoaded(worker.$jazz.id);

      console.log(
        SimpleChalk.green("✓ Token generated and stored successfully"),
      );
      console.log(SimpleChalk.blue("Token expires in 24 hours"));
      console.log("Credentials stored in RegardeSDK CoMap");

      // Store credentials for future CLI commands (including passphrase for authStorage)
      const credentials = {
        regarde: {
          jazzAccountId: worker.$jazz.id,
          passphrase: passphrase, // Store for future auth
        },
      };
      await authStorage.set(JSON.stringify(credentials));

      console.log(SimpleChalk.green("✓ Login credentials saved locally"));
      process.exit(0);
    } catch (error: any) {
      console.error(SimpleChalk.red("Login failed:"), error.message);
      return { success: false, error: error.message };
    }
  },
};
