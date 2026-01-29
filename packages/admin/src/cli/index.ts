import {
  ArgParser,
  type IFlag,
  type ToolConfig,
  FlagInheritance,
} from "@alcyone-labs/arg-parser";

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

const VERBOSE_FLAG: IFlag = {
  name: "verbose",
  type: "boolean",
  mandatory: false,
  options: ["--verbose", "-v"],
  description: "Enable verbose output",
  defaultValue: false,
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
      ...(process.env.DEBUG && error instanceof Error && error.stack
        ? { stack: error.stack }
        : {}),
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

function wrapToolHandler(
  tool: ToolConfig,
): (
  ctx: import("@alcyone-labs/arg-parser").IHandlerContext,
) => Promise<unknown> {
  return async (ctx) => {
    const jsonOutput = ctx.args.format === "json";
    const restoreConsole =
      jsonOutput === true ? patchConsoleForJsonOutput() : null;

    try {
      const result = await tool.handler(ctx);

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
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMessage}`);
      }

      throw error;
    }
  };
}

function addToolsToParser(parser: ArgParser, tools: ToolConfig[]): void {
  for (const tool of tools) {
    parser.addTool({
      ...tool,
      flags: withFormatFlag(tool.flags),
      handler: wrapToolHandler(tool),
    });
  }
}

function createSubCommandParser(
  name: string,
  description: string,
  tools: ToolConfig[],
  parentParser: ArgParser,
): ArgParser {
  const parser = ArgParser.forCli({
    appName: `admin ${name}`,
    description,
    handleErrors: false,
    inheritParentFlags: FlagInheritance.AllParents,
  });

  addToolsToParser(parser, tools);

  parentParser.addSubCommand({
    name,
    description,
    parser,
  });

  return parser;
}

export function createCLI() {
  const cli = ArgParser.withMcp({
    appName: "Regarde Admin CLI",
    appCommandName: "admin",
    description:
      "CLI tool for managing Regarde nickname registry admin operations",
    handleErrors: false,
    inheritParentFlags: FlagInheritance.AllParents,
    mcp: {
      serverInfo: { name: "regarde-admin", version: "1.0.0" },
      defaultTransport: { type: "stdio" },
    },
  });

  // Add global flags to parent parser
  cli.addFlags([FORMAT_FLAG, VERBOSE_FLAG]);

  // Create subcommands for each command group
  createSubCommandParser(
    "nickname",
    "Manage nickname registrations (add, update, remove, fix access)",
    nicknameCommands,
    cli,
  );

  createSubCommandParser(
    "audit",
    "View and manage audit logs",
    auditCommands,
    cli,
  );

  createSubCommandParser(
    "reservation",
    "Manage reserved nicknames",
    reservationCommands,
    cli,
  );

  createSubCommandParser(
    "backup",
    "Backup and restore registries",
    backupCommands,
    cli,
  );

  createSubCommandParser(
    "reservation-backup",
    "Backup and restore reserved nicknames",
    reservationBackupCommands,
    cli,
  );

  createSubCommandParser(
    "health",
    "Check registry health and connectivity",
    healthCommands,
    cli,
  );

  createSubCommandParser(
    "integrity",
    "Validate data integrity and check for duplicates",
    integrityCommands,
    cli,
  );

  createSubCommandParser(
    "monitoring",
    "View registry metrics and statistics",
    monitoringCommands,
    cli,
  );

  createSubCommandParser(
    "performance",
    "Run benchmarks and security audits",
    performanceCommands,
    cli,
  );

  createSubCommandParser(
    "inspect",
    "Inspect account and nickname states",
    inspectCommands,
    cli,
  );

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
