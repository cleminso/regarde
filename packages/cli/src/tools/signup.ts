import { ToolConfig, SimpleChalk } from "@alcyone-labs/arg-parser";
import { startWorker } from "jazz-tools/worker";
import {
  CoValue,
  createJazzContextForNewAccount,
  ID,
  MockSessionProvider,
} from "jazz-tools";

import { createWebSocketPeer } from "cojson-transport-ws";

import { initRegardeSDK, RegardeAccount } from "@regarde-dev/core";
import { authStorage } from "../utils/storage.js";

import { wordlist } from "@scure/bip39/wordlists/english.js";
import { generateMnemonic, mnemonicToEntropy } from "@scure/bip39";

import { NapiCrypto } from "jazz-tools/napi";

const crypto = await NapiCrypto.create();
const sessionProvider = new MockSessionProvider();

export const signupTool: ToolConfig = {
  name: "signup",
  description: "Create a new Jazz Account and login",
  flags: [],
  handler: async () => {
    // First-time login flow - get accountID and passphrase
    console.log(SimpleChalk.blue("Signing you up brother"));
    console.log(SimpleChalk.blue("Generating credentials..."));

    const passphrase = generateMnemonic(wordlist, 256);
    console.debug(SimpleChalk.red(`Passphrase: ${passphrase}`));

    try {
      console.log(SimpleChalk.yellow(`Starting...`));
      const seed = mnemonicToEntropy(passphrase, wordlist);

      // Step 3: Generate credentials from passphrase
      const accountSecret = crypto.agentSecretFromSecretSeed(seed);

      console.log("accountSecret", accountSecret);

      const peer = createWebSocketPeer({
        id: "upstream",
        websocket: new WebSocket(
          "wss://cloud.jazz.tools?apiKey=clem2inso@gmail.com",
        ),
        role: "server",
      });

      console.log("peer");

      const jazzContext = createJazzContextForNewAccount({
        creationProps: { name: "Regarde user" },
        crypto,
        peers: [peer],
        sessionProvider,
        initialAgentSecret: accountSecret,
        AccountSchema: RegardeAccount,
      });

      console.log("jazzContent");

      (await jazzContext).account.$jazz.waitForAllCoValuesSync();

      console.log("all synced");

      const accountId = (await jazzContext).account.$jazz.id;

      console.log("AccountID (sync'ed):", accountId);

      console.log(SimpleChalk.blue("Verifying credentials..."));
      const workerOptions = {
        AccountSchema: RegardeAccount,
        syncServer: "wss://cloud.jazz.tools?apiKey=clem2inso@gmail.com",
        accountID: accountId,
        accountSecret,
      };

      try {
        const { worker } = await startWorker(workerOptions);
        console.log(SimpleChalk.green("✓ Jazz worker started successfully"));

        // Step 5: Initialize RegardeSDK within the worker context
        console.log(
          SimpleChalk.blue("Initializing RegardeSDK and generating token..."),
        );

        // Wait for worker to be fully loaded before proceeding
        await worker.$jazz.ensureLoaded({
          resolve: { root: true },
        });

        if (!worker.$isLoaded) {
          throw new Error("BUG");
        }

        await initRegardeSDK(
          worker,
          "ensure",
          "co_z8XvuCPopRqTxNWbcy8yVKLg9SQ" as ID<CoValue>,
        );

        console.log(
          SimpleChalk.green("✓ Token generated and stored successfully"),
        );
        console.log(SimpleChalk.blue("Token expires in 24 hours"));

        // Step 6: Store credentials for future CLI commands
        const storedCredentials = {
          accountID: accountId,
          accountSecret,
          passphrase,
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
