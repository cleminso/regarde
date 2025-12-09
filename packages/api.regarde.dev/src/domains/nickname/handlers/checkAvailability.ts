import type {
  NicknameRegistry,
  ReservedNicknamesRegistry,
} from "@regarde-dev/sdk/registry";

export const checkAvailabilityHandler = (
  nicknameRegistry: NicknameRegistry,
  reservedNicknames: ReservedNicknamesRegistry,
) => {
  return async (c: any) => {
    try {
      const { nickname } = c.req.valid("json");

      console.log(`Checking availability for nickname: "${nickname}"`);

      if (!reservedNicknames) {
        console.error("Reserved nicknames registry not available");
        return c.json({ error: "Service temporarily unavailable" }, 503);
      }

      const existingAccountForNickname = nicknameRegistry[nickname];
      const reservation = reservedNicknames[nickname];

      console.log(
        `Reservation check for "${nickname}":`,
        reservation ? "RESERVED" : "NOT RESERVED",
      );

      const isAvailable = !existingAccountForNickname && !reservation;

      const response: any = {
        nickname,
        available: isAvailable,
      };

      if (existingAccountForNickname) {
        response.takenBy = existingAccountForNickname;
      }

      if (reservation.$isLoaded) {
        response.reserved = true;
        response.reservationCategory = reservation.category;
        response.reservationReason = reservation.reason;
      }

      return c.json(response, 200);
    } catch (error: any) {
      console.error(`Error processing /checkAvailability request: ${error}`);
      return c.json({ error: error.message || "Internal server error" }, 500);
    }
  };
};
