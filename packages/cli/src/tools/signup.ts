import { ToolConfig, SimpleChalk } from "@alcyone-labs/arg-parser";
import { startWorker } from "jazz-tools/worker";
import {
  createJazzContextForNewAccount,
  MockSessionProvider,
} from "jazz-tools";

import { createWebSocketPeer } from "cojson-transport-ws";

import { RegardeAccount } from "@regarde-dev/core";
import { authStorage } from "../utils/storage.js";

import { wordlist } from "@scure/bip39/wordlists/english.js";
import { generateMnemonic, mnemonicToEntropy } from "@scure/bip39";

import { NapiCrypto } from "jazz-tools/napi";
import { z } from "zod";

const crypto = await NapiCrypto.create();
const sessionProvider = new MockSessionProvider();

export const signupTool: ToolConfig = {
  name: "signup",
  description: "Create a new Jazz Account and login",
  flags: [],
  outputSchema: z.object({
    ok: z.boolean(),
    command: z.literal("signup"),
    data: z
      .object({
        accountId: z.string(),
        passphrase: z.string(),
        storedCredentials: z.boolean(),
      })
      .optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .optional(),
  }),
  handler: async () => {
    console.log(SimpleChalk.blue("Creating your Regarde account..."));

    console.log(SimpleChalk.blue("Generating your passphrase..."));

    const passphrase = generateMnemonic(wordlist, 256);

    // Display passphrase cleanly
    console.log();
    console.log(SimpleChalk.grey("────────────────────────────────────────"));
    console.log(SimpleChalk.white("  YOUR PASSPHRASE"));
    console.log();
    console.log(SimpleChalk.white(`  ${passphrase}`));
    console.log();
    console.log(
      SimpleChalk.red(
        "  IMPORTANT: Save this passphrase now. You cannot recover it!",
      ),
    );
    console.log(SimpleChalk.grey("────────────────────────────────────────"));
    console.log();

    const seed = mnemonicToEntropy(passphrase, wordlist);
    const accountSecret = crypto.agentSecretFromSecretSeed(seed);

    try {
      console.log(SimpleChalk.blue("Creating your account..."));

      const syncServer =
        process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";
      const apiKey = process.env.JAZZ_API_KEY;
      const syncServerWithKey = apiKey
        ? `${syncServer}?apiKey=${apiKey}`
        : syncServer;

      const peer = createWebSocketPeer({
        id: "upstream",
        websocket: new WebSocket(syncServerWithKey),
        role: "server",
      });

      const jazzContext = createJazzContextForNewAccount({
        creationProps: { name: "Regarde user" },
        crypto,
        peers: [peer],
        sessionProvider,
        initialAgentSecret: accountSecret,
        AccountSchema: RegardeAccount,
      });

      // Wait for all data to sync to cloud
      (await jazzContext).account.$jazz.waitForAllCoValuesSync();

      const accountId = (await jazzContext).account.$jazz.id;

      console.log(SimpleChalk.blue(`Your Account ID: ${accountId}`));
      console.log(SimpleChalk.green("✓ Account created successfully"));

      // Start worker to verify setup and init SDK
      const workerOptions = {
        AccountSchema: RegardeAccount,
        syncServer: syncServerWithKey,
        accountID: accountId,
        accountSecret,
      };

      const { worker } = await startWorker(workerOptions);
      await worker.$jazz.ensureLoaded({ resolve: { root: true } });

      // Save credentials locally
      const storedCredentials = {
        accountID: accountId,
        accountSecret,
        passphrase,
        authMethod: "passphrase",
      };

      try {
        await authStorage.set(JSON.stringify(storedCredentials));
        console.log(
          SimpleChalk.green(
            "✓ Login credentials saved locally ~/.local/share/regarde/auth.json",
          ),
        );
      } catch {
        console.error("Warning: Credentials not saved");
        console.error("  You will need to re-login next session");
      }

      return {
        ok: true,
        command: "signup",
        data: {
          accountId,
          passphrase,
          storedCredentials: true,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error(SimpleChalk.red("Account creation failed:"), errorMessage);
      console.error("  Check your network connection");
      console.error("  Try running 'regarde signup' again");

      return {
        ok: false,
        command: "signup",
        error: {
          code: "SIGNUP_FAILED",
          message: errorMessage,
        },
      };
    }
  },
};
