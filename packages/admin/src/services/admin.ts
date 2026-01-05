import { startWorker } from "jazz-tools/worker";
import { Loaded } from "jazz-tools";
import {
  RegistryWorkerAccount,
  type TRegistryAuditEntry,
} from "@regarde-dev/core";
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
  ReservationListResult,
  ReservationResult,
  ReservationStatusResult,
  BackupInfo,
  ReservationBackupInfo,
  HealthReport,
  NicknameHealthReport,
  FixResult,
} from "../types/services.js";

function buildSyncServerUrl(baseUrl: string, apiKey?: string): string {
  const base = baseUrl.trim();
  if (!apiKey) return base;

  try {
    const url = new URL(base);
    if (url.searchParams.has("key") === false) {
      url.searchParams.set("key", apiKey);
    }
    return url.toString();
  } catch {
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}key=${encodeURIComponent(apiKey)}`;
  }
}

type RegistryWorkerResolve = {
  root: {
    registry: true;
    reverseRegistry: true;
    auditLog: { $each: true };
    reservedNicknames: { $each: true };
  };
};

type LoadedRegistryWorkerAccount = Loaded<
  typeof RegistryWorkerAccount,
  RegistryWorkerResolve
>;

export class AdminService {
  private worker!: Loaded<typeof RegistryWorkerAccount>;
  private loadedWorker!: LoadedRegistryWorkerAccount;
  private shutdownWorker?: () => Promise<void>;

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
      const syncServerUrl = buildSyncServerUrl(syncServer, apiKey);
      const workerResult = await startWorker({
        AccountSchema: RegistryWorkerAccount,
        accountID: accountId,
        accountSecret: accountSecret,
        syncServer: syncServerUrl,
      });
      this.worker = workerResult.worker;
      this.shutdownWorker = workerResult.shutdownWorker;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to start Jazz worker: ${errorMessage}`, {
        cause: error,
      });
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

      if (!this.loadedWorker.$isLoaded) {
        throw new Error("Failed to load worker account");
      }

      const { root } = this.loadedWorker;

      if (!root.$isLoaded) {
        throw new Error("Worker account root is not available");
      }

      if (!root.registry?.$isLoaded) {
        throw new Error("Nickname registry is not available");
      }
      if (!root.reverseRegistry?.$isLoaded) {
        throw new Error("Reverse nickname registry is not available");
      }
      if (!root.auditLog?.$isLoaded) {
        throw new Error("Audit log is not available");
      }
      if (!root.reservedNicknames?.$isLoaded) {
        throw new Error("Reserved nicknames registry is not available");
      }

      this.initializeServices();

      Logger.success("Registries and audit log loaded successfully");
      Logger.debug(`Initial audit log length: ${root.auditLog?.length || 0}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to initialize AdminService: ${errorMessage}`);
      throw error;
    }
  }

  private initializeServices(): void {
    const { root } = this.loadedWorker;
    if (!root?.$isLoaded) {
      throw new Error("Cannot initialize services: root is not available");
    }

    if (
      !root.auditLog?.$isLoaded ||
      !root.registry?.$isLoaded ||
      !root.reverseRegistry?.$isLoaded ||
      !root.reservedNicknames?.$isLoaded
    ) {
      throw new Error("Required root properties are not loaded");
    }

    const registry = root.registry!;
    const reverseRegistry = root.reverseRegistry!;
    const auditLog = root.auditLog!;
    const reservedNicknames = root.reservedNicknames!;

    this.auditService = new AuditService(this.loadedWorker, auditLog);

    this.reservationService = new ReservationService(
      this.loadedWorker,
      registry,
      reservedNicknames,
      this.auditService,
    );

    this.nicknameService = new NicknameService(
      this.loadedWorker,
      registry,
      reverseRegistry,
      reservedNicknames,
      this.auditService,
    );

    this.backupService = new BackupService(
      this.loadedWorker,
      registry,
      reverseRegistry,
      this.auditService,
    );

    this.reservationBackupService = new ReservationBackupService(
      this.loadedWorker,
      reservedNicknames,
    );

    this.healthService = new HealthService(
      this.loadedWorker,
      registry,
      reverseRegistry,
      reservedNicknames,
      auditLog,
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
  ): Promise<ReservationResult> {
    return this.reservationService.reserveNickname(nickname, category, reason);
  }

  async unreserveNickname(nickname: string): Promise<ReservationResult> {
    return this.reservationService.unreserveNickname(nickname);
  }

  async listReservedNicknames(
    category?: "admin" | "brand" | "system" | "offensive" | "custom",
  ): Promise<ReservationListResult> {
    return this.reservationService.listReservedNicknames(category);
  }

  async checkReservationStatus(
    nickname: string,
  ): Promise<ReservationStatusResult> {
    return this.reservationService.checkReservationStatus(nickname);
  }

  async isReserved(nickname: string): Promise<boolean> {
    return this.reservationService.isReserved(nickname);
  }

  async getChangeHistory(limit?: number): Promise<TRegistryAuditEntry[]> {
    return this.auditService.getChangeHistory(limit);
  }

  async getHistoryForAccount(
    accountId: string,
  ): Promise<TRegistryAuditEntry[]> {
    return this.auditService.getHistoryForAccount(accountId);
  }

  async getHistoryForNickname(
    nickname: string,
  ): Promise<TRegistryAuditEntry[]> {
    return this.auditService.getHistoryForNickname(nickname);
  }

  async getHistoryBySource(
    source: "admin-cli" | "user-app" | "worker",
    limit?: number,
  ): Promise<TRegistryAuditEntry[]> {
    return this.auditService.getHistoryBySource(source, limit);
  }

  validateNickname(nickname: string): void {
    this.nicknameService.validateNickname(nickname);
  }

  validateAccountId(accountId: string): void {
    this.nicknameService.validateAccountId(accountId);
  }

  getWorker(): Loaded<typeof RegistryWorkerAccount> {
    return this.worker;
  }

  getLoadedWorker(): LoadedRegistryWorkerAccount {
    return this.loadedWorker;
  }

  async getMetrics(): Promise<{
    totalNicknames: number;
    totalAccounts: number;
    reservedNicknames: number;
    auditLogEntries: number;
    lastUpdated: number;
  }> {
    const { root } = this.loadedWorker;
    const rootLoaded = root !== undefined && root.$isLoaded === true;
    if (rootLoaded === false) {
      throw new Error("Worker root is not available");
    }

    const registryLoaded =
      root.registry !== undefined && root.registry.$isLoaded === true;
    if (registryLoaded === false) {
      throw new Error("Nickname registry is not available");
    }

    const reverseRegistryLoaded =
      root.reverseRegistry !== undefined &&
      root.reverseRegistry.$isLoaded === true;
    if (reverseRegistryLoaded === false) {
      throw new Error("Reverse nickname registry is not available");
    }

    const reservedNicknamesLoaded =
      root.reservedNicknames !== undefined &&
      root.reservedNicknames.$isLoaded === true;
    if (reservedNicknamesLoaded === false) {
      throw new Error("Reserved nicknames registry is not available");
    }

    const auditLogLoaded =
      root.auditLog !== undefined && root.auditLog.$isLoaded === true;
    if (auditLogLoaded === false) {
      throw new Error("Audit log is not available");
    }

    return {
      totalNicknames: Object.keys(root.registry).length,
      totalAccounts: Object.keys(root.reverseRegistry).length,
      reservedNicknames: Object.keys(root.reservedNicknames).length,
      auditLogEntries: root.auditLog.length,
      lastUpdated: Date.now(),
    };
  }

  async cleanup(): Promise<void> {
    try {
      await this.shutdownWorker?.();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.warning(`Cleanup failed: ${errorMessage}`);
    } finally {
      this.shutdownWorker = undefined;
      Logger.status("Cleanup completed");
    }
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
    if (!root?.$isLoaded || !root.auditLog?.$isLoaded) return;

    while (root.auditLog.length > 0) {
      root.auditLog.$jazz.pop();
    }

    await root.auditLog.$jazz.waitForSync();

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
      const workerOnline = !!root?.$isLoaded;

      const syncServerConnected = !!(
        root?.$isLoaded &&
        root?.registry?.$isLoaded &&
        root?.reverseRegistry?.$isLoaded
      );

      const responseTimeMs = Date.now() - startTime;

      return {
        workerOnline,
        syncServerConnected,
        lastSync: Date.now(),
        responseTimeMs,
      };
    } catch {
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
      if (root?.$isLoaded && root?.registry?.$isLoaded) {
        const _registrySize = Object.keys(root.registry).length;
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

    if (!root?.$isLoaded) {
      throw new Error("Worker root is not available");
    }

    if (!root.registry?.$isLoaded || !root.reverseRegistry?.$isLoaded) {
      throw new Error("Registries are not available");
    }

    const registry = root.registry!;
    const reverseRegistry = root.reverseRegistry!;

    if (verbose) {
      Logger.info("Validating registry integrity...");
    }

    for (const [nickname, accountId] of Object.entries(registry)) {
      const reverseEntry = reverseRegistry[accountId as string];
      if (reverseEntry !== nickname) {
        const issue = `Forward registry maps ${nickname} -> ${accountId}, but reverse registry maps ${accountId} -> ${reverseEntry}`;
        issues.push(issue);

        if (fix) {
          reverseRegistry.$jazz.set(accountId as string, nickname);
          fixedIssues.push(`Fixed reverse registry for ${accountId}`);
        }
      }
    }

    for (const [accountId, nickname] of Object.entries(reverseRegistry)) {
      const forwardEntry = registry[nickname as string];
      if (forwardEntry !== accountId) {
        const issue = `Reverse registry maps ${accountId} -> ${nickname}, but forward registry maps ${nickname} -> ${forwardEntry}`;
        issues.push(issue);

        if (fix) {
          registry.$jazz.set(nickname as string, accountId);
          fixedIssues.push(`Fixed forward registry for ${nickname}`);
        }
      }
    }

    if (fix && fixedIssues.length > 0) {
      await Promise.all([
        registry.$jazz.waitForSync(),
        reverseRegistry.$jazz.waitForSync(),
      ]);
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
    if (!root?.$isLoaded) {
      throw new Error("Worker root is not available");
    }

    const duplicates: Array<{ nickname: string; accounts: string[] }> = [];
    const reverseDuplicates: Array<{ accountId: string; nicknames: string[] }> =
      [];

    if (root.registry?.$isLoaded) {
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

    if (root.reverseRegistry?.$isLoaded) {
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
