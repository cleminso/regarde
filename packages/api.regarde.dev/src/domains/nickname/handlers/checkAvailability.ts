import type { TNicknameRegistry, TReservedNicknamesRegistry } from "@regarde-dev/core";
import { useLogging } from "@regarde-dev/core";

const logger = useLogging({
  module: import.meta.filename,
});

export const checkAvailabilityHandler = (
  nicknameRegistry: TNicknameRegistry,
  reservedNicknames: TReservedNicknamesRegistry,
) => {
  return async (c: any) => {
    try {
      const { nickname } = c.req.valid("json");

      logger.debug({
        message: "Checking nickname availability",
        data: {
          nickname,
          nicknameRegistrySize: Object.keys(nicknameRegistry).length,
        },
      });

      if (!reservedNicknames) {
        logger.error({
          message: "Reserved nicknames registry not available",
          data: {
            nickname,
            reservedNicknamesIsNull: reservedNicknames === null,
          },
        });
        return c.json({ error: "Service temporarily unavailable" }, 503);
      }

      const existingAccountForNickname = nicknameRegistry[nickname];
      const reservation = reservedNicknames[nickname];
      const isReservationLoaded =
        reservation !== null && reservation !== undefined && reservation.$isLoaded === true;

      const isAvailable = !existingAccountForNickname && !reservation;

      const response: any = {
        nickname,
        available: isAvailable,
      };

      if (existingAccountForNickname) {
        response.takenBy = existingAccountForNickname;
      }

      if (isReservationLoaded === true) {
        response.reserved = true;
        response.reservationCategory = reservation.category;
        response.reservationReason = reservation.reason;
      }

      logger.info({
        message: "Nickname availability determined",
        data: {
          nickname,
          isAvailable,
          hasExistingAccount:
            existingAccountForNickname !== null && existingAccountForNickname !== undefined,
          hasReservation: reservation !== null && reservation !== undefined,
          isReservationLoaded,
        },
      });

      return c.json(response, 200);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logger.error({
        message: "Failed to process /checkAvailability request",
        data: { errorMessage },
      });

      return c.json({ error: errorMessage }, 500);
    }
  };
};
