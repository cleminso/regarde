import { withAdminService } from "../types.js";
import { type ToolConfig } from "@alcyone-labs/arg-parser";
import { Logger } from "../../utils/logger.js";
import { type RegistryAuditEntry } from "@regarde-dev/shared-schemas";

export const auditCommands: ToolConfig[] = [
  {
    name: "history",
    description: "Show registry change history",
    flags: [
      {
        name: "limit",
        type: "number",
        mandatory: false,
        options: ["--limit"],
        description: "Maximum number of entries to show (default: 20)",
      },
      {
        name: "source",
        type: "string",
        mandatory: false,
        options: ["--source"],
        description: "Filter by source (admin-cli, user-app, worker)",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        let entries: RegistryAuditEntry[];

        if (ctx.args.source) {
          const validSources = ["admin-cli", "user-app", "worker"];
          if (!validSources.includes(ctx.args.source)) {
            throw new Error(
              `Invalid source. Must be one of: ${validSources.join(", ")}`,
            );
          }
          entries = await admin.getHistoryBySource(
            ctx.args.source,
            ctx.args.limit,
          );
        } else {
          entries = await admin.getChangeHistory(ctx.args.limit);
        }

        if (entries.length === 0) {
          Logger.info("No audit entries found.");
          return { entries };
        }

        Logger.info(`Registry Change History (${entries.length} entries):`);
        console.log("=".repeat(80));

        entries.forEach((entry: RegistryAuditEntry, index: number) => {
          const timestamp = new Date(entry.timestamp).toLocaleString();
          const actionColor = getActionColor(entry.action);

          console.log(
            `${index + 1}. [${timestamp}] ${actionColor}${entry.action.toUpperCase()}\x1b[0m`,
          );
          console.log(`   Account: ${entry.jazzAccountId}`);

          if (entry.oldNickname && entry.newNickname) {
            console.log(
              `   Changed: "${entry.oldNickname}" → "${entry.newNickname}"`,
            );
          } else if (entry.newNickname) {
            console.log(`   Added: "${entry.newNickname}"`);
          } else if (entry.oldNickname) {
            console.log(`   Removed: "${entry.oldNickname}"`);
          }

          console.log(`   Source: ${entry.source}`);
          if (entry.reservationReason) {
            console.log(`   Reason: ${entry.reservationReason}`);
          }
          console.log("");
        });

        return { entries };
      });
    },
  },

  {
    name: "history-account",
    description: "Show change history for a specific account",
    flags: [
      {
        name: "accountId",
        type: "string",
        mandatory: true,
        options: ["--account-id"],
        description: "The Jazz account ID to show history for",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const entries = await admin.getHistoryForAccount(ctx.args.accountId);

        if (entries.length === 0) {
          Logger.info(`No history found for account ${ctx.args.accountId}.`);
          return { entries };
        }

        Logger.info(`Change History for Account: ${ctx.args.accountId}`);
        console.log("=".repeat(60));

        entries.forEach((entry: RegistryAuditEntry, index: number) => {
          const timestamp = new Date(entry.timestamp).toLocaleString();
          const actionColor = getActionColor(entry.action);

          console.log(
            `${index + 1}. [${timestamp}] ${actionColor}${entry.action.toUpperCase()}\x1b[0m`,
          );

          if (entry.oldNickname && entry.newNickname) {
            console.log(
              `   Changed: "${entry.oldNickname}" → "${entry.newNickname}"`,
            );
          } else if (entry.newNickname) {
            console.log(`   Added: "${entry.newNickname}"`);
          } else if (entry.oldNickname) {
            console.log(`   Removed: "${entry.oldNickname}"`);
          }

          console.log(`   Source: ${entry.source}`);
          if (entry.reservationReason) {
            console.log(`   Reason: ${entry.reservationReason}`);
          }
          console.log("");
        });

        return { entries };
      });
    },
  },

  {
    name: "history-nickname",
    description: "Show change history for a specific nickname",
    flags: [
      {
        name: "nickname",
        type: "string",
        mandatory: true,
        options: ["--nickname"],
        description: "The nickname to show history for",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const entries = await admin.getHistoryForNickname(ctx.args.nickname);

        if (entries.length === 0) {
          Logger.info(`No history found for nickname "${ctx.args.nickname}".`);
          return { entries };
        }

        Logger.info(`Change History for Nickname: "${ctx.args.nickname}"`);
        console.log("=".repeat(60));

        entries.forEach((entry: RegistryAuditEntry, index: number) => {
          const timestamp = new Date(entry.timestamp).toLocaleString();
          const actionColor = getActionColor(entry.action);

          console.log(
            `${index + 1}. [${timestamp}] ${actionColor}${entry.action.toUpperCase()}\x1b[0m`,
          );
          console.log(`   Account: ${entry.jazzAccountId}`);

          if (entry.oldNickname && entry.newNickname) {
            console.log(
              `   Changed: "${entry.oldNickname}" → "${entry.newNickname}"`,
            );
          } else if (entry.newNickname) {
            console.log(`   Added: "${entry.newNickname}"`);
          } else if (entry.oldNickname) {
            console.log(`   Removed: "${entry.oldNickname}"`);
          }

          console.log(`   Source: ${entry.source}`);
          if (entry.reservationReason) {
            console.log(`   Reason: ${entry.reservationReason}`);
          }
          console.log("");
        });

        return { entries };
      });
    },
  },

  {
    name: "clear-audit",
    description: "Clear corrupted audit log entries",
    flags: [],
    handler: async () => {
      return withAdminService(async (admin) => {
        await admin.clearAuditLog();
        Logger.success("Audit log cleared successfully");
        return { success: true };
      });
    },
  },
];

function getActionColor(action: string): string {
  switch (action.toLowerCase()) {
    case "add":
      return "\x1b[32m"; // Green
    case "remove":
      return "\x1b[31m"; // Red
    case "update":
      return "\x1b[33m"; // Yellow
    default:
      return "\x1b[36m"; // Cyan
  }
}
