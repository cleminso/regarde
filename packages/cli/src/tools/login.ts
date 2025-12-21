import { type IFlag, ToolConfig, SimpleChalk } from "@alcyone-labs/arg-parser";
import inquirer from "inquirer";
import { createPassphraseAuth } from "../auth.js";
import { startWorker } from "jazz-tools/worker";
import { Account, co } from "jazz-tools";
import { ensureRegardeSDKLoaded } from "@regarde-dev/sdk/auth";

export const loginTool: ToolConfig = {
  name: "login",
  description: "Login to Regarde using your passphrase",
  flags: [],
  handler: async () => {
    // Ask for passphrase
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
      const auth = createPassphraseAuth(passphrase);

      // Start worker with Jazz authentication
      const { worker } = await startWorker({
        AccountSchema: Account,
        auth,
        syncServer: "wss://cloud.jazz.tools",
      });

      console.log(
        SimpleChalk.green(`Successfully authenticated as ${worker.$jazz.id}`),
      );

      // Use shared authentication utility to initialize RegardeSDK
      console.log(
        SimpleChalk.blue("Initializing RegardeSDK and generating token..."),
      );
      const regardeSDK = await ensureRegardeSDKLoaded(worker.$jazz.id);

      console.log(
        SimpleChalk.green("✓ Token generated and stored successfully"),
      );
      console.log(SimpleChalk.blue("Token expires in 24 hours"));
      console.log("Credentials stored in RegardeSDK CoMap");

      process.exit(0);
    } catch (error: any) {
      console.error(SimpleChalk.red("Login failed:"), error.message);
      return { success: false, error: error.message };
    }
  },
};
