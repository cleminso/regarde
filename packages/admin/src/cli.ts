#!/usr/bin/env node
import "dotenv/config";
import { z } from "zod";
import { ArgParser } from "@alcyone-labs/arg-parser";
import { AdminService } from "./services/AdminService.js";

const cli = ArgParser.withMcp({
  appName: "Profile Admin CLI",
  appCommandName: "profile-admin",
  description: "CLI tool for managing profile nickname registry",
});

cli.addTool({
  name: "add",
  description: "Add a new nickname mapping to the registry",
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

// Update nickname command
cli.addTool({
  name: "update",
  description: "Update an existing nickname mapping",
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
      description: "The new Jazz account ID",
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
        `✅ Successfully updated nickname "${ctx.args.nickname}" to account ${ctx.args.accountId}`,
      );
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

// Remove nickname command
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

// Health check command
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

// Download registries command
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

// Restore command
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

// Delete all command
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

// List backups command
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

// Clean old backups command
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

// Parse and execute
await cli.parse();
