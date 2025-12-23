import { type IFlag, ToolConfig, SimpleChalk } from "@alcyone-labs/arg-parser";
import inquirer from "inquirer";
import { getStoredCredentials } from "../auth.js";
import { startWorker } from "jazz-tools/worker";
import { Account } from "jazz-tools";
import { ensureRegardeSDKLoaded } from "@regarde-dev/sdk/auth";
import { authStorage } from "../utils/storage.js";

export const loginTool: ToolConfig = {
  name: "login",
  description: "Login to Regarde using your Jazz Account ID and Account Secret",
  flags: [],
  handler: async () => {
    const existingCreds = await getStoredCredentials();

     if (existingCreds) {
       // Auto-login with stored credentials
       const creds = JSON.parse(existingCreds);
       console.log(SimpleChalk.blue("Using stored credentials..."));

        try {
          const { worker } = await startWorker({
            AccountSchema: Account,
            syncServer: "wss://cloud.jazz.tools",
            accountID: creds.accountID,
            accountSecret: creds.accountSecret,
          });

        console.log(
          SimpleChalk.green(`✓ Auto-authenticated as ${creds.accountID}`),
        );
        console.log(SimpleChalk.green("✓ Credentials valid - no login needed"));
        process.exit(0);
      } catch (error: any) {
        console.log(
          SimpleChalk.yellow("Stored credentials expired. Please re-login."),
        );
      }
    }

    // First-time login flow - get accountID and accountSecret
    console.log(
      SimpleChalk.blue("No stored credentials found. Please login..."),
    );
    console.log(
      SimpleChalk.blue("For existing Jazz accounts, Account Secret is required."),
    );

    // Step 1: Get Jazz Account ID
    const { jazzAccountId } = await inquirer.prompt([
      {
        type: "input",
        name: "jazzAccountId",
        message: "Enter your Jazz Account ID:",
        validate: (input) =>
          input.trim().length > 0 || "Account ID is required",
      },
    ]);

    // Step 2: Get Account Secret (primary method for existing accounts)
    const { accountSecret } = await inquirer.prompt([
      {
        type: "password",
        name: "accountSecret",
        message: "Enter your Jazz Account Secret:",
        validate: (input) =>
          input.trim().length > 0 || "Account Secret is required",
      },
    ]);

    const finalAccountSecret = accountSecret.trim();
    console.log(SimpleChalk.blue("Using provided account secret"));

    try {
      // Start worker with both accountID and accountSecret
      console.log(SimpleChalk.blue("Starting Jazz worker..."));
      const workerOptions = {
        AccountSchema: Account,
        syncServer: "wss://cloud.jazz.tools",
        accountID: jazzAccountId,
        accountSecret: finalAccountSecret,
      };
      console.log(SimpleChalk.blue("Worker options:"), JSON.stringify(workerOptions, null, 2));

      try {
        const { worker } = await startWorker(workerOptions);
        console.log(SimpleChalk.green("✓ Jazz worker started successfully"));
        console.log(SimpleChalk.green(`✓ Authenticated as ${jazzAccountId}`));
      } catch (workerError) {
        console.error(SimpleChalk.red("Worker start failed:"), workerError.message);
        
        if (workerError.message.includes("accountSecret")) {
          console.error(SimpleChalk.yellow("Unable to authenticate with provided credentials."));
          console.error(SimpleChalk.yellow("Please verify your credentials and try again."));
        }
        
        throw workerError;
      }

      console.log(
        SimpleChalk.green(`Successfully authenticated as ${jazzAccountId}`),
      );

      // Use shared authentication utility to initialize RegardeSDK
      console.log(
        SimpleChalk.blue("Initializing RegardeSDK and generating token..."),
      );
      await ensureRegardeSDKLoaded(jazzAccountId);

      console.log(
        SimpleChalk.green("✓ Token generated and stored successfully"),
      );
      console.log(SimpleChalk.blue("Token expires in 24 hours"));
      console.log("Credentials stored in RegardeSDK CoMap");

      // Store credentials for future CLI commands
      const storedCredentials = {
        accountID: jazzAccountId,
        accountSecret: finalAccountSecret, // Store the working accountSecret
      };
      await authStorage.set(JSON.stringify(storedCredentials));

      console.log(SimpleChalk.green("✓ Login credentials saved locally"));
      process.exit(0);
    } catch (error: any) {
      console.error(SimpleChalk.red("Login failed:"), error.message);
      return { success: false, error: error.message };
    }
  },
};
