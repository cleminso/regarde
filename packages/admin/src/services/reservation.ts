import { Loaded } from "jazz-tools";
import {
  RegistryWorkerAccount,
  ReservationEntry,
} from "@onboarding.jazz/shared-schemas/registry";
import {
  ReservationServiceInterface,
  ReservationDetails,
} from "../types/services.js";
import { AuditService } from "./audit.js";
import {
  validateNickname,
  validateReservationCategory,
  validateReservationReason,
} from "../utils/validation.js";
import { Logger } from "../utils/logger.js";

export class ReservationService implements ReservationServiceInterface {
  constructor(
    private worker: Loaded<typeof RegistryWorkerAccount>,
    private nicknameRegistry: Loaded<
      typeof RegistryWorkerAccount
    >["root"]["registry"],
    private reservedNicknames: Loaded<
      typeof RegistryWorkerAccount
    >["root"]["reservedNicknames"],
    private auditService: AuditService,
  ) {}

  async reserveNickname(
    nickname: string,
    category: "admin" | "brand" | "system" | "offensive" | "custom" = "custom",
    reason?: string,
  ): Promise<{ success: boolean }> {
    validateNickname(nickname);
    validateReservationCategory(category);
    validateReservationReason(reason);

    if (this.nicknameRegistry[nickname]) {
      throw new Error(
        `Cannot reserve nickname "${nickname}" - already taken by account ${this.nicknameRegistry[nickname]}`,
      );
    }

    if (this.reservedNicknames[nickname]) {
      const existing = this.reservedNicknames[nickname] as any;
      throw new Error(
        `Nickname "${nickname}" is already reserved (category: ${existing?.category}, reserved by: ${existing?.reservedBy})`,
      );
    }

    const reservationEntry = ReservationEntry.create({
      reservedBy: this.worker.id,
      reservedAt: Date.now(),
      reason: reason || undefined,
      category,
    });

    this.reservedNicknames[nickname] = reservationEntry;

    await this.auditService.logChange(
      this.worker.id,
      undefined,
      undefined,
      "admin-cli",
      "reserve",
      reason,
      category,
    );

    return { success: true };
  }

  async unreserveNickname(nickname: string): Promise<{ success: boolean }> {
    validateNickname(nickname);

    if (!this.reservedNicknames[nickname]) {
      throw new Error(`Nickname "${nickname}" is not reserved`);
    }

    const reservation = this.reservedNicknames[nickname];
    const reservationEntry = reservation as any;

    const entryReason = reservationEntry?.reason;
    const entryCategory = reservationEntry?.category;

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

    return { success: true };
  }

  async listReservedNicknames(
    category?: "admin" | "brand" | "system" | "offensive" | "custom",
  ): Promise<{
    reservations: ReservationDetails[];
  }> {
    const reservations: ReservationDetails[] = [];

    for (const [nickname, reservation] of Object.entries(
      this.reservedNicknames,
    )) {
      if (!reservation) continue;

      const reservationEntry = reservation as any;

      const entryCategory = reservationEntry?.category;
      const entryReservedBy = reservationEntry?.reservedBy;
      const entryReservedAt = reservationEntry?.reservedAt;
      const entryReason = reservationEntry?.reason;

      if (!entryCategory || !entryReservedBy || !entryReservedAt) {
        Logger.warning(
          `Skipping invalid reservation entry for nickname: ${nickname}`,
        );
        continue;
      }

      if (!category || entryCategory === category) {
        reservations.push({
          nickname,
          reservedBy: entryReservedBy,
          reservedAt: entryReservedAt,
          reason: entryReason,
          category: entryCategory,
        });
      }
    }

    reservations.sort((a, b) => b.reservedAt - a.reservedAt);

    return { reservations };
  }

  async checkReservationStatus(nickname: string): Promise<{
    isReserved: boolean;
    reservation?: ReservationDetails;
  }> {
    validateNickname(nickname);

    const reservation = this.reservedNicknames[nickname];
    if (!reservation) {
      return { isReserved: false };
    }

    const reservationEntry = reservation as any;

    const entryReservedBy = reservationEntry?.reservedBy;
    const entryReservedAt = reservationEntry?.reservedAt;
    const entryReason = reservationEntry?.reason;
    const entryCategory = reservationEntry?.category;

    if (!entryReservedBy || !entryReservedAt || !entryCategory) {
      Logger.warning(`Invalid reservation entry for nickname: ${nickname}`);
      return { isReserved: false };
    }

    return {
      isReserved: true,
      reservation: {
        nickname,
        reservedBy: entryReservedBy,
        reservedAt: entryReservedAt,
        reason: entryReason,
        category: entryCategory,
      },
    };
  }

  async isReserved(nickname: string): Promise<boolean> {
    const status = await this.checkReservationStatus(nickname);
    return status.isReserved;
  }
}
