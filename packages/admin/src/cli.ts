#!/usr/bin/env node
import "dotenv/config";
import { ArgParser } from "@alcyone-labs/arg-parser";
import { AdminService } from "./services/adminService.js";
import { RegistryAuditEntry } from "@onboarding.jazz/shared-schemas/registry";

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
  ],
  handler: async (ctx) => {
    const admin = new AdminService();
    try {
      await admin.initialize();
      const result = await admin.addNickname(
        ctx.args.nickname,
        ctx.args.accountId,
      );
      console.log(
        `✅ Successfully added nickname "${ctx.args.nickname}" for account ${ctx.args.accountId}`,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to add nickname: ${errorMessage}`);
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
      console.log(
        `✅ Successfully updated nickname "${ctx.args.nickname}" to accountId ${ctx.args.accountId}`,
      );
      if (result.oldAccountId) {
        console.log(`📝 Previous accountId was: ${result.oldAccountId}`);
      }
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to update nickname: ${errorMessage}`);
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
      console.log(`✅ Successfully removed nickname "${ctx.args.nickname}"`);
      if (result.removedAccountId) {
        console.log(`📝 Removed from account: ${result.removedAccountId}`);
      }
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to remove nickname: ${errorMessage}`);
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
      console.log("🏥 Registry Health Report:");
      console.log(report);
      return report;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Health check failed: ${errorMessage}`);
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
      console.log(`✅ Registries backed up to: ${filePath}`);
      return { backupFile: filePath };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to download registries: ${errorMessage}`);
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
      console.log(
        `✅ Successfully restored registries from ${ctx.args.backupFile}`,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to restore registries: ${errorMessage}`);
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
      console.log(
        `✅ All registries cleared. Backup saved to: ${result.backupFile}`,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to delete all entries: ${errorMessage}`);
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
      console.log("📂 Available Backups:");
      if (result.backups.length === 0) {
        console.log("  No backups found.");
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
      console.error(`❌ Failed to list backups: ${errorMessage}`);
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
      console.log(`🧹 Cleaned ${result.deletedCount} old backup files`);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to clean backups: ${errorMessage}`);
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

      console.log("📜 Registry Change History:");
      if (entries.length === 0) {
        console.log("  No changes found.");
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
      console.error(`❌ Failed to get history: ${errorMessage}`);
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
      console.error("❌ Must provide either --nickname or --account-id");
      process.exit(1);
    }

    try {
      const adminService = new AdminService();
      await adminService.initialize();
      
      const healthReport = await adminService.checkNicknameHealth(nickname, accountId);
      
      console.log("\n🔍 Nickname Health Report:");
      console.log("=" .repeat(50));
      
      if (healthReport.nickname) {
        console.log(`📝 Nickname: ${healthReport.nickname}`);
      }
      if (healthReport.accountId) {
        console.log(`👤 Account ID: ${healthReport.accountId}`);
      }
      
      console.log(`✅ Registry Status: ${healthReport.registryStatus}`);
      console.log(`🔄 Reverse Registry Status: ${healthReport.reverseRegistryStatus}`);
      console.log(`🎯 OnboardingNickname Status: ${healthReport.onboardingStatus}`);
      
      if (healthReport.issues.length > 0) {
        console.log("\n⚠️  Issues Found:");
        healthReport.issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue}`);
        });
      } else {
        console.log("\n✅ No issues found!");
      }
      
      if (healthReport.recommendations.length > 0) {
        console.log("\n💡 Recommendations:");
        healthReport.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }
      
      await adminService.cleanup();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error checking nickname health: ${errorMessage}`);
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
      console.error("❌ Must provide either --nickname or --account-id");
      process.exit(1);
    }

    try {
      const adminService = new AdminService();
      await adminService.initialize();
      
      console.log("🔍 Checking nickname health before fix...");
      const healthReport = await adminService.checkNicknameHealth(nickname, accountId);
      
      if (healthReport.issues.length === 0 && !force) {
        console.log("✅ No issues found. Use --force to fix anyway.");
        await adminService.cleanup();
        return;
      }
      
      console.log("\n🔧 Applying fixes...");
      const fixResult = await adminService.fixNickname(
        healthReport.nickname || nickname, 
        healthReport.accountId || accountId
      );
      
      console.log(`✅ Fix completed: ${fixResult.message}`);
      
      if (fixResult.changes.length > 0) {
        console.log("\n📝 Changes made:");
        fixResult.changes.forEach((change, index) => {
          console.log(`  ${index + 1}. ${change}`);
        });
      }
      
      await adminService.cleanup();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error fixing nickname: ${errorMessage}`);
      process.exit(1);
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
