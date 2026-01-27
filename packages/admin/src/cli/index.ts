import { ArgParser, type IFlag, type ToolConfig } from "@alcyone-labs/arg-parser";

import { Logger } from "../utils/logger.js";

import { auditCommands } from "./commands/audit.js";
import { backupCommands } from "./commands/backup.js";
import { healthCommands } from "./commands/health.js";
import { inspectCommands } from "./commands/inspect.js";
import { integrityCommands } from "./commands/integrity.js";
import { monitoringCommands } from "./commands/monitoring.js";
import { nicknameCommands } from "./commands/nickname.js";
import { performanceCommands } from "./commands/performance.js";
import { reservationCommands } from "./commands/reservation.js";
import { reservationBackupCommands } from "./commands/reservationBackup.js";

const FORMAT_FLAG: IFlag = {
  name: "format",
  type: "string",
  mandatory: false,
  options: ["--format"],
  description: "Output format: text (default) or json",
  defaultValue: "text",
  enum: ["text", "json"],
};

function withFormatFlag(flags: ToolConfig["flags"]): ToolConfig["flags"] {
  const hasFormatFlag = flags?.some((flag) => flag.name === "format") === true;
  if (hasFormatFlag) return flags;
  return [...(flags ?? []), FORMAT_FLAG];
}

function safeJsonStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(
    value,
    (_key, val: unknown) => {
      if (typeof val === "bigint") {
        return val.toString();
      }

      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) {
          return "[Circular]";
        }
        seen.add(val);
      }

      return val;
    },
    2,
  );
}

function writeJsonToStdout(value: unknown): void {
  const payload = value === undefined ? { success: true } : value;
  process.stdout.write(`${safeJsonStringify(payload)}\n`);
}

function writeJsonErrorToStdout(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);

  writeJsonToStdout({
    error: {
      message,
      name: error instanceof Error ? error.name : "Error",
      ...(process.env.DEBUG && error instanceof Error && error.stack ? { stack: error.stack } : {}),
    },
  });
}

function patchConsoleForJsonOutput(): () => void {
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;

  console.log = console.error.bind(console);
  console.info = console.error.bind(console);
  console.warn = console.error.bind(console);

  return () => {
    console.log = originalLog;
    console.info = originalInfo;
    console.warn = originalWarn;
  };
}

export function createCLI() {
  const cli = ArgParser.withMcp({
    appName: "Profile Admin CLI",
    appCommandName: "profile-admin",
    description: "CLI tool for managing profile nickname registry",
  });

  const allCommands: ToolConfig[] = [
    ...nicknameCommands,
    ...inspectCommands,
    ...reservationCommands,
    ...auditCommands,
    ...healthCommands,
    ...backupCommands,
    ...monitoringCommands,
    ...reservationBackupCommands,
    ...performanceCommands,
    ...integrityCommands,
  ];

  allCommands.forEach((command) => {
    cli.addTool({
      ...command,
      flags: withFormatFlag(command.flags),
      handler: async (ctx) => {
        if (ctx.isMcp) {
          return command.handler(ctx);
        }

        const jsonOutput = ctx.args.format === "json";
        const restoreConsole = jsonOutput === true ? patchConsoleForJsonOutput() : null;

        try {
          const result = await command.handler(ctx);

          restoreConsole?.();

          if (jsonOutput === true) {
            writeJsonToStdout(result);
          }

          return result;
        } catch (error: unknown) {
          restoreConsole?.();

          if (jsonOutput === true) {
            writeJsonErrorToStdout(error);
          } else {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`Command failed: ${errorMessage}`);
          }

          throw error;
        }
      },
    });
  });

  return cli;
}

export {
  nicknameCommands,
  inspectCommands,
  reservationCommands,
  auditCommands,
  healthCommands,
  backupCommands,
  monitoringCommands,
  reservationBackupCommands,
  performanceCommands,
  integrityCommands,
};
