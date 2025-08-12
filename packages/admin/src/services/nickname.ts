import { Loaded } from "jazz-tools";
import { RegistryWorkerAccount } from "@onboarding.jazz/shared-schemas/registry";
import { NicknameServiceInterface } from "../types/services.js";
import { AuditService } from "./audit.js";
import { ReservationService } from "./reservation.js";
import { validateNickname, validateAccountId } from "../utils/validation.js";

export class NicknameService implements NicknameServiceInterface {
  constructor(
    private worker: Loaded<typeof RegistryWorkerAccount>,
    private nicknameRegistry: Loaded<
      typeof RegistryWorkerAccount
    >["root"]["registry"],
    private reverseNicknameRegistry: Loaded<
      typeof RegistryWorkerAccount
    >["root"]["reverseRegistry"],
    private reservedNicknames: Loaded<
      typeof RegistryWorkerAccount
    >["root"]["reservedNicknames"],
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
      const reservation = this.reservedNicknames[nickname] as any;
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
      const reservation = this.reservedNicknames[nickname] as any;
      const entryReason = reservation?.reason;
      const entryCategory = reservation?.category;

      delete this.reservedNicknames[nickname];

      await this.auditService.logChange(
        this.worker.id,
        undefined,
        undefined,
        "admin-cli",
        "unreserve",
        entryReason,
        entryCategory,
      );
    }

    this.nicknameRegistry[nickname] = accountId;
    this.reverseNicknameRegistry[accountId] = nickname;

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

    // Update registries
    this.nicknameRegistry[nickname] = accountId;
    delete this.reverseNicknameRegistry[oldAccountId];
    this.reverseNicknameRegistry[accountId] = nickname;

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

    delete this.nicknameRegistry[nickname];
    delete this.reverseNicknameRegistry[accountId];

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
