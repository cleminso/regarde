import type { TRegistryAuditEntry } from "@regarde-dev/core";

export interface HealthReport {
  status: "healthy" | "warning" | "error";
  registryEntries: number;
  reverseRegistryEntries: number;
  reservedNicknames: number;
  auditLogEntries: number;
  issues: string[];
  lastChecked: string;
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

export interface NicknameHealthReport {
  nickname?: string;
  accountId?: string;
  registryStatus: "ok" | "missing" | "mismatch";
  reverseRegistryStatus: "ok" | "missing" | "mismatch";
  profileStatus: "ok" | "missing" | "inactive" | "mismatch" | "not_found";
  issues: string[];
  recommendations: string[];
}

export interface FixResult {
  success: boolean;
  changes: string[];
  errors?: string[];
}

export interface BackupInfo {
  filename: string;
  size: string;
  date: string;
  totalNicknames: number;
  totalAccounts: number;
  backupVersion?: string;
}

export interface ReservationBackupInfo {
  filename: string;
  size: string;
  date: string;
  totalReservations: number;
}

export interface ReservationDetails {
  nickname: string;
  reservedBy: string;
  reservedAt: number;
  reason?: string;
  category: string;
}

export interface NicknameServiceInterface {
  addNickname(
    nickname: string,
    accountId: string,
    allowReserved?: boolean,
  ): Promise<{ success: boolean }>;
  updateNickname(
    nickname: string,
    newAccountId: string,
  ): Promise<{ success: boolean; oldAccountId?: string }>;
  removeNickname(nickname: string): Promise<{ success: boolean; removedAccountId?: string }>;
  validateNickname(nickname: string): void;
  validateAccountId(accountId: string): void;
}

// Enhanced return types for better user experience
export interface ReservationResult {
  success: boolean;
  nickname: string;
  previousState?: "available" | "taken" | "reserved";
  reservation?: ReservationDetails;
  warnings?: string[];
  metadata?: {
    operationId?: string;
    conflictResolution?: string;
  };
}

export interface ReservationListResult {
  reservations: ReservationDetails[];
  totalCount: number;
  filteredCount: number;
}

export interface ReservationStatusResult {
  isReserved: boolean;
  reservation?: ReservationDetails;
  state: "available" | "taken" | "reserved";
  warnings?: string[];
}

export interface ReservationServiceInterface {
  reserveNickname(
    nickname: string,
    category?: "admin" | "brand" | "system" | "offensive" | "custom",
    reason?: string,
  ): Promise<ReservationResult>;
  unreserveNickname(nickname: string): Promise<ReservationResult>;
  listReservedNicknames(
    category?: "admin" | "brand" | "system" | "offensive" | "custom",
  ): Promise<ReservationListResult>;
  checkReservationStatus(nickname: string): Promise<ReservationStatusResult>;
  isReserved(nickname: string): Promise<boolean>;
}

export interface BackupServiceInterface {
  downloadRegistries(): Promise<string>;
  restoreFromBackup(backupFile: string): Promise<{
    success: boolean;
    restored: { nicknames: number; accounts: number };
  }>;
  deleteAll(): Promise<{
    success: boolean;
    backupFile: string;
    deleted: { nicknames: number; accounts: number };
  }>;
  listBackups(): Promise<{ backups: BackupInfo[] }>;
  cleanOldBackups(daysToKeep?: number): Promise<{
    success: boolean;
    deletedFiles: string[];
    deletedCount: number;
  }>;
}

export interface ReservationBackupServiceInterface {
  backupReservations(): Promise<string>;
  restoreReservations(
    backupFile: string,
  ): Promise<{ success: boolean; restored: { reservations: number } }>;
  listReservationBackups(): Promise<{ backups: ReservationBackupInfo[] }>;
  cleanOldReservationBackups(daysToKeep?: number): Promise<{
    success: boolean;
    deletedFiles: string[];
    deletedCount: number;
  }>;
}

export interface HealthServiceInterface {
  healthCheck(): Promise<HealthReport>;
  checkNicknameHealth(nickname?: string, accountId?: string): Promise<NicknameHealthReport>;
  fixNickname(nickname?: string, accountId?: string): Promise<FixResult>;
}

export interface AuditServiceInterface {
  logChange(
    jazzAccountId: string,
    oldNickname?: string,
    newNickname?: string,
    source?: "admin-cli" | "user-app" | "worker",
    action?: "add" | "update" | "remove" | "reserve" | "unreserve",
    reservationReason?: string,
    reservationCategory?: "admin" | "brand" | "system" | "offensive" | "custom",
  ): Promise<void>;
  getChangeHistory(limit?: number): Promise<TRegistryAuditEntry[]>;
  getHistoryForAccount(accountId: string): Promise<TRegistryAuditEntry[]>;
  getHistoryForNickname(nickname: string): Promise<TRegistryAuditEntry[]>;
  getHistoryBySource(
    source: "admin-cli" | "user-app" | "worker",
    limit?: number,
  ): Promise<TRegistryAuditEntry[]>;
}
