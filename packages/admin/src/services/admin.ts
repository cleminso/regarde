import { startWorker } from "jazz-tools/worker";
import { Loaded } from "jazz-tools";
import { RegistryWorkerAccount } from "@regarde-dev/jazz-schemas";
import { Logger } from "../utils/logger.js";

import { AuditService } from "./audit.js";
import { NicknameService } from "./nickname.js";
import { ReservationService } from "./reservation.js";
import { BackupService } from "./backup.js";
import { ReservationBackupService } from "./reservationBackup.js";
import { HealthService } from "./health.js";

import {
  NicknameServiceInterface,
  ReservationServiceInterface,
  AuditServiceInterface,
  BackupServiceInterface,
  ReservationBackupServiceInterface,
  HealthServiceInterface,
  ReservationDetails,
  BackupInfo,
  ReservationBackupInfo,
  HealthReport,
  NicknameHealthReport,
  FixResult,
} from "../types/services.js";
import { RegistryAuditEntry } from "@regarde-dev/jazz-schemas/registry";

export class AdminService {
  private worker: any;
  private loadedWorker!: Loaded<typeof RegistryWorkerAccount>;

  private auditService!: AuditService;
  private nicknameService!: NicknameService;
  private reservationService!: ReservationService;
  private backupService!: BackupService;
  private reservationBackupService!: ReservationBackupService;
  private healthService!: HealthService;

  async initialize(): Promise<void> {
    Logger.status("Connecting to Jazz worker...");

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

    Logger.success(`Connected with Account ID: ${this.worker.$jazz.id}`);

    try {
      this.loadedWorker = await this.worker.$jazz.ensureLoaded({
              resolve: {
                root: {
                  registry: true,
                  reverseRegistry: true,
                  auditLog: { $each: true },
                  reservedNicknames: { $each: true },
                },
              },
            });

      if (!this.loadedWorker.root) {
        throw new Error("Worker account root is not available");
      }

      const { root } = this.loadedWorker;

      if (!root.registry) {
        throw new Error("Nickname registry is not available");
      }
      if (!root.reverseRegistry) {
        throw new Error("Reverse nickname registry is not available");
      }
      if (!root.auditLog) {
        throw new Error("Audit log is not available");
      }
      if (!root.reservedNicknames) {
        throw new Error("Reserved nicknames registry is not available");
      }

      this.initializeServices();

      Logger.success("Registries and audit log loaded successfully");
      Logger.debug(`Initial audit log length: ${root.auditLog.length}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to initialize AdminService: ${errorMessage}`);
      throw error;
    }
  }

  private initializeServices(): void {
    const { root } = this.loadedWorker;
    if (!root) {
      throw new Error("Cannot initialize services: root is not available");
    }

    if (
      !root.auditLog ||
      !root.registry ||
      !root.reverseRegistry ||
      !root.reservedNicknames
    ) {
      throw new Error("Required root properties are not loaded");
    }

    this.auditService = new AuditService(this.loadedWorker, root.auditLog);

    this.reservationService = new ReservationService(
      this.loadedWorker,
      root.registry,
      root.reservedNicknames,
      this.auditService,
    );

    this.nicknameService = new NicknameService(
      this.loadedWorker,
      root.registry,
      root.reverseRegistry,
      root.reservedNicknames,
      this.auditService,
      this.reservationService,
    );

    this.backupService = new BackupService(
      this.loadedWorker,
      root.registry,
      root.reverseRegistry,
      this.auditService,
    );

    this.reservationBackupService = new ReservationBackupService(
      this.loadedWorker,
      root.reservedNicknames,
      this.auditService,
    );

    this.healthService = new HealthService(
      this.loadedWorker,
      root.registry,
      root.reverseRegistry,
      root.reservedNicknames,
      root.auditLog,
      this.auditService,
    );
  }

  async addNickname(
    nickname: string,
    accountId: string,
    allowReserved?: boolean,
  ): Promise<{ success: boolean }> {
    return this.nicknameService.addNickname(nickname, accountId, allowReserved);
  }

  async updateNickname(
    nickname: string,
    newAccountId: string,
  ): Promise<{ success: boolean; oldAccountId?: string }> {
    return this.nicknameService.updateNickname(nickname, newAccountId);
  }

  async removeNickname(
    nickname: string,
  ): Promise<{ success: boolean; removedAccountId?: string }> {
    return this.nicknameService.removeNickname(nickname);
  }

  async reserveNickname(
    nickname: string,
    category: "admin" | "brand" | "system" | "offensive" | "custom" = "custom",
    reason?: string,
  ): Promise<{ success: boolean }> {
    return this.reservationService.reserveNickname(nickname, category, reason);
  }

  async unreserveNickname(nickname: string): Promise<{ success: boolean }> {
    return this.reservationService.unreserveNickname(nickname);
  }

  async listReservedNicknames(
    category?: "admin" | "brand" | "system" | "offensive" | "custom",
  ): Promise<{
    reservations: ReservationDetails[];
  }> {
    return this.reservationService.listReservedNicknames(category);
  }

