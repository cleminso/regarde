import { Loaded } from "jazz-tools";
import {
  RegistryWorkerAccount,
  ReservationEntry,
  NicknameRegistryCoRecord,
  ReservedNicknamesRegistry,
} from "@regarde-dev/jazz-schemas";
import {
  ReservationServiceInterface,
  ReservationDetails,
  ReservationResult,
  ReservationListResult,
  ReservationStatusResult,
} from "../types/services.js";
import { AuditService } from "./audit.js";
import {
  validateNickname,
  validateReservationCategory,
  validateReservationReason,
} from "../utils/validation.js";
import { Logger } from "../utils/logger.js";

export class ReservationError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>,
  ) {
    super(message);
    this.name = "ReservationError";
  }
}

export const RESERVATION_ERROR_CODES = {
  ALREADY_TAKEN: "ALREADY_TAKEN",
  ALREADY_RESERVED: "ALREADY_RESERVED",
  NOT_RESERVED: "NOT_RESERVED",
  INVALID_ENTRY: "INVALID_ENTRY",
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const;

type ReservationCategory =
  | "admin"
  | "brand"
  | "system"
  | "offensive"
  | "custom";

export class ReservationService implements ReservationServiceInterface {
  constructor(
    private worker: Loaded<typeof RegistryWorkerAccount>,
    private nicknameRegistry: Loaded<typeof NicknameRegistryCoRecord>,
    private reservedNicknames: Loaded<typeof ReservedNicknamesRegistry>,
    private auditService: AuditService,
  ) {}

  private isValidReservationEntry(entry: any): boolean {
    return (
      entry &&
      typeof entry.reservedBy === "string" &&
      typeof entry.reservedAt === "number" &&
      typeof entry.category === "string" &&
      ["admin", "brand", "system", "offensive", "custom"].includes(
        entry.category,
      )
    );
  }

  private extractReservationDetails(
    reservation: any,
    nickname: string,
  ): ReservationDetails | null {
    if (!this.isValidReservationEntry(reservation)) {
      Logger.warning(`Invalid reservation entry for nickname: ${nickname}`);
      return null;
    }

    return {
      nickname,
      reservedBy: reservation.reservedBy,
      reservedAt: reservation.reservedAt,
      reason: reservation.reason,
      category: reservation.category,
    };
  }

  private getNicknameState(
    nickname: string,
  ): "available" | "taken" | "reserved" {
    if (this.nicknameRegistry[nickname]) {
      return "taken";
    }
    if (this.reservedNicknames[nickname]) {
      return "reserved";
    }
    return "available";
  }

  private generateOperationId(operation: string): string {
    return `${operation}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  async reserveNickname(
    nickname: string,
    category: ReservationCategory = "custom",
    reason?: string,
  ): Promise<ReservationResult> {
    const operationId = this.generateOperationId("reserve");
    const previousState = this.getNicknameState(nickname);

    try {
      validateNickname(nickname);
      validateReservationCategory(category);
      validateReservationReason(reason);

      if (this.nicknameRegistry[nickname]) {
        throw new ReservationError(
          `Cannot reserve nickname "${nickname}" - already taken by account ${this.nicknameRegistry[nickname]}`,
          RESERVATION_ERROR_CODES.ALREADY_TAKEN,
          { nickname, accountId: this.nicknameRegistry[nickname], operationId },
        );
      }

      if (this.reservedNicknames[nickname]) {
        const existing = this.reservedNicknames[nickname];
        const existingDetails = this.extractReservationDetails(
          existing,
          nickname,
        );

        if (existingDetails) {
          throw new ReservationError(
            `Nickname "${nickname}" is already reserved (category: ${existingDetails.category}, reserved by: ${existingDetails.reservedBy})`,
            RESERVATION_ERROR_CODES.ALREADY_RESERVED,
            { nickname, existing: existingDetails, operationId },
          );
        } else {
          Logger.warning(
            `Found invalid reservation entry for ${nickname}, proceeding with new reservation`,
          );
        }
      }

      const reservationEntry = ReservationEntry.create({
        reservedBy: this.worker.$jazz.id,
        reservedAt: Date.now(),
        reason: reason || undefined,
        category,
      });

      this.reservedNicknames.$jazz.set(nickname, reservationEntry);

      const reservation: ReservationDetails = {
        nickname,
        reservedBy: this.worker.$jazz.id,
        reservedAt: Date.now(),
        reason,
        category,
      };

      await this.auditService.logChange(
        this.worker.$jazz.id,
        undefined,
        undefined,
        "admin-cli",
        "reserve",
        reason,
        category,
      );

      Logger.info(`Successfully reserved nickname "${nickname}"`);

      return {
        success: true,
        nickname,
        previousState,
        reservation,
        metadata: { operationId },
      };
    } catch (error) {
      Logger.error(
        `Failed to reserve nickname "${nickname}": ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof ReservationError) {
        throw error;
      }

      throw new ReservationError(
        `Failed to reserve nickname "${nickname}": ${error instanceof Error ? error.message : String(error)}`,
        RESERVATION_ERROR_CODES.VALIDATION_FAILED,
        { nickname, category, operationId, originalError: error },
      );
    }
  }

  async unreserveNickname(nickname: string): Promise<ReservationResult> {
    const operationId = this.generateOperationId("unreserve");
    const previousState = this.getNicknameState(nickname);

    try {
      validateNickname(nickname);

      if (!this.reservedNicknames[nickname]) {
        throw new ReservationError(
          `Nickname "${nickname}" is not reserved`,
          RESERVATION_ERROR_CODES.NOT_RESERVED,
          { nickname, operationId },
        );
      }

      const reservation = this.reservedNicknames[nickname];
      const reservationDetails = this.extractReservationDetails(
        reservation,
        nickname,
      );

      if (!reservationDetails) {
        throw new ReservationError(
          `Invalid reservation entry for nickname "${nickname}"`,
          RESERVATION_ERROR_CODES.INVALID_ENTRY,
          { nickname, operationId },
        );
      }

      delete this.reservedNicknames[nickname];

      await this.auditService.logChange(
        this.worker.$jazz.id,
        undefined,
        undefined,
        "admin-cli",
        "unreserve",
        reservationDetails.reason,
        reservationDetails.category as
          | "admin"
          | "brand"
          | "system"
          | "offensive"
          | "custom",
      );

      Logger.info(`Successfully unreserved nickname "${nickname}"`);

      return {
        success: true,
        nickname,
        previousState,
        reservation: reservationDetails,
        metadata: { operationId },
      };
    } catch (error) {
      Logger.error(
        `Failed to unreserve nickname "${nickname}": ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof ReservationError) {
        throw error;
      }

      throw new ReservationError(
        `Failed to unreserve nickname "${nickname}": ${error instanceof Error ? error.message : String(error)}`,
        RESERVATION_ERROR_CODES.VALIDATION_FAILED,
        { nickname, operationId, originalError: error },
      );
    }
  }

  async listReservedNicknames(
    category?: ReservationCategory,
  ): Promise<ReservationListResult> {
    const reservations: ReservationDetails[] = [];
    let totalCount = 0;

    for (const [nickname, reservation] of Object.entries(
      this.reservedNicknames,
    )) {
      if (!reservation) continue;

      totalCount++;
      const reservationDetails = this.extractReservationDetails(
        reservation,
        nickname,
      );

      if (!reservationDetails) {
        continue;
      }

      if (!category || reservationDetails.category === category) {
        reservations.push(reservationDetails);
      }
    }

    reservations.sort((a, b) => b.reservedAt - a.reservedAt);

    return {
      reservations,
      totalCount,
      filteredCount: reservations.length,
    };
  }

  async checkReservationStatus(
    nickname: string,
  ): Promise<ReservationStatusResult> {
    try {
      validateNickname(nickname);
    } catch (error) {
      throw new ReservationError(
        `Invalid nickname format: ${error instanceof Error ? error.message : String(error)}`,
        RESERVATION_ERROR_CODES.VALIDATION_FAILED,
        { nickname },
      );
    }

    const state = this.getNicknameState(nickname);
    const reservation = this.reservedNicknames[nickname];

    if (!reservation) {
      return {
        isReserved: false,
        state,
      };
    }

    const reservationDetails = this.extractReservationDetails(
      reservation,
      nickname,
    );

    if (!reservationDetails) {
      return {
        isReserved: false,
        state,
        warnings: [`Invalid reservation entry found for nickname: ${nickname}`],
      };
    }

    return {
      isReserved: true,
      reservation: reservationDetails,
      state,
    };
  }

  async isReserved(nickname: string): Promise<boolean> {
    try {
      const status = await this.checkReservationStatus(nickname);
      return status.isReserved;
    } catch (error) {
      Logger.warning(
        `Failed to check reservation status for "${nickname}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
