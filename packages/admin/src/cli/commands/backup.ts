import { Command, withAdminService } from "../types.js";
import { Logger } from "../../utils/logger.js";

export const backupCommands: Command[] = [
  {
    name: "download-registries",
    description: "Export registries as JSON backup",
    flags: [],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const backupFile = await admin.downloadRegistries();
        Logger.success(`Registries exported to: ${backupFile}`);
        return { backupFile };
      });
    },
  },

  {
    name: "restore-all",
    description: "Restore registries from a backup file",
    flags: [
      {
        name: "backupFile",
        type: "string",
        mandatory: true,
        options: ["--backup-file"],
        description: "Path to the backup file to restore from",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        Logger.warning("This will REPLACE all current registry data!");
        Logger.info(`Restoring from: ${ctx.args.backupFile}`);
        
        const result = await admin.restoreFromBackup(ctx.args.backupFile);
        
        if (result.success) {
          Logger.success("Restore completed successfully!");
          console.log(`  • Restored ${result.restored.nicknames} nicknames`);
          console.log(`  • Restored ${result.restored.accounts} account mappings`);
        } else {
          Logger.error("Restore operation failed.");
        }
        
        return result;
      });
    },
  },

  {
    name: "delete-all",
    description: "Delete all registry entries (creates backup first)",
    flags: [],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        Logger.warning("This will DELETE ALL nickname registrations!");
        Logger.info("A backup will be created automatically before deletion.");
        
        const result = await admin.deleteAll();
        
        if (result.success) {
          Logger.success("All registries cleared successfully!");
          console.log(`  • Backup created: ${result.backupFile}`);
          console.log(`  • Deleted ${result.deleted.nicknames} nicknames`);
          console.log(`  • Deleted ${result.deleted.accounts} account mappings`);
        } else {
          Logger.error("Delete operation failed.");
        }
        
        return result;
      });
    },
  },

  {
    name: "list-backups",
    description: "List all available backup files",
    flags: [],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const result = await admin.listBackups();
        
        if (result.backups.length === 0) {
          Logger.info("No backup files found.");
          return result;
        }

        Logger.info(`Found ${result.backups.length} backup file(s):`);
        console.log("=".repeat(80));
        
        result.backups.forEach((backup: any, index: number) => {
          const date = new Date(backup.date).toLocaleString();
          console.log(`${index + 1}. ${backup.filename}`);
          console.log(`   Size: ${backup.size}`);
          console.log(`   Date: ${date}`);
          console.log("");
        });
        
        return result;
      });
    },
  },

  {
    name: "clean-old-backups",
    description: "Remove old backup files",
    flags: [
      {
        name: "daysToKeep",
        type: "number",
        mandatory: false,
        options: ["--days-to-keep"],
        description: "Number of days of backups to keep (default: 30)",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const daysToKeep = ctx.args.daysToKeep || 30;
        
        Logger.info(`Cleaning backup files older than ${daysToKeep} days...`);
        
        const result = await admin.cleanOldBackups(daysToKeep);
        
        if (result.success) {
          if (result.deletedCount > 0) {
            Logger.success(`Cleaned ${result.deletedCount} old backup file(s):`);
            result.deletedFiles.forEach((file: string, index: number) => {
              console.log(`  ${index + 1}. ${file}`);
            });
          } else {
            Logger.info("No old backup files found to clean.");
          }
        } else {
          Logger.error("Clean operation failed.");
        }
        
        return result;
      });
    },
  },
];