  async checkReservationStatus(nickname: string): Promise<{
    isReserved: boolean;
    reservation?: ReservationDetails;
  }> {
    return this.reservationService.checkReservationStatus(nickname);
  }

  async isReserved(nickname: string): Promise<boolean> {
    return this.reservationService.isReserved(nickname);
  }

  async getChangeHistory(limit?: number): Promise<RegistryAuditEntry[]> {
    return this.auditService.getChangeHistory(limit);
  }

  async getHistoryForAccount(accountId: string): Promise<RegistryAuditEntry[]> {
    return this.auditService.getHistoryForAccount(accountId);
  }

  async getHistoryForNickname(nickname: string): Promise<RegistryAuditEntry[]> {
    return this.auditService.getHistoryForNickname(nickname);
  }

  async getHistoryBySource(
    source: "admin-cli" | "user-app" | "worker",
    limit?: number,
  ): Promise<RegistryAuditEntry[]> {
    return this.auditService.getHistoryBySource(source, limit);
  }

  validateNickname(nickname: string): void {
    this.nicknameService.validateNickname(nickname);
  }

  validateAccountId(accountId: string): void {
    this.nicknameService.validateAccountId(accountId);
  }

  async cleanup(): Promise<void> {
    Logger.status("Cleanup completed");
  }

  async healthCheck(): Promise<HealthReport> {
    return this.healthService.healthCheck();
  }

  async checkNicknameHealth(
    nickname?: string,
    accountId?: string,
  ): Promise<NicknameHealthReport> {
    return this.healthService.checkNicknameHealth(nickname, accountId);
  }

  async fixNickname(nickname?: string, accountId?: string): Promise<FixResult> {
    return this.healthService.fixNickname(nickname, accountId);
  }

  async downloadRegistries(): Promise<string> {
    return this.backupService.downloadRegistries();
  }

  async restoreFromBackup(backupFile: string): Promise<{
    success: boolean;
    restored: { nicknames: number; accounts: number };
  }> {
    return this.backupService.restoreFromBackup(backupFile);
  }

  async deleteAll(): Promise<{
    success: boolean;
    backupFile: string;
    deleted: { nicknames: number; accounts: number };
  }> {
    return this.backupService.deleteAll();
  }

  async listBackups(): Promise<{ backups: BackupInfo[] }> {
    return this.backupService.listBackups();
  }

  async cleanOldBackups(daysToKeep?: number): Promise<{
    success: boolean;
    deletedFiles: string[];
    deletedCount: number;
  }> {
    return this.backupService.cleanOldBackups(daysToKeep);
  }

  // Reservation backup methods
  async backupReservations(): Promise<string> {
    return this.reservationBackupService.backupReservations();
  }

  async restoreReservations(backupFile: string): Promise<{
    success: boolean;
    restored: { reservations: number };
  }> {
    return this.reservationBackupService.restoreReservations(backupFile);
  }

  async listReservationBackups(): Promise<{
    backups: ReservationBackupInfo[];
  }> {
    return this.reservationBackupService.listReservationBackups();
  }

  async cleanOldReservationBackups(daysToKeep?: number): Promise<{
    success: boolean;
    deletedFiles: string[];
    deletedCount: number;
  }> {
    return this.reservationBackupService.cleanOldReservationBackups(daysToKeep);
  }

  async clearAuditLog(): Promise<void> {
    const { root } = this.loadedWorker;
    if (!root?.auditLog) return;

    while (root.auditLog.length > 0) {
      root.auditLog.$jazz.pop();
    }

    Logger.info("Audit log cleared");
  }

