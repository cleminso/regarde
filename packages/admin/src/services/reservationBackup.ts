import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { createInterface } from "readline";

import { Loaded } from "jazz-tools";

import {
  RegistryWorkerAccount,
  ReservationEntry,
  type TReservedNicknamesRegistry,
} from "@regarde-dev/core";

import { ReservationBackupServiceInterface, ReservationBackupInfo } from "../types/services.js";
import { Logger } from "../utils/logger.js";

const RESERVATION_BACKUP_DIR = "reserveRegistry-backups";

interface ReservationBackupData {
  timestamp: string;
  reservedNicknames: Record<
    string,
    {
      reservedBy: string;
      reservedAt: number;
      reason?: string;
      category: string;
    }
  >;
  metadata: {
    totalReservations: number;
    backupVersion: string;
  };
}

export class ReservationBackupService implements ReservationBackupServiceInterface {
  constructor(
    private worker: Loaded<typeof RegistryWorkerAccount>,
    private reservedNicknames: TReservedNicknamesRegistry,
  ) {}

  async backupReservations(): Promise<string> {
    if (!existsSync(RESERVATION_BACKUP_DIR)) {
      mkdirSync(RESERVATION_BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `reservation-backup-${timestamp}.json`;
    const filepath = join(RESERVATION_BACKUP_DIR, filename);

    const reservedNicknamesData: ReservationBackupData["reservedNicknames"] = {};
    let totalReservations = 0;

    for (const [nickname, reservation] of Object.entries(this.reservedNicknames)) {
      if (reservation && reservation.$isLoaded) {
        reservedNicknamesData[nickname] = {
          reservedBy: reservation.reservedBy,
          reservedAt: reservation.reservedAt,
          reason: reservation.reason,
          category: reservation.category,
        };
        totalReservations++;
      }
    }

    const backupData: ReservationBackupData = {
      timestamp: new Date().toISOString(),
      reservedNicknames: reservedNicknamesData,
      metadata: {
        totalReservations,
        backupVersion: "1.0",
      },
    };

    writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    Logger.info(`Reservation backup created: ${filepath}`);
    Logger.info(`Backed up ${totalReservations} reserved nicknames`);

    return filepath;
  }

  async restoreReservations(
    backupFile: string,
  ): Promise<{ success: boolean; restored: { reservations: number } }> {
    if (!existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    let backupData: ReservationBackupData;
    try {
      const fileContent = readFileSync(backupFile, "utf-8");
      backupData = JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`Failed to parse backup file: ${error}`, {
        cause: error,
      });
    }

    if (!backupData.reservedNicknames || !backupData.metadata) {
      throw new Error("Invalid backup file format");
    }

    Logger.warning("This will REPLACE all current reservation data!");
    Logger.info(`Restoring from: ${backupFile}`);
    Logger.info(`Backup contains ${backupData.metadata.totalReservations} reservations`);

    const confirmed = await this.confirmRestore();
    if (!confirmed) {
      throw new Error("Restore cancelled by user");
    }

    for (const key of Object.keys(this.reservedNicknames)) {
      this.reservedNicknames.$jazz.delete(key);
    }

    let restoredCount = 0;
    for (const [nickname, reservationData] of Object.entries(backupData.reservedNicknames)) {
      try {
        const reservationEntry = ReservationEntry.create({
          reservedBy: reservationData.reservedBy,
          reservedAt: reservationData.reservedAt,
          reason: reservationData.reason,
          category: reservationData.category as
            | "admin"
            | "brand"
            | "system"
            | "offensive"
            | "custom",
        });

        this.reservedNicknames.$jazz.set(nickname, reservationEntry);
        restoredCount++;
      } catch (error) {
        Logger.warning(`Failed to restore reservation for ${nickname}: ${error}`);
      }
    }

    await this.reservedNicknames.$jazz.waitForSync();

    Logger.success(`Restored ${restoredCount} reservations`);
    return { success: true, restored: { reservations: restoredCount } };
  }

  async listReservationBackups(): Promise<{
    backups: ReservationBackupInfo[];
  }> {
    if (!existsSync(RESERVATION_BACKUP_DIR)) {
      return { backups: [] };
    }

    const files = readdirSync(RESERVATION_BACKUP_DIR).filter(
      (file) => file.endsWith(".json") && file.startsWith("reservation-backup-"),
    );

    const backups: ReservationBackupInfo[] = [];

    for (const file of files) {
      const filepath = join(RESERVATION_BACKUP_DIR, file);
      const stats = statSync(filepath);

      try {
        const fileContent = readFileSync(filepath, "utf-8");
        const backupData: ReservationBackupData = JSON.parse(fileContent);

        backups.push({
          filename: file,
          size: this.formatFileSize(stats.size),
          date: stats.mtime.toISOString(),
          totalReservations: backupData.metadata?.totalReservations || 0,
        });
      } catch (error) {
        Logger.warning(`Failed to read backup file ${file}: ${error}`);
        backups.push({
          filename: file,
          size: this.formatFileSize(stats.size),
          date: stats.mtime.toISOString(),
          totalReservations: 0,
        });
      }
    }

    backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { backups };
  }

  async cleanOldReservationBackups(daysToKeep: number = 30): Promise<{
    success: boolean;
    deletedFiles: string[];
    deletedCount: number;
  }> {
    if (!existsSync(RESERVATION_BACKUP_DIR)) {
      return { success: true, deletedFiles: [], deletedCount: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const files = readdirSync(RESERVATION_BACKUP_DIR).filter(
      (file) => file.endsWith(".json") && file.startsWith("reservation-backup-"),
    );
    const deletedFiles: string[] = [];

    for (const file of files) {
      const filepath = join(RESERVATION_BACKUP_DIR, file);
      const stats = statSync(filepath);

      if (stats.mtime < cutoffDate) {
        unlinkSync(filepath);
        deletedFiles.push(file);
      }
    }

    Logger.info(`Cleaned ${deletedFiles.length} old reservation backup files`);
    return { success: true, deletedFiles, deletedCount: deletedFiles.length };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  private async confirmRestore(): Promise<boolean> {
    const rl = createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    return new Promise((resolve) => {
      rl.question(
        "Are you sure you want to restore? This will replace all current reservations. Type 'yes' to confirm: ",
        (answer) => {
          rl.close();
          resolve(answer.toLowerCase() === "yes");
        },
      );
    });
  }
}
