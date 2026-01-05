import { withAdminService } from "../types.js";
import { type ToolConfig } from "@alcyone-labs/arg-parser";
import { Logger } from "../../utils/logger.js";

export const reservationBackupCommands: ToolConfig[] = [
  {
    name: "backup-reservations",
    description: "Create a backup of all reserved nicknames",
    flags: [],
    handler: async () => {
      return withAdminService(async (admin) => {
        const backupFile = await admin.backupReservations();
        Logger.success(`Reservation backup created: ${backupFile}`);
        return { backupFile };
      });
    },
  },

  {
    name: "restore-reservations",
    description: "Restore reserved nicknames from a backup file",
    flags: [
      {
        name: "backupFile",
        type: "string",
        mandatory: true,
        options: ["--backup-file"],
        description: "Path to the reservation backup file to restore from",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        Logger.warning("This will REPLACE all current reservation data!");
        Logger.info(`Restoring from: ${ctx.args.backupFile}`);

        const result = await admin.restoreReservations(ctx.args.backupFile);

        if (result.success) {
          Logger.success("Reservation restore completed successfully!");
          console.log(
            `  • Restored ${result.restored.reservations} reservations`,
          );
        } else {
          Logger.error("Reservation restore operation failed.");
        }

        return result;
      });
    },
  },

  {
    name: "list-reservation-backups",
    description: "List all available reservation backup files",
    flags: [],
    handler: async () => {
      return withAdminService(async (admin) => {
        const result = await admin.listReservationBackups();

        if (result.backups.length === 0) {
          Logger.info("No reservation backup files found.");
          return result;
        }

        Logger.info(
          `Found ${result.backups.length} reservation backup file(s):`,
        );
        console.log("=".repeat(80));

        result.backups.forEach((backup: any, index: number) => {
          const date = new Date(backup.date).toLocaleString();
          console.log(`${index + 1}. ${backup.filename}`);
          console.log(`   Size: ${backup.size}`);
          console.log(`   Date: ${date}`);
          console.log(`   Reservations: ${backup.totalReservations}`);
          console.log("");
        });

        return result;
      });
    },
  },

  {
    name: "clean-old-reservation-backups",
    description: "Clean up old reservation backup files",
    flags: [
      {
        name: "daysToKeep",
        type: "number",
        mandatory: false,
        options: ["--days-to-keep"],
        description: "Number of days to keep backup files (default: 30)",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const daysToKeep = ctx.args.daysToKeep || 30;

        Logger.info(
          `Cleaning reservation backup files older than ${daysToKeep} days...`,
        );

        const result = await admin.cleanOldReservationBackups(daysToKeep);

        if (result.success) {
          if (result.deletedCount > 0) {
            Logger.success(
              `Cleaned ${result.deletedCount} old reservation backup file(s):`,
            );
            result.deletedFiles.forEach((file: string, index: number) => {
              console.log(`  ${index + 1}. ${file}`);
            });
          } else {
            Logger.info("No old reservation backup files found to clean.");
          }
        } else {
          Logger.error("Clean operation failed.");
        }

        return result;
      });
    },
  },
];
