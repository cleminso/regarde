import { startWorker } from "jazz-tools/worker";
import {
  RegistryWorkerAccount,
  RegistryAuditEntry,
} from "@onboarding.jazz/shared-schemas/registry";
import { ulid } from "ulidx";
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
import { OnboardingAccount } from "@onboarding.jazz/shared-schemas/profile";

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

interface NicknameHealthReport {
  nickname?: string;
  accountId?: string;
  registryStatus: 'ok' | 'missing' | 'mismatch';
  reverseRegistryStatus: 'ok' | 'missing' | 'mismatch';
  onboardingStatus: 'ok' | 'missing' | 'inactive' | 'mismatch' | 'not_found';
  issues: string[];
  recommendations: string[];
}

interface FixResult {
  message: string;
  changes: string[];
}

export class AdminService {
  private worker: any;
  private nicknameRegistry: Record<string, string> = {};
  private reverseNicknameRegistry: Record<string, string> = {};
  private auditLog: any;

  async initialize(): Promise<void> {
    console.log("🔌 Connecting to Jazz worker...");

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
        resolve: {
          root: {
            registry: true,
            reverseRegistry: true,
            auditLog: { "*": true },
          },
        },
      });

      this.nicknameRegistry = loadedWorker?.root?.registry || {};
      this.reverseNicknameRegistry = loadedWorker?.root?.reverseRegistry || {};
      this.auditLog = loadedWorker?.root?.auditLog;

      if (!this.nicknameRegistry || !this.reverseNicknameRegistry) {
        throw new Error(
          "Registry CoRecords not found in worker's account root",
        );
      }

      if (!this.auditLog) {
        throw new Error("AuditLog CoList not found in worker's account root");
      }

      console.log(`✅ Registries and audit log loaded successfully`);
      console.log(`📊 Audit log type:`, typeof this.auditLog);
      console.log(`📊 Audit log constructor:`, this.auditLog.constructor.name);
      console.log(`📊 Initial audit log length: ${this.auditLog.length}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load registries: ${errorMessage}`);
    }
  }

  private async logChange(
    jazzAccountId: string,
    oldNickname?: string,
    newNickname?: string,
    source: "admin-cli" | "user-app" | "worker" = "admin-cli",
  ): Promise<void> {
    try {
      console.log(`📝 Creating audit entry for account: ${jazzAccountId}`);

      const entry = RegistryAuditEntry.create({
        monotonicId: ulid(),
        timestamp: Date.now(),
        jazzAccountId,
        oldNickname: oldNickname || undefined,
        newNickname: newNickname || undefined,
        changedBy: this.worker.id,
        source,
      });

      console.log(`📝 Created entry:`, entry);
      console.log(`📝 Entry keys:`, Object.keys(entry));
      console.log(`📝 Entry monotonicId:`, entry.monotonicId);

      this.auditLog.push(entry);

      console.log(`📝 Audit log length after push: ${this.auditLog.length}`);

      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log(`📝 Verifying entry was added...`);
      const lastEntry = this.auditLog[this.auditLog.length - 1];
      console.log(`📝 Last entry:`, lastEntry);

      console.log(`📝 Audit entry created: ${entry.monotonicId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Failed to create audit entry: ${errorMessage}`);
      console.warn(`⚠️ Error details:`, error);
      // Don't throw - audit logging failure shouldn't break registry operations
    }
  }

  async addNickname(
    nickname: string,
    accountId: string,
  ): Promise<{ success: boolean }> {
    this.validateNickname(nickname);
    this.validateAccountId(accountId);

    if (this.nicknameRegistry[nickname]) {
      throw new Error(
        `Nickname "${nickname}" already exists for account ${this.nicknameRegistry[nickname]}`,
      );
    }

    if (this.reverseNicknameRegistry[accountId]) {
      throw new Error(
        `Account ${accountId} already has nickname "${this.reverseNicknameRegistry[accountId]}"`,
      );
    }

    this.nicknameRegistry[nickname] = accountId;
    this.reverseNicknameRegistry[accountId] = nickname;

    await this.logChange(accountId, undefined, nickname);

    return { success: true };
  }

  async updateNickname(
    nickname: string,
    accountId: string,
  ): Promise<{ success: boolean; oldAccountId?: string }> {
    this.validateNickname(nickname);
    this.validateAccountId(accountId);

    const oldAccountId = this.nicknameRegistry[nickname];
    if (!oldAccountId) {
      throw new Error(`Nickname "${nickname}" does not exist`);
    }

    delete this.reverseNicknameRegistry[oldAccountId];

    const existingNickname = this.reverseNicknameRegistry[accountId];
    if (existingNickname && existingNickname !== nickname) {
      throw new Error(
        `Account ${accountId} already has nickname "${existingNickname}"`,
      );
    }

    this.nicknameRegistry[nickname] = accountId;
    this.reverseNicknameRegistry[accountId] = nickname;

    await this.logChange(oldAccountId, nickname, undefined);
    await this.logChange(accountId, undefined, nickname);

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

    await this.logChange(accountId, nickname, undefined);

    return { success: true, removedAccountId: accountId };
  }

  async getChangeHistory(limit: number = 20): Promise<RegistryAuditEntry[]> {
    try {
      console.log(`📊 Audit log length: ${this.auditLog.length}`);

      const entries: RegistryAuditEntry[] = [];

      console.log(`📊 Trying _cachedEntries access`);
      const auditLogAny = this.auditLog as any;
      const rawData = auditLogAny._raw;

      if (
        rawData &&
        rawData._cachedEntries &&
        Array.isArray(rawData._cachedEntries)
      ) {
        console.log(`📊 Found ${rawData._cachedEntries.length} cached entries`);

        for (let i = 0; i < rawData._cachedEntries.length; i++) {
          const cachedEntry = rawData._cachedEntries[i];
          console.log(`📊 Cached entry ${i}:`, cachedEntry);

          if (cachedEntry && cachedEntry.value) {
            try {
              const entryId = cachedEntry.value;
              console.log(`📊 Loading entry with ID: ${entryId}`);

              // Use the worker to load the entry
              const loadedEntry = await RegistryAuditEntry.load(
                entryId,
                this.worker,
              );
              console.log(`📊 Loaded entry:`, loadedEntry);

              if (
                loadedEntry &&
                typeof loadedEntry === "object" &&
                "monotonicId" in loadedEntry
              ) {
                entries.push(loadedEntry as unknown as RegistryAuditEntry);
              }
            } catch (loadError) {
              console.warn(`⚠️ Failed to load entry ${i}:`, loadError);
            }
          }
        }
      }

      if (entries.length === 0) {
        console.log(`📊 Trying Array.from() with explicit loading`);
        try {
          const arrayEntries = Array.from(this.auditLog);
          console.log(`📊 Array.from() result:`, arrayEntries);

          for (let i = 0; i < arrayEntries.length; i++) {
            const entry = arrayEntries[i];
            console.log(`📊 Array entry ${i}:`, entry);

            if (
              entry === null &&
              rawData &&
              rawData._cachedEntries &&
              rawData._cachedEntries[i]
            ) {
              try {
                const entryId = rawData._cachedEntries[i].value;
                const loadedEntry = await RegistryAuditEntry.load(
                  entryId,
                  this.worker,
                );
                if (
                  loadedEntry &&
                  typeof loadedEntry === "object" &&
                  "monotonicId" in loadedEntry
                ) {
                  entries.push(loadedEntry as unknown as RegistryAuditEntry);
                }
              } catch (loadError) {
                console.warn(
                  `⚠️ Failed to load entry ${i} via fallback:`,
                  loadError,
                );
              }
            }
          }
        } catch (arrayError) {
          console.warn(`⚠️ Array.from() failed:`, arrayError);
        }
      }

      console.log(`📊 Valid entries: ${entries.length}`);

      const sortedEntries = entries.sort((a, b) =>
        b.monotonicId.localeCompare(a.monotonicId),
      );
      return sortedEntries.slice(0, limit);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get change history: ${errorMessage}`);
    }
  }

  async getHistoryForAccount(accountId: string): Promise<RegistryAuditEntry[]> {
    try {
      const entries: RegistryAuditEntry[] = [];

      for (const entry of this.auditLog) {
        if (
          entry &&
          typeof entry === "object" &&
          "jazzAccountId" in entry &&
          entry.jazzAccountId === accountId
        ) {
          entries.push(entry as RegistryAuditEntry);
        }
      }

      return entries.sort((a, b) => b.monotonicId.localeCompare(a.monotonicId));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get history for account: ${errorMessage}`);
    }
  }

  async getHistoryForNickname(nickname: string): Promise<RegistryAuditEntry[]> {
    try {
      const entries: RegistryAuditEntry[] = [];

      for (const entry of this.auditLog) {
        if (
          entry &&
          typeof entry === "object" &&
          "oldNickname" in entry &&
          "newNickname" in entry
        ) {
          const auditEntry = entry as RegistryAuditEntry;
          if (
            auditEntry.oldNickname === nickname ||
            auditEntry.newNickname === nickname
          ) {
            entries.push(auditEntry);
          }
        }
      }

      return entries.sort((a, b) => b.monotonicId.localeCompare(a.monotonicId));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get history for nickname: ${errorMessage}`);
    }
  }

  async getHistoryBySource(
    source: "admin-cli" | "user-app" | "worker",
  ): Promise<RegistryAuditEntry[]> {
    try {
      const entries: RegistryAuditEntry[] = [];

      for (const entry of this.auditLog) {
        if (entry && typeof entry === "object" && "source" in entry) {
          const auditEntry = entry as RegistryAuditEntry;
          if (auditEntry.source === source) {
            entries.push(auditEntry);
          }
        }
      }

      return entries.sort((a, b) => b.monotonicId.localeCompare(a.monotonicId));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get history by source: ${errorMessage}`);
    }
  }

  async healthCheck(): Promise<HealthReport> {
    const registryEntries = Object.entries(this.nicknameRegistry);
    const reverseRegistryEntries = Object.entries(this.reverseNicknameRegistry);

    const orphanedNicknames: string[] = [];
    const orphanedAccounts: string[] = [];
    const nicknameToAccounts: Record<string, string[]> = {};
    const accountToNicknames: Record<string, string[]> = {};

    for (const [nickname, accountId] of registryEntries) {
      if (this.reverseNicknameRegistry[accountId] !== nickname) {
        orphanedNicknames.push(nickname);
      }

      if (!nicknameToAccounts[nickname]) {
        nicknameToAccounts[nickname] = [];
      }
      nicknameToAccounts[nickname].push(accountId);
    }

    for (const [accountId, nickname] of reverseRegistryEntries) {
      if (this.nicknameRegistry[nickname] !== accountId) {
        orphanedAccounts.push(accountId);
      }

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
    const backupFile = await this.downloadRegistries();
    console.log(`📦 Backup created: ${backupFile}`);

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

  async checkNicknameHealth(nickname?: string, accountId?: string): Promise<NicknameHealthReport> {
    let targetNickname = nickname;
    let targetAccountId = accountId;
    
    // Resolve nickname/accountId if only one is provided
    if (nickname && !accountId) {
      targetAccountId = this.nicknameRegistry[nickname];
    } else if (accountId && !nickname) {
      targetNickname = this.reverseNicknameRegistry[accountId];
    }
    
    const report: NicknameHealthReport = {
      nickname: targetNickname,
      accountId: targetAccountId,
      registryStatus: 'ok',
      reverseRegistryStatus: 'ok',
      onboardingStatus: 'ok',
      issues: [],
      recommendations: []
    };
    
    if (targetNickname) {
      const registryAccountId = this.nicknameRegistry[targetNickname];
      if (!registryAccountId) {
        report.registryStatus = 'missing';
        report.issues.push(`Nickname "${targetNickname}" not found in registry`);
      } else if (registryAccountId !== targetAccountId) {
        report.registryStatus = 'mismatch';
        report.issues.push(`Registry shows nickname "${targetNickname}" belongs to ${registryAccountId}, but expected ${targetAccountId}`);
      }
    }
    
    if (targetAccountId) {
      const reverseNickname = this.reverseNicknameRegistry[targetAccountId];
      if (!reverseNickname) {
        report.reverseRegistryStatus = 'missing';
        report.issues.push(`Account ID "${targetAccountId}" not found in reverse registry`);
      } else if (reverseNickname !== targetNickname) {
        report.reverseRegistryStatus = 'mismatch';
        report.issues.push(`Reverse registry shows account "${targetAccountId}" has nickname "${reverseNickname}", but expected "${targetNickname}"`);
      }
    }
    
    if (targetAccountId) {
      try {
        const account = await OnboardingAccount.load(targetAccountId, {
          resolve: {
            profile: {
              onboarding: true,
            },
          },
        });
        
        if (!account) {
          report.onboardingStatus = 'not_found';
          report.issues.push(`Account "${targetAccountId}" not found or not accessible`);
        } else if (!account.profile) {
          report.onboardingStatus = 'missing';
          report.issues.push(`Account "${targetAccountId}" has no profile`);
        } else {
          const profile = account.profile as any;
          const onboardingNickname = profile.onboarding;
          
          if (!onboardingNickname) {
            report.onboardingStatus = 'missing';
            report.issues.push(`Account "${targetAccountId}" has no onboarding nickname data`);
            report.recommendations.push(`Create onboarding nickname data for account`);
          } else {
            const isActive = onboardingNickname.isActive;
            const storedNickname = onboardingNickname.nickname;
            
            if (!isActive) {
              report.onboardingStatus = 'inactive';
              report.issues.push(`OnboardingNickname is inactive (isActive: false)`);
              report.recommendations.push(`Activate onboarding nickname and sync with registry`);
            }
            
            if (storedNickname !== targetNickname) {
              report.onboardingStatus = 'mismatch';
              report.issues.push(`OnboardingNickname shows "${storedNickname}", but registry shows "${targetNickname}"`);
              report.recommendations.push(`Sync onboarding nickname with registry data`);
            }
          }
        }
      } catch (error) {
        report.onboardingStatus = 'not_found';
        report.issues.push(`Failed to load account "${targetAccountId}": ${error}`);
      }
    }
    
    return report;
  }

  async fixNickname(nickname?: string, accountId?: string): Promise<FixResult> {
    const changes: string[] = [];
    
    let targetNickname = nickname;
    let targetAccountId = accountId;
    
    if (nickname && !accountId) {
      targetAccountId = this.nicknameRegistry[nickname];
      if (targetAccountId) {
        changes.push(`Resolved account ID: ${targetAccountId}`);
      }
    } else if (accountId && !nickname) {
      targetNickname = this.reverseNicknameRegistry[accountId];
      if (targetNickname) {
        changes.push(`Resolved nickname: ${targetNickname}`);
      }
    }
    
    if (!targetNickname || !targetAccountId) {
      throw new Error("Could not resolve both nickname and account ID");
    }
    
    const registryAccountId = this.nicknameRegistry[targetNickname];
    if (registryAccountId !== targetAccountId) {
      this.nicknameRegistry[targetNickname] = targetAccountId;
      changes.push(`Updated registry: ${targetNickname} → ${targetAccountId}`);
    }
    
    const reverseNickname = this.reverseNicknameRegistry[targetAccountId];
    if (reverseNickname !== targetNickname) {
      this.reverseNicknameRegistry[targetAccountId] = targetNickname;
      changes.push(`Updated reverse registry: ${targetAccountId} → ${targetNickname}`);
    }
    
    try {
      const account = await OnboardingAccount.load(targetAccountId, {
        resolve: {
          profile: {
            onboarding: true,
          },
        },
      });
      
      if (account && account.profile) {
        const profile = account.profile as any;
        const onboardingNickname = profile.onboarding;
        
        if (onboardingNickname) {
          let nicknameChanged = false;
          
          if (onboardingNickname.nickname !== targetNickname) {
            onboardingNickname.nickname = targetNickname;
            nicknameChanged = true;
            changes.push(`Updated onboarding nickname: ${targetNickname}`);
          }
          
          if (!onboardingNickname.isActive) {
            onboardingNickname.isActive = true;
            nicknameChanged = true;
            changes.push(`Activated onboarding nickname`);
          }
          
          if (nicknameChanged) {
            onboardingNickname.lastModified = Date.now();
            changes.push(`Updated lastModified timestamp`);
          }
        } else {
          changes.push(`Warning: No onboarding nickname data found to fix`);
        }
      }
    } catch (error) {
      changes.push(`Warning: Could not fix onboarding nickname: ${error}`);
    }
    
    await this.logChange(targetAccountId, undefined, targetNickname, "admin-cli");
    changes.push(`Logged fix operation to audit trail`);
    
    return {
      message: `Successfully fixed nickname "${targetNickname}" for account "${targetAccountId}"`,
      changes
    };
  }
}
