import { Loaded } from "jazz-tools";
import {
  RegistryWorkerAccount,
  ReservedNicknamesRegistry,
  ReservationEntry,
} from "@onboarding.jazz/shared-schemas/registry";
import { ReservationBackupServiceInterface, ReservationBackupInfo } from "../types/services.js";
import { AuditService } from "./audit.js";
import { Logger } from "../utils/logger.js";
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { createInterface } from "readline";
import { join } from "path";

const RESERVATION_BACKUP_DIR = "reserveRegistry-backups";

interface ReservationBackupData {
  timestamp: string;
  reservedNicknames: Record<string, {
    reservedBy: string;
    reservedAt: number;
    reason?: string;
    category: string;
  }>;
  metadata: {
    totalReservations: number;
    backupVersion: string;
  };
}

export class ReservationBackupService implements ReservationBackupServiceInterface {
  constructor(
    private worker: Loaded<typeof RegistryWorkerAccount>,
    private reservedNicknames: Loaded<typeof ReservedNicknamesRegistry>,
    private auditService: AuditService,
  ) {}

  async backupReservations(): Promise<string> {
    if (!existsSync(RESERVATION_BACKUP_DIR)) {
      mkdirSync(RESERVATION_BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `reservation-backup-${timestamp}.json`;
    const filepath = join(RESERVATION_BACKUP_DIR, filename);

    // Convert reserved nicknames to plain object format
    const reservedNicknamesData: Record<string, any> = {};
    let totalReservations = 0;

    for (const [nickname, reservation] of Object.entries(this.reservedNicknames)) {
      if (reservation) {
        const reservationEntry = reservation as any;
        reservedNicknamesData[nickname] = {
          reservedBy: reservationEntry?.reservedBy || "",
          reservedAt: reservationEntry?.reservedAt || 0,
          reason: reservationEntry?.reason,
          category: reservationEntry?.category || "custom",
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

  async restoreReservations(backupFile: string): Promise<{ success: boolean; restored: { reservations: number } }> {
    if (!existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    let backupData: ReservationBackupData;
    try {
      const fileContent = readFileSync(backupFile, "utf-8");
      backupData = JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`Failed to parse backup file: ${error}`);
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

    // Clear existing reservations
    for (const key of Object.keys(this.reservedNicknames)) {
      delete this.reservedNicknames[key];
    }

    // Restore reservations from backup
    let restoredCount = 0;
    for (const [nickname, reservationData] of Object.entries(backupData.reservedNicknames)) {
      try {
        const reservationEntry = ReservationEntry.create({
          reservedBy: reservationData.reservedBy,
          reservedAt: reservationData.reservedAt,
          reason: reservationData.reason,
          category: reservationData.category as "admin" | "brand" | "system" | "offensive" | "custom",
        });

        this.reservedNicknames[nickname] = reservationEntry;
        restoredCount++;
      } catch (error) {
        Logger.warning(`Failed to restore reservation for ${nickname}: ${error}`);
      }
    }

    Logger.success(`Restored ${restoredCount} reservations`);
    return { success: true, restored: { reservations: restoredCount } };
  }

  async listReservationBackups(): Promise<{ backups: ReservationBackupInfo[] }> {
    if (!existsSync(RESERVATION_BACKUP_DIR)) {
      return { backups: [] };
    }

    const files = readdirSync(RESERVATION_BACKUP_DIR).filter((file) =>
      file.endsWith(".json") && file.startsWith("reservation-backup-"),
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

    const files = readdirSync(RESERVATION_BACKUP_DIR).filter((file) =>
      file.endsWith(".json") && file.startsWith("reservation-backup-"),
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
      output: process.stdout,
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
