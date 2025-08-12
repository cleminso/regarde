import { createRoute } from "@hono/zod-openapi";
import {
  CheckAvailabilityRequestSchema,
  CheckAvailabilityResponseSchema,
} from "../schemas/checkAvailability.js";
import { ErrorResponseSchema } from "../schemas/common.js";

export const checkAvailabilityRoute = createRoute({
  method: "post",
  path: "/checkAvailability",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CheckAvailabilityRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CheckAvailabilityResponseSchema,
        },
      },
      description: "Nickname availability check result",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Bad request - invalid nickname provided",
    },
    429: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Too many requests - rate limit exceeded",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Internal server error",
    },
  },
  tags: ["Nickname Registry"],
  summary: "Check nickname availability",
  description:
    "Check if a nickname is available for registration without making any changes to the registry",
});

export const checkAvailabilityHandler = (nicknameRegistry: any, reservedNicknames: any) => {
  return async (c: any) => {
    try {
      const { nickname } = c.req.valid("json");

      console.log(`Checking availability for nickname: "${nickname}"`);

      const existingAccountForNickname = nicknameRegistry[nickname];
      const reservation = reservedNicknames[nickname];

      // Nickname is unavailable if it's either taken or reserved
      const isAvailable = !existingAccountForNickname && !reservation;

      const response: any = {
        nickname,
        available: isAvailable,
      };

      // Add taken information if nickname is registered
      if (existingAccountForNickname) {
        response.takenBy = existingAccountForNickname;
      }

      // Add reservation information if nickname is reserved
      if (reservation) {
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