  async checkConnectivity(): Promise<{
    workerOnline: boolean;
    syncServerConnected: boolean;
    lastSync: number | null;
    responseTimeMs: number;
  }> {
    const startTime = Date.now();

    try {
      const { root } = this.loadedWorker;
      const workerOnline = !!root;

      const syncServerConnected = !!(root?.registry && root?.reverseRegistry);

      const responseTimeMs = Date.now() - startTime;

      return {
        workerOnline,
        syncServerConnected,
        lastSync: Date.now(),
        responseTimeMs,
      };
    } catch (error) {
      return {
        workerOnline: false,
        syncServerConnected: false,
        lastSync: null,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  async runBenchmark(operations: number = 100): Promise<{
    averageResponseTime: number;
    operationsPerSecond: number;
    memoryUsage: number;
  }> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    for (let i = 0; i < operations; i++) {
      const { root } = this.loadedWorker;
      if (root?.registry) {
        Object.keys(root.registry).length;
      }
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalTime = endTime - startTime;

    return {
      averageResponseTime: totalTime / operations,
      operationsPerSecond: Math.round((operations / totalTime) * 1000),
      memoryUsage: Math.round(endMemory - startMemory),
    };
  }

  async auditSecurity(days: number = 7): Promise<{
    totalOperations: number;
    adminOperations: number;
    failedOperations: number;
    suspiciousActivity: Array<{
      description: string;
      timestamp: number;
    }>;
  }> {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentEntries = await this.auditService.getChangeHistory(1000);

    const relevantEntries = recentEntries.filter(
      (entry) => entry.timestamp >= cutoffTime,
    );

    const adminOps = relevantEntries.filter(
      (entry) => entry.source === "admin-cli",
    ).length;
    const suspiciousActivity: Array<{
      description: string;
      timestamp: number;
    }> = [];

    // Look for suspicious patterns
    const accountChanges = new Map<string, number>();
    relevantEntries.forEach((entry) => {
      const count = accountChanges.get(entry.jazzAccountId) || 0;
      accountChanges.set(entry.jazzAccountId, count + 1);
    });

    accountChanges.forEach((count, accountId) => {
      if (count > 10) {
        suspiciousActivity.push({
          description: `Account ${accountId} had ${count} changes in ${days} days`,
          timestamp: Date.now(),
        });
      }
    });

    return {
      totalOperations: relevantEntries.length,
      adminOperations: adminOps,
      failedOperations: 0,
      suspiciousActivity,
    };
  }

  async validateDataIntegrity(
    fix: boolean = false,
    verbose: boolean = false,
  ): Promise<{
    isValid: boolean;
    issues: string[];
    fixedIssues: string[];
  }> {
    const issues: string[] = [];
    const fixedIssues: string[] = [];
    const { root } = this.loadedWorker;

    if (!root) {
      throw new Error("Worker root is not available");
    }

    if (verbose) {
      Logger.info("Validating registry integrity...");
    }

    if (root.registry) {
      for (const [nickname, accountId] of Object.entries(root.registry)) {
        const reverseEntry = root.reverseRegistry?.[accountId as string];
        if (reverseEntry !== nickname) {
          const issue = `Forward registry maps ${nickname} -> ${accountId}, but reverse registry maps ${accountId} -> ${reverseEntry}`;
          issues.push(issue);

          if (fix && root.reverseRegistry) {
            root.reverseRegistry.$jazz.set(accountId as string, nickname);
            fixedIssues.push(`Fixed reverse registry for ${accountId}`);
          }
        }
      }
    }

    if (root.reverseRegistry) {
      for (const [accountId, nickname] of Object.entries(
        root.reverseRegistry,
      )) {
        const forwardEntry = root.registry?.[nickname as string];
        if (forwardEntry !== accountId) {
          const issue = `Reverse registry maps ${accountId} -> ${nickname}, but forward registry maps ${nickname} -> ${forwardEntry}`;
          issues.push(issue);

          if (fix && root.registry) {
            root.registry.$jazz.set(nickname as string, accountId);
            fixedIssues.push(`Fixed forward registry for ${nickname}`);
          }
        }
      }
    }

    if (verbose) {
      Logger.info(`Found ${issues.length} integrity issues`);
      if (fix) {
        Logger.info(`Fixed ${fixedIssues.length} issues`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      fixedIssues,
    };
  }

  async checkDuplicates(): Promise<{
    duplicates: Array<{
      nickname: string;
      accounts: string[];
    }>;
    reverseDuplicates: Array<{
      accountId: string;
      nicknames: string[];
    }>;
  }> {
    const { root } = this.loadedWorker;
    if (!root) {
      throw new Error("Worker root is not available");
    }

    const duplicates: Array<{ nickname: string; accounts: string[] }> = [];
    const reverseDuplicates: Array<{ accountId: string; nicknames: string[] }> =
      [];

    if (root.registry) {
      const nicknameGroups = new Map<string, string[]>();
      for (const [nickname, accountId] of Object.entries(root.registry)) {
        if (!nicknameGroups.has(nickname)) {
          nicknameGroups.set(nickname, []);
        }
        nicknameGroups.get(nickname)!.push(accountId as string);
      }

      nicknameGroups.forEach((accounts, nickname) => {
        if (accounts.length > 1) {
          duplicates.push({ nickname, accounts });
        }
      });
    }

    if (root.reverseRegistry) {
      const accountGroups = new Map<string, string[]>();
      for (const [accountId, nickname] of Object.entries(
        root.reverseRegistry,
      )) {
        if (!accountGroups.has(accountId)) {
          accountGroups.set(accountId, []);
        }
        accountGroups.get(accountId)!.push(nickname as string);
      }

      accountGroups.forEach((nicknames, accountId) => {
        if (nicknames.length > 1) {
          reverseDuplicates.push({ accountId, nicknames });
        }
      });
    }

    return { duplicates, reverseDuplicates };
  }

  get nickname(): NicknameServiceInterface {
    return this.nicknameService;
  }

  get reservation(): ReservationServiceInterface {
    return this.reservationService;
  }

  get audit(): AuditServiceInterface {
    return this.auditService;
  }

  get backup(): BackupServiceInterface {
    return this.backupService;
  }

  get health(): HealthServiceInterface {
    return this.healthService;
  }

  get reservationBackup(): ReservationBackupServiceInterface {
    return this.reservationBackupService;
  }
}
