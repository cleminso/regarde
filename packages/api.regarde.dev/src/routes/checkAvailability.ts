import { createRoute } from "@hono/zod-openapi";

import { ErrorResponseSchema } from "#/domains/common/schemas";
import {
  CheckAvailabilityRequestSchema,
  CheckAvailabilityResponseSchema,
} from "#/domains/nickname/schemas";

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
