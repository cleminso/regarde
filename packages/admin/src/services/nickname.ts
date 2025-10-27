import { Loaded } from "jazz-tools";
import {
  RegistryWorkerAccount,
  NicknameRegistry,
  ReverseNicknameRegistry,
  ReservedNicknamesRegistry,
} from "@regarde-dev/jazz-schemas";
import { NicknameServiceInterface } from "../types/services.js";
import { AuditService } from "./audit.js";
import { ReservationService } from "./reservation.js";
import { validateNickname, validateAccountId } from "../utils/validation.js";

export class NicknameService implements NicknameServiceInterface {
  constructor(
    private worker: Loaded<typeof RegistryWorkerAccount>,
    private nicknameRegistry: NicknameRegistry,
    private reverseNicknameRegistry: ReverseNicknameRegistry,
    private reservedNicknames: ReservedNicknamesRegistry,
    private auditService: AuditService,
    private reservationService: ReservationService,
  ) {}

  async addNickname(
    nickname: string,
    accountId: string,
    allowReserved: boolean = false,
  ): Promise<{ success: boolean }> {
    this.validateNickname(nickname);
    this.validateAccountId(accountId);

    if (this.nicknameRegistry[nickname]) {
      throw new Error(
        `Nickname "${nickname}" already exists for account ${this.nicknameRegistry[nickname]}`,
      );
    }

    if (this.reservedNicknames[nickname] && !allowReserved) {
      const reservation = this.reservedNicknames[nickname];
      const category = reservation?.category || "unknown";
      const reservedBy = reservation?.reservedBy || "unknown";
      throw new Error(
        `Nickname "${nickname}" is reserved (category: ${category}, reserved by: ${reservedBy}). Use --allow-reserved flag to override.`,
      );
    }

    if (this.reverseNicknameRegistry[accountId]) {
      throw new Error(
        `Account ${accountId} already has nickname "${this.reverseNicknameRegistry[accountId]}"`,
      );
    }

    if (this.reservedNicknames[nickname] && allowReserved) {
      const reservation = this.reservedNicknames[nickname];
      const entryReason = reservation?.reason;
      const entryCategory = reservation?.category;

      this.reservedNicknames.$jazz.delete(nickname);

      await this.auditService.logChange(
        this.worker.$jazz.id,
        undefined,
        undefined,
        "admin-cli",
        "unreserve",
        entryReason,
        entryCategory,
      );
    }

    this.nicknameRegistry.$jazz.set(nickname, accountId);
    this.reverseNicknameRegistry.$jazz.set(accountId, nickname);

    await this.auditService.logChange(accountId, undefined, nickname);

    return { success: true };
  }

  async updateNickname(
    nickname: string,
    accountId: string,
  ): Promise<{ success: boolean; oldAccountId?: string }> {
    this.validateNickname(nickname);
    this.validateAccountId(accountId);

    if (!this.nicknameRegistry[nickname]) {
      throw new Error(`Nickname "${nickname}" does not exist`);
    }

    const oldAccountId = this.nicknameRegistry[nickname];

    if (this.reverseNicknameRegistry[accountId]) {
      throw new Error(
        `Account ${accountId} already has nickname "${this.reverseNicknameRegistry[accountId]}"`,
      );
    }

    this.nicknameRegistry.$jazz.set(nickname, accountId);
    this.reverseNicknameRegistry.$jazz.delete(oldAccountId);
    this.reverseNicknameRegistry.$jazz.set(accountId, nickname);

    await this.auditService.logChange(accountId, nickname, nickname);

    return { success: true, oldAccountId };
  }

  async removeNickname(
    nickname: string,
  ): Promise<{ success: boolean; removedAccountId?: string }> {
    this.validateNickname(nickname);

    if (!this.nicknameRegistry[nickname]) {
      throw new Error(`Nickname "${nickname}" does not exist`);
    }

    const accountId = this.nicknameRegistry[nickname];

    this.nicknameRegistry.$jazz.delete(nickname);
    this.reverseNicknameRegistry.$jazz.delete(accountId);

    await this.auditService.logChange(accountId, nickname, undefined);

    return { success: true, removedAccountId: accountId };
  }

  validateNickname(nickname: string): void {
    validateNickname(nickname);
  }

  validateAccountId(accountId: string): void {
    validateAccountId(accountId);
  }
}
