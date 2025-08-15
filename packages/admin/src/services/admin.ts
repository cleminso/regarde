import { startWorker } from "jazz-tools/worker";
import { Loaded } from "jazz-tools";
import { RegistryWorkerAccount } from "@onboarding.jazz/shared-schemas";
import { Logger } from "../utils/logger.js";

import { AuditService } from "./audit.js";
import { NicknameService } from "./nickname.js";
import { ReservationService } from "./reservation.js";
import { BackupService } from "./backup.js";
import { HealthService } from "./health.js";

import {
  NicknameServiceInterface,
  ReservationServiceInterface,
  AuditServiceInterface,
  BackupServiceInterface,
  HealthServiceInterface,
  ReservationDetails,
  BackupInfo,
  HealthReport,
  NicknameHealthReport,
  FixResult,
} from "../types/services.js";
import { RegistryAuditEntry } from "@onboarding.jazz/shared-schemas/registry";

export class AdminService {
  private worker: any;
  private loadedWorker!: Loaded<typeof RegistryWorkerAccount>;

  private auditService!: AuditService;
  private nicknameService!: NicknameService;
  private reservationService!: ReservationService;
  private backupService!: BackupService;
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

    Logger.success(`Connected with Account ID: ${this.worker.id}`);

    try {
      this.loadedWorker = await this.worker.ensureLoaded({
        resolve: {
          root: {
            registry: true,
            reverseRegistry: true,
            auditLog: { "*": true },
            reservedNicknames: { $each: true },
          },
        },
      });

      if (!this.loadedWorker.root.registry) {
        throw new Error("Nickname registry is not available");
      }
      if (!this.loadedWorker.root.reverseRegistry) {
        throw new Error("Reverse nickname registry is not available");
      }
      if (!this.loadedWorker.root.auditLog) {
        throw new Error("Audit log is not available");
      }
      if (!this.loadedWorker.root.reservedNicknames) {
        throw new Error("Reserved nicknames registry is not available");
      }

      this.initializeServices();

      Logger.success("Registries and audit log loaded successfully");
      Logger.debug(
        `Initial audit log length: ${this.loadedWorker.root.auditLog.length}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to initialize AdminService: ${errorMessage}`);
      throw error;
    }
  }

  private initializeServices(): void {
    this.auditService = new AuditService(
      this.loadedWorker,
      this.loadedWorker.root.auditLog,
    );

    this.reservationService = new ReservationService(
      this.loadedWorker,
      this.loadedWorker.root.registry,
      this.loadedWorker.root.reservedNicknames,
      this.auditService,
    );

    this.nicknameService = new NicknameService(
      this.loadedWorker,
      this.loadedWorker.root.registry,
      this.loadedWorker.root.reverseRegistry,
      this.loadedWorker.root.reservedNicknames,
      this.auditService,
      this.reservationService,
    );

    this.backupService = new BackupService(
      this.loadedWorker,
      this.loadedWorker.root.registry,
      this.loadedWorker.root.reverseRegistry,
      this.auditService,
    );

    this.healthService = new HealthService(
      this.loadedWorker,
      this.loadedWorker.root.registry,
      this.loadedWorker.root.reverseRegistry,
      this.loadedWorker.root.reservedNicknames,
      this.loadedWorker.root.auditLog,
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
}
