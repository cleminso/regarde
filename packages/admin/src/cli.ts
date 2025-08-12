#!/usr/bin/env node
import "dotenv/config";
import { ArgParser } from "@alcyone-labs/arg-parser";
import { AdminService } from "./services/adminService.js";
import { RegistryAuditEntry } from "@onboarding.jazz/shared-schemas/registry";
import { Logger } from "./utils/logger.js";

const cli = ArgParser.withMcp({
  appName: "Profile Admin CLI",
  appCommandName: "profile-admin",
  description: "CLI tool for managing profile nickname registry",
});

cli.addTool({
  name: "add",
  description: "Add a new nickname to account mapping",
  flags: [
    {
      name: "nickname",
      type: "string",
      mandatory: true,
      options: ["--nickname"],
      description: "The nickname to register",
    },
    {
      name: "accountId",
      type: "string",
      mandatory: true,
      options: ["--account-id"],
      description: "The Jazz account ID to associate with the nickname",
    },
    {
      name: "allowReserved",
      type: "boolean",
      mandatory: false,
      options: ["--allow-reserved"],
      description: "Allow registration of reserved nicknames (admin override)",
    },
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();
      const result = await admin.addNickname(
        ctx.args.nickname,
        ctx.args.accountId,
        ctx.args.allowReserved || false,
      );
      Logger.success(
        `Successfully added nickname "${ctx.args.nickname}" for account ${ctx.args.accountId}`,
      );
      if (ctx.args.allowReserved) {
        Logger.info("Reserved nickname was overridden by admin.");
      }
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to add nickname: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "update",
  description: "Transfer a nickname to a different accountId",
  flags: [
    {
      name: "nickname",
      type: "string",
      mandatory: true,
      options: ["--nickname"],
      description: "The nickname to update",
    },
    {
      name: "accountId",
      type: "string",
      mandatory: true,
      options: ["--account-id"],
      description: "The new Jazz account ID to associate with the nickname",
    },
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();
      const result = await admin.updateNickname(
        ctx.args.nickname,
        ctx.args.accountId,
      );
      Logger.success(
        `Successfully updated nickname "${ctx.args.nickname}" to accountId ${ctx.args.accountId}`,
      );
      if (result.oldAccountId) {
        Logger.info(`Previous accountId was: ${result.oldAccountId}`);
      }
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to update nickname: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "remove",
  description: "Remove a nickname from the registry",
  flags: [
    {
      name: "nickname",
      type: "string",
      mandatory: true,
      options: ["--nickname"],
      description: "The nickname to remove",
    },
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();
      const result = await admin.removeNickname(ctx.args.nickname);
      Logger.success(`Successfully removed nickname "${ctx.args.nickname}"`);
      if (result.removedAccountId) {
        Logger.info(`Removed from account: ${result.removedAccountId}`);
      }
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to remove nickname: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "health",
  description: "Check registry integrity and report inconsistencies",
  flags: [],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();
      const report = await admin.healthCheck();
      Logger.check("Registry Health Report:");
      console.log(report);
      return report;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Health check failed: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "download-registries",
  description: "Export both registries as JSON files for backup",
  flags: [],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();
      const filePath = await admin.downloadRegistries();
      Logger.success(`Registries backed up to: ${filePath}`);
      return { backupFile: filePath };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to download registries: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "restore-all",
  description: "Restore registries from JSON backup file",
  flags: [
    {
      name: "backupFile",
      type: "string",
      mandatory: true,
      options: ["--backup-file"],
      description: "Path to the backup file",
    },
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();
      const result = await admin.restoreFromBackup(ctx.args.backupFile);
      Logger.success(
        `Successfully restored registries from ${ctx.args.backupFile}`,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to restore registries: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "delete-all",
  description: "Clear all entries from both registries (creates backup first)",
  flags: [],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();
      const result = await admin.deleteAll();
      Logger.success(
        `All registries cleared. Backup saved to: ${result.backupFile}`,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to delete all entries: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "list-backups",
  description: "List all available backup files",
  flags: [],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      const result = await admin.listBackups();
      Logger.info("Available Backups:");
      if (result.backups.length === 0) {
        Logger.info("  No backups found.");
      } else {
        result.backups.forEach((backup) => {
          console.log(
            `  • ${backup.filename} (${backup.size}, ${backup.date})`,
          );
        });
      }
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to list backups: ${errorMessage}`);
      process.exit(1);
    }
  },
});

cli.addTool({
  name: "clean-old-backups",
  description: "Remove backup files older than specified days",
  flags: [
    {
      name: "days",
      type: "number",
      mandatory: false,
      options: ["--days"],
      description: "Days to keep (default: 30)",
    },
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      const days = ctx.args.days || 30;
      const result = await admin.cleanOldBackups(days);
      Logger.status(`Cleaned ${result.deletedCount} old backup files`);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to clean backups: ${errorMessage}`);
      process.exit(1);
    }
  },
});

cli.addTool({
  name: "history",
  description: "Show registry change history",
  flags: [
    {
      name: "limit",
      type: "number",
      mandatory: false,
      options: ["--limit"],
      description: "Number of recent changes to show (default: 20)",
    },
    {
      name: "accountId",
      type: "string",
      mandatory: false,
      options: ["--account-id"],
      description: "Filter by specific account ID",
    },
    {
      name: "nickname",
      type: "string",
      mandatory: false,
      options: ["--nickname"],
      description: "Filter by specific nickname",
    },
    {
      name: "source",
      type: "string",
      mandatory: false,
      options: ["--source"],
      description: "Filter by source type (admin-cli, user-app, worker)",
    },
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();

      let entries: RegistryAuditEntry[] = [];

      if (ctx.args.accountId) {
        entries = await admin.getHistoryForAccount(ctx.args.accountId);
      } else if (ctx.args.nickname) {
        entries = await admin.getHistoryForNickname(ctx.args.nickname);
      } else if (ctx.args.source) {
        if (!["admin-cli", "user-app", "worker"].includes(ctx.args.source)) {
          throw new Error("Source must be one of: admin-cli, user-app, worker");
        }
        entries = await admin.getHistoryBySource(ctx.args.source as any);
      } else {
        const limit = ctx.args.limit || 20;
        entries = await admin.getChangeHistory(limit);
      }

      Logger.info("Registry Change History:");
      if (entries.length === 0) {
        Logger.info("  No changes found.");
      } else {
        entries.forEach((entry) => {
          const oldNick = entry.oldNickname || "∅";
          const newNick = entry.newNickname || "∅";
          const timeAgo = formatTimeAgo(entry.timestamp);
          console.log(
            `${entry.monotonicId}: ${oldNick} → ${newNick} (${entry.jazzAccountId}) [${entry.source}] ${timeAgo}`,
          );
        });
      }

      return { entries: entries.length };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to get history: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "check-nickname-health",
  description: "Check health of a specific nickname or account ID",
  flags: [
    {
      name: "nickname",
      type: "string",
      mandatory: false,
      options: ["--nickname"],
      description: "The nickname to check",
    },
    {
      name: "accountId",
      type: "string",
      mandatory: false,
      options: ["--account-id"],
      description: "The Jazz account ID to check",
    },
  ],
  handler: async (ctx) => {
    const { nickname, accountId } = ctx.args;

    if (!nickname && !accountId) {
      Logger.error("Must provide either --nickname or --account-id");
      process.exit(1);
    }

    try {
      const adminService = new AdminService();
      await adminService.initialize();

      const healthReport = await adminService.checkNicknameHealth(
        nickname,
        accountId,
      );

      Logger.check("\nNickname Health Report:");
      console.log("=".repeat(50));

      if (healthReport.nickname) {
        Logger.info(`Nickname: ${healthReport.nickname}`);
      }
      if (healthReport.accountId) {
        Logger.info(`Account ID: ${healthReport.accountId}`);
      }

      Logger.status(`Registry Status: ${healthReport.registryStatus}`);
      Logger.status(
        `Reverse Registry Status: ${healthReport.reverseRegistryStatus}`,
      );
      Logger.status(
        `OnboardingNickname Status: ${healthReport.onboardingStatus}`,
      );

      if (healthReport.issues.length > 0) {
        Logger.warning("\nIssues Found:");
        healthReport.issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue}`);
        });
      } else {
        Logger.success("\nNo issues found!");
      }

      if (healthReport.recommendations.length > 0) {
        Logger.info("\nRecommendations:");
        healthReport.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }

      await adminService.cleanup();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Error checking nickname health: ${errorMessage}`);
      process.exit(1);
    }
  },
});

cli.addTool({
  name: "fix-nickname",
  description: "Fix nickname synchronization issues",
  flags: [
    {
      name: "nickname",
      type: "string",
      mandatory: false,
      options: ["--nickname"],
      description: "The nickname to fix",
    },
    {
      name: "accountId",
      type: "string",
      mandatory: false,
      options: ["--account-id"],
      description: "The Jazz account ID to fix",
    },
    {
      name: "force",
      type: "boolean",
      mandatory: false,
      options: ["--force"],
      description: "Force fix even if no issues detected",
    },
  ],
  handler: async (ctx) => {
    const { nickname, accountId, force } = ctx.args;

    if (!nickname && !accountId) {
      Logger.error("Must provide either --nickname or --account-id");
      process.exit(1);
    }

    try {
      const adminService = new AdminService();
      await adminService.initialize();

      Logger.check("Checking nickname health before fix...");
      const healthReport = await adminService.checkNicknameHealth(
        nickname,
        accountId,
      );

      if (healthReport.issues.length === 0 && !force) {
        Logger.success("No issues found. Use --force to fix anyway.");
        await adminService.cleanup();
        return;
      }

      Logger.status("\nApplying fixes...");
      const fixResult = await adminService.fixNickname(
        healthReport.nickname || nickname,
        healthReport.accountId || accountId,
      );

      Logger.success(`Fix completed: ${fixResult.message}`);

      if (fixResult.changes.length > 0) {
        Logger.info("\nChanges made:");
        fixResult.changes.forEach((change, index) => {
          console.log(`  ${index + 1}. ${change}`);
        });
      }

      await adminService.cleanup();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Error fixing nickname: ${errorMessage}`);
      process.exit(1);
    }
  },
});

cli.addTool({
  name: "reserve",
  description: "Reserve a nickname to prevent registration",
  flags: [
    {
      name: "nickname",
      type: "string",
      mandatory: true,
      options: ["--nickname"],
      description: "The nickname to reserve",
    },
    {
      name: "category",
      type: "string",
      mandatory: false,
      options: ["--category"],
      description:
        "Reservation category (admin, brand, system, offensive, custom)",
    },
    {
      name: "reason",
      type: "string",
      mandatory: false,
      options: ["--reason"],
      description: "Reason for the reservation",
    },
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();

      const category =
        (ctx.args.category as
          | "admin"
          | "brand"
          | "system"
          | "offensive"
          | "custom") || "custom";
      const validCategories = [
        "admin",
        "brand",
        "system",
        "offensive",
        "custom",
      ];

      if (ctx.args.category && !validCategories.includes(ctx.args.category)) {
        throw new Error(
          `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        );
      }

      const result = await admin.reserveNickname(
        ctx.args.nickname,
        ctx.args.reason,
        category,
      );

      Logger.success(
        `Successfully reserved nickname "${ctx.args.nickname}" (category: ${category})`,
      );
      if (ctx.args.reason) {
        Logger.info(`Reason: ${ctx.args.reason}`);
      }
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to reserve nickname: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "unreserve",
  description: "Remove a nickname reservation",
  flags: [
    {
      name: "nickname",
      type: "string",
      mandatory: true,
      options: ["--nickname"],
      description: "The nickname to unreserve",
    },
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();
      const result = await admin.unreserveNickname(ctx.args.nickname);
      Logger.success(`Successfully unreserved nickname "${ctx.args.nickname}"`);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to unreserve nickname: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "list-reserved",
  description: "List all reserved nicknames",
  flags: [
    {
      name: "category",
      type: "string",
      mandatory: false,
      options: ["--category"],
      description:
        "Filter by category (admin, brand, system, offensive, custom)",
    },
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();

      const category = ctx.args.category as
        | "admin"
        | "brand"
        | "system"
        | "offensive"
        | "custom"
        | undefined;
      const validCategories = [
        "admin",
        "brand",
        "system",
        "offensive",
        "custom",
      ];

      if (ctx.args.category && !validCategories.includes(ctx.args.category)) {
        throw new Error(
          `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        );
      }

      const result = await admin.listReservedNicknames(category);

      Logger.info("Reserved Nicknames:");
      if (result.reservations.length === 0) {
        Logger.info("  No reserved nicknames found.");
      } else {
        result.reservations.forEach((reservation) => {
          const timeAgo = formatTimeAgo(reservation.reservedAt);
          console.log(
            `  • ${reservation.nickname} (${reservation.category}) - reserved ${timeAgo}`,
          );
          if (reservation.reason) {
            console.log(`    Reason: ${reservation.reason}`);
          }
          console.log(`    Reserved by: ${reservation.reservedBy}`);
        });
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to list reserved nicknames: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

cli.addTool({
  name: "check-reserved",
  description: "Check if a nickname is reserved",
  flags: [
    {
      name: "nickname",
      type: "string",
      mandatory: true,
      options: ["--nickname"],
      description: "The nickname to check",
    },
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();
      const result = await admin.checkReservationStatus(ctx.args.nickname);

      if (result.isReserved && result.reservation) {
        Logger.warning(`Nickname "${ctx.args.nickname}" is RESERVED`);
        console.log(`  Category: ${result.reservation.category}`);
        console.log(`  Reserved by: ${result.reservation.reservedBy}`);
        console.log(
          `  Reserved at: ${new Date(result.reservation.reservedAt).toISOString()}`,
        );
        if (result.reservation.reason) {
          console.log(`  Reason: ${result.reservation.reason}`);
        }
      } else {
        Logger.success(`Nickname "${ctx.args.nickname}" is NOT reserved`);
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.failed(`Failed to check reservation status: ${errorMessage}`);
      process.exit(1);
    } finally {
      await admin.cleanup();
    }
  },
});

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

await cli.parse();
