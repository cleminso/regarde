import { ToolConfig, SimpleChalk } from "@alcyone-labs/arg-parser";
import inquirer from "inquirer";
import { getStoredCredentials } from "../auth.js";
import { startWorker } from "jazz-tools/worker";
import { RegardeAccount } from "@regarde-dev/core";
import { authStorage } from "../utils/storage.js";
import { hasMinimumWords } from "../utils/passphraseAuth.js";

import { mnemonicToEntropy, validateMnemonic } from "@scure/bip39";

import { NapiCrypto } from "jazz-tools/napi";

import { wordlist } from "@scure/bip39/wordlists/english.js";
import z from "zod";

const crypto = await NapiCrypto.create();

export const loginTool: ToolConfig = {
  name: "login",
  description: "Login to Regarde using your Jazz Account ID and passphrase",
  flags: [],
  handler: async () => {
    const existingCreds = await getStoredCredentials();

    if (existingCreds) {
      const schema = z.object({
        accountID: z.string(),
        accountSecret: z.string(),
        passphrase: z.string(),
        authMethod: z.string(),
      });

      const creds = schema.parse(JSON.parse(existingCreds));
      console.log(SimpleChalk.green(`Already logged in as ${creds.accountID}`));

      try {
        const syncServer =
          process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";
        const apiKey = process.env.JAZZ_API_KEY;
        const syncServerWithKey = apiKey
          ? `${syncServer}?apiKey=${apiKey}`
          : syncServer;

        await startWorker({
          AccountSchema: RegardeAccount,
          syncServer: syncServerWithKey,
          accountID: creds.accountID,
          accountSecret: creds.accountSecret,
        });
        process.exit(0);
      } catch (error: unknown) {
        console.error(
          SimpleChalk.red(
            "Stored credentials are invalid. Please login again.",
          ),
        );
      }
    }

    const { jazzAccountId } = await inquirer.prompt([
      {
        type: "input",
        name: "jazzAccountId",
        message: "Enter your Jazz Account ID (starts with 'co_'):",
        validate: (input) => {
          const trimmedInput = input.trim();
          const isValidAccountFormat = trimmedInput.startsWith("co_");
          if (isValidAccountFormat === false) {
            return "Account ID must start with 'co_'";
          }
          return true;
        },
      },
    ]);

    let { passphrase } = await inquirer.prompt([
      {
        type: "password",
        name: "passphrase",
        message: "Enter your passphrase (12-24 words):",
        validate: (input) => {
          const trimmedInput = input.trim();
          const words = trimmedInput.split(" ");
          if (!trimmedInput) return "Passphrase is required";
          if (!hasMinimumWords(trimmedInput)) {
            return "Passphrase must be at least 12 words";
          }
          if (words.length > 24) {
            return "Passphrase must be at most 24 words";
          }
          if (!validateMnemonic(trimmedInput, wordlist)) {
            return "Invalid passphrase. Check spelling and spacing.";
          }
          return true;
        },
      },
    ]);

    passphrase = passphrase.trim();

    const seed = mnemonicToEntropy(passphrase, wordlist);
    const accountSecret = crypto.agentSecretFromSecretSeed(seed);

    const syncServer =
      process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";
    const apiKey = process.env.JAZZ_API_KEY || "clem2inso@gmail.com";
    const syncServerWithKey = `${syncServer}?apiKey=${apiKey}`;

    const workerOptions = {
      AccountSchema: RegardeAccount,
      syncServer: syncServerWithKey,
      accountID: jazzAccountId,
      accountSecret,
    };

    try {
      console.log("Authenticating...");

      const { worker } = await startWorker(workerOptions);
      await worker.$jazz.ensureLoaded({ resolve: { root: true } });

      const storedCredentials = {
        accountID: jazzAccountId,
        accountSecret,
        passphrase,
        authMethod: "passphrase",
      };

      try {
        await authStorage.set(JSON.stringify(storedCredentials));
        console.log(SimpleChalk.green("Credentials saved locally"));
      } catch (storageError: unknown) {
        console.error("Warning: Credentials not saved");
        console.error("  You will need to re-login next session");
      }

      console.log(SimpleChalk.green("Login successful!"));
      process.exit(0);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("accountSecret")) {
        console.error(SimpleChalk.red("Authentication failed"));
        console.error("  Verify your Account ID is correct");
        console.error("  Check your passphrase spelling and spacing");
      } else {
        console.error(SimpleChalk.red("Login failed:"), errorMessage);
        console.error("  Check your network connection and try again");
      }

      return { success: false, error: errorMessage };
    }
  },
};
