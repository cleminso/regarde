import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { LookupResponseSchema } from "#/domains/nickname/schemas";
import { ErrorResponseSchema } from "#/domains/common/schemas";

export const lookupRoute = createRoute({
  method: "get",
  path: "/lookup/{nickname}",
  request: {
    params: z.object({
      nickname: z
        .string()
        .min(1, "Nickname is required")
        .transform((val) => val.toLowerCase().trim()),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LookupResponseSchema,
        },
      },
      description: "Nickname resolved successfully to account ID",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Nickname not found in registry",
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
  summary: "Lookup account ID by nickname",
  description:
    "Public endpoint to resolve a nickname to its associated Jazz Account ID. No authentication required.",
});
