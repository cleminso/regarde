import { ArgParser } from "@alcyone-labs/arg-parser";
import { Logger } from "../utils/logger.js";

import { nicknameCommands } from "./commands/nickname.js";
import { reservationCommands } from "./commands/reservation.js";
import { auditCommands } from "./commands/audit.js";
import { healthCommands } from "./commands/health.js";
import { backupCommands } from "./commands/backup.js";

export function createCLI() {
  const cli = ArgParser.withMcp({
    appName: "Profile Admin CLI",
    appCommandName: "profile-admin",
    description: "CLI tool for managing profile nickname registry",
  });

  const allCommands = [
    ...nicknameCommands,
    ...reservationCommands,
    ...auditCommands,
    ...healthCommands,
    ...backupCommands,
  ];

  allCommands.forEach((command) => {
    cli.addTool({
      name: command.name,
      description: command.description,
      flags: command.flags,
      handler: async (ctx) => {
        try {
          return await command.handler(ctx);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          Logger.error(`Command failed: ${errorMessage}`);

          if (process.env.DEBUG && error instanceof Error && error.stack) {
            console.error(error.stack);
          }

          process.exit(1);
        }
      },
    });
  });

  return cli;
}

export {
  nicknameCommands,
  reservationCommands,
  auditCommands,
  healthCommands,
  backupCommands,
};
