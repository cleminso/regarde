import { startWorker } from "jazz-tools/worker";
import { RegistryWorkerAccount } from "@onboarding.jazz/shared-schemas/registry";
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

interface HealthReport {
  totalNicknames: number;
  totalAccounts: number;
  inconsistencies: {
    orphanedNicknames: string[];
    orphanedAccounts: string[];
    duplicateNicknames: Array<{ nickname: string; accounts: string[] }>;
    duplicateAccounts: Array<{ account: string; nicknames: string[] }>;
  };
  isHealthy: boolean;
}

interface BackupData {
  timestamp: string;
  registry: Record<string, string>;
  reverseRegistry: Record<string, string>;
}

export class AdminService {
  private worker: any;
  private nicknameRegistry: Record<string, string> = {};
  private reverseNicknameRegistry: Record<string, string> = {};

  async initialize(): Promise<void> {
    console.log("🔌Connecting to Jazz worker...");

    const accountId = process.env.JAZZ_WORKER_ACCOUNT;
    const accountSecret = process.env.JAZZ_WORKER_SECRET;
    const syncServer = process.env.JAZZ_SYNC_SERVER_URL;
    const apiKey = process.env.JAZZ_API_KEY;

    if (!accountId || !accountSecret || !syncServer) {
      throw new Error(
        "Missing required environment variables: JAZZ_WORKER_ACCOUNT, JAZZ_WORKER_SECRET, JAZZ_SYNC_SERVER_URL",
      );
    }

    try {
      const workerResult = await startWorker({
        AccountSchema: RegistryWorkerAccount,
        accountID: accountId,
        accountSecret: accountSecret,
        syncServer: syncServer + (apiKey ? `?key=${apiKey}` : ""),
      });
      this.worker = workerResult.worker;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to start Jazz worker: ${errorMessage}`);
    }

    console.log(`✅ Connected with Account ID: ${this.worker.id}`);

    try {
      const loadedWorker = await this.worker.ensureLoaded({
        resolve: { root: { registry: true, reverseRegistry: true } },
      });

      this.nicknameRegistry = loadedWorker?.root?.registry || {};
      this.reverseNicknameRegistry = loadedWorker?.root?.reverseRegistry || {};

      if (!this.nicknameRegistry || !this.reverseNicknameRegistry) {
        throw new Error(
          "Registry CoRecords not found in worker's account root",
        );
      }

      console.log(`✅ Registries loaded successfully`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load registries: ${errorMessage}`);
    }
  }

  async addNickname(
    nickname: string,
    accountId: string,
  ): Promise<{ success: boolean }> {
    this.validateNickname(nickname);
    this.validateAccountId(accountId);

    // Check if nickname already exists
    if (this.nicknameRegistry[nickname]) {
      throw new Error(
        `Nickname "${nickname}" already exists for account ${this.nicknameRegistry[nickname]}`,
      );
    }

    // Check if account already has a nickname
    if (this.reverseNicknameRegistry[accountId]) {
      throw new Error(
        `Account ${accountId} already has nickname "${this.reverseNicknameRegistry[accountId]}"`,
      );
    }

    // Add to both registries
    this.nicknameRegistry[nickname] = accountId;
    this.reverseNicknameRegistry[accountId] = nickname;

    return { success: true };
  }

  async updateNickname(
    nickname: string,
    accountId: string,
  ): Promise<{ success: boolean; oldAccountId?: string }> {
    this.validateNickname(nickname);
    this.validateAccountId(accountId);

    // Check if nickname exists
    const oldAccountId = this.nicknameRegistry[nickname];
    if (!oldAccountId) {
      throw new Error(`Nickname "${nickname}" does not exist`);
    }

    // Clean up old reverse mapping
    delete this.reverseNicknameRegistry[oldAccountId];

    // Check if new account already has a nickname
    const existingNickname = this.reverseNicknameRegistry[accountId];
    if (existingNickname && existingNickname !== nickname) {
      throw new Error(
        `Account ${accountId} already has nickname "${existingNickname}"`,
      );
    }

    this.nicknameRegistry[nickname] = accountId;
    this.reverseNicknameRegistry[accountId] = nickname;

    return { success: true, oldAccountId };
  }

  async removeNickname(
    nickname: string,
  ): Promise<{ success: boolean; removedAccountId?: string }> {
    this.validateNickname(nickname);

    const accountId = this.nicknameRegistry[nickname];
    if (!accountId) {
      throw new Error(`Nickname "${nickname}" does not exist`);
    }

    delete this.nicknameRegistry[nickname];
    delete this.reverseNicknameRegistry[accountId];

    return { success: true, removedAccountId: accountId };
  }

  async healthCheck(): Promise<HealthReport> {
    const registryEntries = Object.entries(this.nicknameRegistry);
    const reverseRegistryEntries = Object.entries(this.reverseNicknameRegistry);

    const orphanedNicknames: string[] = [];
    const orphanedAccounts: string[] = [];
    const nicknameToAccounts: Record<string, string[]> = {};
    const accountToNicknames: Record<string, string[]> = {};

    // Check for orphaned nicknames (nickname exists but reverse mapping doesn't)
    for (const [nickname, accountId] of registryEntries) {
      if (this.reverseNicknameRegistry[accountId] !== nickname) {
        orphanedNicknames.push(nickname);
      }

      // Track multiple accounts per nickname
      if (!nicknameToAccounts[nickname]) {
        nicknameToAccounts[nickname] = [];
      }
      nicknameToAccounts[nickname].push(accountId);
    }

    // Check for orphaned accounts (account exists but forward mapping doesn't)
    for (const [accountId, nickname] of reverseRegistryEntries) {
      if (this.nicknameRegistry[nickname] !== accountId) {
        orphanedAccounts.push(accountId);
      }

      // Track multiple nicknames per account
      if (!accountToNicknames[accountId]) {
        accountToNicknames[accountId] = [];
      }
      accountToNicknames[accountId].push(nickname);
    }

    const duplicateNicknames = Object.entries(nicknameToAccounts)
      .filter(([, accounts]) => accounts.length > 1)
      .map(([nickname, accounts]) => ({ nickname, accounts }));

    const duplicateAccounts = Object.entries(accountToNicknames)
      .filter(([, nicknames]) => nicknames.length > 1)
      .map(([account, nicknames]) => ({ account, nicknames }));

    const inconsistencies = {
      orphanedNicknames,
      orphanedAccounts,
      duplicateNicknames,
      duplicateAccounts,
    };

    const isHealthy =
      orphanedNicknames.length === 0 &&
      orphanedAccounts.length === 0 &&
      duplicateNicknames.length === 0 &&
      duplicateAccounts.length === 0;

    return {
      totalNicknames: registryEntries.length,
      totalAccounts: reverseRegistryEntries.length,
      inconsistencies,
      isHealthy,
    };
  }

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

    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      registry: { ...this.nicknameRegistry },
      reverseRegistry: { ...this.reverseNicknameRegistry },
    };

    writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    return filepath;
  }

  async restoreFromBackup(backupFile: string): Promise<{
    success: boolean;
    restored: { nicknames: number; accounts: number };
  }> {
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

    // Clear existing registries
    for (const key of Object.keys(this.nicknameRegistry)) {
      delete this.nicknameRegistry[key];
    }
    for (const key of Object.keys(this.reverseNicknameRegistry)) {
      delete this.reverseNicknameRegistry[key];
    }

    // Restore from backup
    for (const [nickname, accountId] of Object.entries(backupData.registry)) {
      this.nicknameRegistry[nickname] = accountId;
    }
    for (const [accountId, nickname] of Object.entries(
      backupData.reverseRegistry,
    )) {
      this.reverseNicknameRegistry[accountId] = nickname;
    }

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
    // Create backup first
    const backupFile = await this.downloadRegistries();
    console.log(`📦 Backup created: ${backupFile}`);

    // Confirm deletion
    const confirmed = await this.confirmDeletion();
    if (!confirmed) {
      throw new Error("Deletion cancelled by user");
    }

    const deletedCounts = {
      nicknames: Object.keys(this.nicknameRegistry).length,
      accounts: Object.keys(this.reverseNicknameRegistry).length,
    };

    // Clear all entries
    for (const key of Object.keys(this.nicknameRegistry)) {
      delete this.nicknameRegistry[key];
    }
    for (const key of Object.keys(this.reverseNicknameRegistry)) {
      delete this.reverseNicknameRegistry[key];
    }

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
        '⚠️  This will delete ALL registry entries. Type "DELETE" to confirm: ',
        (answer) => {
          rl.close();
          resolve(answer === "DELETE");
        },
      );
    });
  }

  private validateNickname(nickname: string): void {
    if (!nickname || typeof nickname !== "string") {
      throw new Error("Nickname must be a non-empty string");
    }
    if (nickname.length < 3 || nickname.length > 20) {
      throw new Error("Nickname must be between 3 and 20 characters");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
      throw new Error(
        "Nickname can only contain letters, numbers, underscores, and hyphens",
      );
    }
  }

  private validateAccountId(accountId: string): void {
    if (!accountId || typeof accountId !== "string") {
      throw new Error("Account ID must be a non-empty string");
    }
  }

  async cleanup(): Promise<void> {
    console.log("🧹 Cleanup completed");
  }

  async listBackups(): Promise<{
    backups: Array<{ filename: string; size: string; date: string }>;
  }> {
    if (!existsSync(BACKUP_DIR)) {
      return { backups: [] };
    }

    const files = readdirSync(BACKUP_DIR)
      .filter(
        (file: string) =>
          file.endsWith(".json") && file.startsWith("registry-backup-"),
      )
      .map((file: string) => {
        const filepath = join(BACKUP_DIR, file);
        const stats = statSync(filepath);
        return {
          filename: file,
          size: `${Math.round(stats.size / 1024)}KB`,
          date: stats.mtime.toLocaleDateString(),
        };
      })
      .sort((a: any, b: any) => b.filename.localeCompare(a.filename)); // Newest first

    return { backups: files };
  }

  async cleanOldBackups(
    daysToKeep: number = 30,
  ): Promise<{ deletedCount: number }> {
    if (!existsSync(BACKUP_DIR)) {
      return { deletedCount: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const files = readdirSync(BACKUP_DIR).filter(
      (file: string) =>
        file.endsWith(".json") && file.startsWith("registry-backup-"),
    );

    let deletedCount = 0;

    for (const file of files) {
      const filepath = join(BACKUP_DIR, file);
      const stats = statSync(filepath);

      if (stats.mtime < cutoffDate) {
        unlinkSync(filepath);
        deletedCount++;
      }
    }

    return { deletedCount };
  }
}
