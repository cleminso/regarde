import { type IFlag, ToolConfig, SimpleChalk } from "@alcyone-labs/arg-parser";
import inquirer from "inquirer";
import { getStoredCredentials } from "../auth.js";
import { startWorker } from "jazz-tools/worker";
import { ensureRegardeSDKLoaded } from "@regarde-dev/sdk/auth";
import { RegardeAccount } from "@regarde-dev/sdk/auth";
import { authStorage } from "../utils/storage.js";
import {
  generateCredentialsFromPassphrase,
  validatePassphrase,
  hasMinimumWords,
} from "../utils/passphraseAuth.js";
import { co } from "jazz-tools";

export const loginTool: ToolConfig = {
  name: "login",
  description: "Login to Regarde using your Jazz Account ID and passphrase",
  flags: [],
  handler: async () => {
    const existingCreds = await getStoredCredentials();

    if (existingCreds) {
      // Auto-login with stored credentials
      const creds = JSON.parse(existingCreds);
      console.log(SimpleChalk.blue("Using stored credentials..."));

      try {
        const { worker } = await startWorker({
          AccountSchema: RegardeAccount,
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

    // First-time login flow - get accountID and passphrase
    console.log(
      SimpleChalk.blue("No stored credentials found. Please login..."),
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

    // Step 2: Get Passphrase
    const { passphrase } = await inquirer.prompt([
      {
        type: "password",
        name: "passphrase",
        message: "Enter your passphrase (12+ words):",
        validate: (input) => {
          const trimmedInput = input.trim();
          if (!trimmedInput) return "Passphrase is required";
          if (!hasMinimumWords(trimmedInput)) {
            return "Passphrase must be at least 12 words";
          }
          if (!validatePassphrase(trimmedInput)) {
            return "Invalid passphrase format. Check spelling and spacing.";
          }
          return true;
        },
      },
    ]);

    console.log(SimpleChalk.blue("Generating credentials from passphrase..."));

    try {
      // Step 3: Generate credentials from passphrase
      const credentials = await generateCredentialsFromPassphrase(
        passphrase.trim(),
      );

      // Step 4: Test credentials with Jazz worker
      console.log(SimpleChalk.blue("Verifying credentials..."));
      const workerOptions = {
        AccountSchema: RegardeAccount,
        syncServer: "wss://cloud.jazz.tools",
        accountID: jazzAccountId,
        accountSecret: credentials.accountSecret,
      };

      try {
        const { worker } = await startWorker(workerOptions);
        console.log(SimpleChalk.green("✓ Jazz worker started successfully"));

        // Step 5: Initialize RegardeSDK within the worker context
        console.log(
          SimpleChalk.blue("Initializing RegardeSDK and generating token..."),
        );

        // Wait for worker to be fully loaded before proceeding
        const loadedWorker = await worker.$jazz.ensureLoaded({
          resolve: { root: true },
        });

        if (!worker.$isLoaded) {
          throw new Error("BUG");
        }

        // Now call ensureRegardeSDKLoaded with the worker's account
        // TODO: Investigate how to premove this as any that TS is happy
        await ensureRegardeSDKLoaded(worker as any);

        console.log(
          SimpleChalk.green("✓ Token generated and stored successfully"),
        );
        console.log(SimpleChalk.blue("Token expires in 24 hours"));

        // Step 6: Store credentials for future CLI commands
        const storedCredentials = {
          accountID: jazzAccountId,
          accountSecret: credentials.accountSecret,
          passphrase: passphrase.trim(),
          authMethod: "passphrase",
        };
        await authStorage.set(JSON.stringify(storedCredentials));

        console.log(SimpleChalk.green("✓ Login credentials saved locally"));
        process.exit(0);
      } catch (workerError) {
        console.error(
          SimpleChalk.red("Worker start failed:"),
          workerError.message,
        );

        if (workerError.message.includes("accountSecret")) {
          console.error(
            SimpleChalk.yellow(
              "Authentication failed. Please verify your account ID and passphrase.",
            ),
          );
        } else {
          console.error(
            SimpleChalk.yellow(
              "Network error. Please check your connection and try again.",
            ),
          );
        }

        throw workerError;
      }
    } catch (error: any) {
      console.error(SimpleChalk.red("Login failed:"), error.message);
      console.error(
        SimpleChalk.yellow("Please verify your credentials and try again."),
      );
      return { success: false, error: error.message };
    }
  },
};
