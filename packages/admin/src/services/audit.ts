import { Loaded } from "jazz-tools";
import { ulid } from "ulidx";

import {
  RegistryAuditEntryCoMap,
  RegistryWorkerAccount,
  type TRegistryAuditEntry,
  type TRegistryAuditLog,
} from "@regarde-dev/core";

import { AuditServiceInterface } from "../types/services.js";
import { Logger } from "../utils/logger.js";

function isLoadedAuditEntry(entry: unknown): entry is TRegistryAuditEntry {
  if (typeof entry !== "object" || entry === null) return false;
  const maybeEntry = entry as Partial<TRegistryAuditEntry> & {
    $isLoaded?: boolean;
  };

  return maybeEntry.$isLoaded === true && typeof maybeEntry.timestamp === "number";
}

function sortByTimestampDesc(entries: readonly TRegistryAuditEntry[]): TRegistryAuditEntry[] {
  return [...entries].sort((a, b) => b.timestamp - a.timestamp);
}

export class AuditService implements AuditServiceInterface {
  constructor(
    private worker: Loaded<typeof RegistryWorkerAccount>,
    private auditLog: TRegistryAuditLog,
  ) {}

  async logChange(
    jazzAccountId: string,
    oldNickname?: string,
    newNickname?: string,
    source: "admin-cli" | "user-app" | "worker" = "admin-cli",
    action?: "add" | "update" | "remove" | "reserve" | "unreserve",
    reservationReason?: string,
    reservationCategory?: "admin" | "brand" | "system" | "offensive" | "custom",
  ): Promise<void> {
    try {
      Logger.debug(
        `Creating audit entry: ${jazzAccountId}, ${oldNickname} -> ${newNickname}, action: ${action || "auto"}`,
      );

      let entryAction = action;
      if (!entryAction) {
        if (oldNickname && newNickname) {
          entryAction = "update";
        } else if (newNickname) {
          entryAction = "add";
        } else if (oldNickname) {
          entryAction = "remove";
        } else {
          entryAction = "add";
        }
      }

      const entry = RegistryAuditEntryCoMap.create({
        monotonicId: ulid(),
        timestamp: Date.now(),
        jazzAccountId,
        oldNickname: oldNickname || undefined,
        newNickname: newNickname || undefined,
        changedBy: this.worker.$jazz.id,
        source,
        action: entryAction,
        reservationReason: reservationReason || undefined,
        reservationCategory: reservationCategory || undefined,
      });

      await entry.$jazz.waitForSync();

      this.auditLog.$jazz.push(entry);

      await this.auditLog.$jazz.waitForSync();
      Logger.debug(`Audit entry created successfully, total entries: ${this.auditLog.length}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to log audit entry: ${errorMessage}`);
    }
  }

  async getChangeHistory(limit: number = 20): Promise<TRegistryAuditEntry[]> {
    try {
      Logger.debug(
        `Retrieving audit history, limit: ${limit}, total entries: ${this.auditLog.length}`,
      );

      const entries = [...this.auditLog].filter(isLoadedAuditEntry);

      const sortedEntries = sortByTimestampDesc(entries).slice(0, limit);

      Logger.debug(`Retrieved ${sortedEntries.length} audit entries`);
      return sortedEntries;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to retrieve audit history: ${errorMessage}`);
      return [];
    }
  }

  async getHistoryForAccount(accountId: string): Promise<TRegistryAuditEntry[]> {
    try {
      Logger.debug(`Searching audit history for account: ${accountId}`);

      const entries = [...this.auditLog]
        .filter(isLoadedAuditEntry)
        .filter((entry) => entry.jazzAccountId === accountId);

      const sortedEntries = sortByTimestampDesc(entries);
      Logger.debug(`Found ${sortedEntries.length} audit entries for account: ${accountId}`);
      return sortedEntries;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to retrieve account history: ${errorMessage}`);
      return [];
    }
  }

  async getHistoryForNickname(nickname: string): Promise<TRegistryAuditEntry[]> {
    try {
      const entries = [...this.auditLog]
        .filter(isLoadedAuditEntry)
        .filter((entry) => entry.oldNickname === nickname || entry.newNickname === nickname);

      const sortedEntries = sortByTimestampDesc(entries);
      Logger.debug(`Found ${sortedEntries.length} audit entries for nickname: ${nickname}`);
      return sortedEntries;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to retrieve nickname history: ${errorMessage}`);
      return [];
    }
  }

  async getHistoryBySource(
    source: "admin-cli" | "user-app" | "worker",
    limit: number = 50,
  ): Promise<TRegistryAuditEntry[]> {
    try {
      const entries = [...this.auditLog]
        .filter(isLoadedAuditEntry)
        .filter((entry) => entry.source === source);

      const sortedEntries = sortByTimestampDesc(entries).slice(0, limit);

      Logger.debug(`Found ${sortedEntries.length} audit entries for source: ${source}`);
      return sortedEntries;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to retrieve source history: ${errorMessage}`);
      return [];
    }
  }

  async clearCorruptedEntries(): Promise<void> {
    Logger.debug("Clearing corrupted audit log entries...");

    while (this.auditLog.length > 0) {
      this.auditLog.$jazz.pop();
    }

    Logger.debug("Audit log cleared");
  }
}
