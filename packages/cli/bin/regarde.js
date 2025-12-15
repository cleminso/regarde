#!/usr/bin/env node

import { Command } from "commander";
import fetch from "node-fetch";
import ora from "ora";
import chalk from "chalk";
// Initialize Jazz polyfills (needed for Node environments)
// initPolyfill(); // Uncomment if needed, but we might just use HTTP API for now

const program = new Command();

program
  .name("regarde")
  .description("Regarde CLI to manage your apps")
  .version("1.0.0");

program
  .command("register-app")
  .description("Register a new application in the Regarde registry")
  .requiredOption("-n, --name <name>", "Application name")
  .requiredOption(
    "-p, --providerName <provider>",
    "Payment provider (e.g., lemonsqueezy)",
  )
  .requiredOption("-o, --ownerAccountId <id>", "Owner Jazz Account ID")
  .action(async (options) => {
    const { name, providerName, ownerAccountId } = options;

    if (providerName !== "lemonsqueezy" && providerName !== "stripe") {
      console.error(
        chalk.red("Error: providerName must be 'lemonsqueezy' or 'stripe'"),
      );
      process.exit(1);
    }

    const spinner = ora("Registering application...").start();

    try {
      // We need to point to the correct API URL.
      // For development, we assume localhost:3000 or api.regarde.dev
      const API_URL = process.env.REGARDE_API_URL || "http://localhost:3000";

      const response = await fetch(`${API_URL}/register-app`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          paymentProvider: providerName,
          ownerAccountId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        spinner.fail(
          `Registration failed: ${response.status} ${response.statusText}`,
        );
        console.error(chalk.red(`Server Error: ${errorText}`));
        process.exit(1);
      }

      const data = await response.json();
      spinner.succeed("Application registered successfully!");

      console.log("\n" + chalk.green(chalk.bold("Application Details:")));
      console.log(`  App ID:         ${data.appId}`);
      console.log(`  Webhook URL:    ${data.webhookUrl}`);
      console.log(`  Webhook Secret: ${chalk.yellow(data.webhookSecret)}`);

      console.log("\n" + chalk.blue("Next Steps:"));
      console.log(`  1. Go to your ${providerName} dashboard.`);
      console.log(`  2. Create a webhook pointing to: ${data.webhookUrl}`);
      console.log(`  3. Set the signing secret to: ${data.webhookSecret}`);
      console.log(
        `  4. Select 'subscription_created', 'subscription_updated', etc. events.`,
      );
    } catch (error) {
      spinner.fail("Network error or unexpected structure");
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
