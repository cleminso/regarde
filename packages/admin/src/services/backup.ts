import { Loaded } from "jazz-tools";
import {
  RegistryWorkerAccount,
  NicknameRegistryCoRecord,
  ReverseNicknameRegistryCoRecord,
} from "@onboarding.jazz/shared-schemas";
import { BackupServiceInterface, BackupInfo } from "../types/services.js";
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

const BACKUP_DIR = "registry-backups";

interface BackupData {
  timestamp: string;
  registry: Record<string, string>;
  reverseRegistry: Record<string, string>;
  metadata?: {
    totalNicknames: number;
    totalAccounts: number;
    backupVersion: string;
  };
}

export class BackupService implements BackupServiceInterface {
  constructor(
    private worker: Loaded<typeof RegistryWorkerAccount>,
    private nicknameRegistry: Loaded<typeof NicknameRegistryCoRecord>,
    private reverseNicknameRegistry: Loaded<
      typeof ReverseNicknameRegistryCoRecord
    >,
    private auditService: AuditService,
  ) {}

  async downloadRegistries(): Promise<string> {
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `registry-backup-${timestamp}.json`;
    const filepath = join(BACKUP_DIR, filename);

    const registryData = { ...this.nicknameRegistry };
    const reverseRegistryData = { ...this.reverseNicknameRegistry };
    const totalNicknames = Object.keys(registryData).length;
    const totalAccounts = Object.keys(reverseRegistryData).length;

    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      registry: registryData,
      reverseRegistry: reverseRegistryData,
      metadata: {
        totalNicknames,
        totalAccounts,
        backupVersion: "2.0",
      },
    };

    writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    Logger.info(`Backup created: ${filepath}`);
    Logger.info(
      `Backed up ${totalNicknames} nicknames and ${totalAccounts} account mappings`,
    );
    return filepath;
  }

  async restoreFromBackup(backupFile: string): Promise<{
    success: boolean;
    restored: { nicknames: number; accounts: number };
  }> {
    if (!existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    let backupData: BackupData;
    try {
      const fileContent = readFileSync(backupFile, "utf-8");
      backupData = JSON.parse(fileContent);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read backup file: ${errorMessage}`);
    }

    if (!backupData.registry || !backupData.reverseRegistry) {
      throw new Error("Invalid backup file format");
    }

    const registryEntries = Object.entries(backupData.registry);
    for (const [nickname, accountId] of registryEntries) {
      if (backupData.reverseRegistry[accountId] !== nickname) {
        throw new Error(
          `Data inconsistency: ${nickname} -> ${accountId} not properly reversed`,
        );
      }
    }

    for (const key of Object.keys(this.nicknameRegistry)) {
      delete this.nicknameRegistry[key];
    }
    for (const key of Object.keys(this.reverseNicknameRegistry)) {
      delete this.reverseNicknameRegistry[key];
    }

    for (const [nickname, accountId] of Object.entries(backupData.registry)) {
      this.nicknameRegistry[nickname] = accountId;
    }
    for (const [accountId, nickname] of Object.entries(
      backupData.reverseRegistry,
    )) {
      this.reverseNicknameRegistry[accountId] = nickname;
    }

    await this.auditService.logChange(
      this.worker.id,
      undefined,
      undefined,
      "admin-cli",
      "add",
    );

    return {
      success: true,
      restored: {
        nicknames: Object.keys(backupData.registry).length,
        accounts: Object.keys(backupData.reverseRegistry).length,
      },
    };
  }

  async deleteAll(): Promise<{
    success: boolean;
    backupFile: string;
    deleted: { nicknames: number; accounts: number };
  }> {
    const backupFile = await this.downloadRegistries();
    Logger.info(`Backup created: ${backupFile}`);

    const confirmed = await this.confirmDeletion();
    if (!confirmed) {
      throw new Error("Deletion cancelled by user");
    }

    const deletedCounts = {
      nicknames: Object.keys(this.nicknameRegistry).length,
      accounts: Object.keys(this.reverseNicknameRegistry).length,
    };

    for (const key of Object.keys(this.nicknameRegistry)) {
      delete this.nicknameRegistry[key];
    }
    for (const key of Object.keys(this.reverseNicknameRegistry)) {
      delete this.reverseNicknameRegistry[key];
    }

    await this.auditService.logChange(
      this.worker.id,
      undefined,
      undefined,
      "admin-cli",
      "remove",
    );

    return {
      success: true,
      backupFile,
      deleted: deletedCounts,
    };
  }

  private async confirmDeletion(): Promise<boolean> {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(
        "WARNING: This will DELETE ALL nickname registrations. Type 'DELETE' to confirm: ",
        (answer) => {
          rl.close();
          resolve(answer === "DELETE");
        },
      );
    });
  }

  async listBackups(): Promise<{ backups: BackupInfo[] }> {
    if (!existsSync(BACKUP_DIR)) {
      return { backups: [] };
    }

    const files = readdirSync(BACKUP_DIR).filter(
      (file) => file.endsWith(".json") && file.startsWith("registry-backup-"),
    );

    const backups: BackupInfo[] = [];

    for (const file of files) {
      const filepath = join(BACKUP_DIR, file);
      const stats = statSync(filepath);

      try {
        const fileContent = readFileSync(filepath, "utf-8");
        const backupData: BackupData = JSON.parse(fileContent);

        let totalNicknames = 0;
        let totalAccounts = 0;
        let backupVersion = "1.0";

        if (backupData.metadata) {
          totalNicknames = backupData.metadata.totalNicknames;
          totalAccounts = backupData.metadata.totalAccounts;
          backupVersion = backupData.metadata.backupVersion;
        } else {
          totalNicknames = Object.keys(backupData.registry || {}).length;
          totalAccounts = Object.keys(backupData.reverseRegistry || {}).length;
        }

        backups.push({
          filename: file,
          size: this.formatFileSize(stats.size),
          date: stats.mtime.toISOString(),
          totalNicknames,
          totalAccounts,
          backupVersion,
        });
      } catch (error) {
        Logger.warning(
          `Failed to read backup file ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
        backups.push({
          filename: file,
          size: this.formatFileSize(stats.size),
          date: stats.mtime.toISOString(),
          totalNicknames: 0,
          totalAccounts: 0,
          backupVersion: "corrupted",
        });
      }
    }

    backups.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return { backups };
  }

  async cleanOldBackups(daysToKeep: number = 30): Promise<{
    success: boolean;
    deletedFiles: string[];
    deletedCount: number;
  }> {
    if (!existsSync(BACKUP_DIR)) {
      return { success: true, deletedFiles: [], deletedCount: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const files = readdirSync(BACKUP_DIR).filter((file) =>
      file.endsWith(".json"),
    );
    const deletedFiles: string[] = [];

    for (const file of files) {
      const filepath = join(BACKUP_DIR, file);
      const stats = statSync(filepath);

      if (stats.mtime < cutoffDate) {
        unlinkSync(filepath);
        deletedFiles.push(file);
      }
    }

    Logger.info(`Cleaned ${deletedFiles.length} old backup files`);
    return { success: true, deletedFiles, deletedCount: deletedFiles.length };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}
