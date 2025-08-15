import { Loaded } from "jazz-tools";
import { ulid } from "ulidx";
import {
  RegistryWorkerAccount,
  RegistryAuditEntry,
} from "@onboarding.jazz/shared-schemas";
import { AuditServiceInterface } from "../types/services.js";
import { Logger } from "../utils/logger.js";

export class AuditService implements AuditServiceInterface {
  constructor(
    private worker: Loaded<typeof RegistryWorkerAccount>,
    private auditLog: Loaded<typeof RegistryWorkerAccount>["root"]["auditLog"],
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
      Logger.debug(`Creating audit entry for account: ${jazzAccountId}`);

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

      const entry = RegistryAuditEntry.create({
        monotonicId: ulid(),
        timestamp: Date.now(),
        jazzAccountId,
        oldNickname: oldNickname || undefined,
        newNickname: newNickname || undefined,
        changedBy: this.worker.id,
        source,
        action: entryAction,
        reservationReason: reservationReason || undefined,
        reservationCategory: reservationCategory || undefined,
      });

      Logger.debug(`Created audit entry: ${entry.monotonicId}`);

      this.auditLog.push(entry);

      Logger.debug(`Audit log length after push: ${this.auditLog.length}`);

      await new Promise((resolve) => setTimeout(resolve, 100));

      Logger.debug(`Audit entry created successfully: ${entry.monotonicId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to create audit entry: ${errorMessage}`);
      Logger.debug(`Audit entry error details: ${JSON.stringify(error)}`);
    }
  }

  async getChangeHistory(limit: number = 20): Promise<RegistryAuditEntry[]> {
    try {
      Logger.debug(`Audit log length: ${this.auditLog.length}`);

      const entries: RegistryAuditEntry[] = [];

      for (const entry of this.auditLog) {
        if (entry && typeof entry === "object" && "monotonicId" in entry) {
          entries.push(entry as RegistryAuditEntry);
        }
      }

      const sortedEntries = entries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      Logger.debug(
        `Retrieved ${sortedEntries.length} audit entries (limit: ${limit})`,
      );
      return sortedEntries;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to retrieve audit history: ${errorMessage}`);
      return [];
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

      const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
      Logger.debug(
        `Found ${sortedEntries.length} audit entries for account: ${accountId}`,
      );
      return sortedEntries;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to retrieve account history: ${errorMessage}`);
      return [];
    }
  }

  async getHistoryForNickname(nickname: string): Promise<RegistryAuditEntry[]> {
    try {
      const entries: RegistryAuditEntry[] = [];

      for (const entry of this.auditLog) {
        if (
          entry &&
          typeof entry === "object" &&
          ("oldNickname" in entry || "newNickname" in entry)
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

      const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
      Logger.debug(
        `Found ${sortedEntries.length} audit entries for nickname: ${nickname}`,
      );
      return sortedEntries;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to retrieve nickname history: ${errorMessage}`);
      return [];
    }
  }

  async getHistoryBySource(
    source: "admin-cli" | "user-app" | "worker",
    limit: number = 50,
  ): Promise<RegistryAuditEntry[]> {
    try {
      const entries: RegistryAuditEntry[] = [];

      for (const entry of this.auditLog) {
        if (
          entry &&
          typeof entry === "object" &&
          "source" in entry &&
          entry.source === source
        ) {
          entries.push(entry as RegistryAuditEntry);
        }
      }

      const sortedEntries = entries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      Logger.debug(
        `Found ${sortedEntries.length} audit entries for source: ${source}`,
      );
      return sortedEntries;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to retrieve source history: ${errorMessage}`);
      return [];
    }
  }
}
