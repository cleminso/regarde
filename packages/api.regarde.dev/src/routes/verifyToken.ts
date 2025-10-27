import { createRoute } from "@hono/zod-openapi";
import { ErrorResponseSchema } from "#/domains/common/schemas";
import { VerifyResponseSchema } from "#/domains/auth/schemas";
import { z } from "zod";

export const verifyRoute = createRoute({
  method: "post",
  path: "/verify",
  request: {
    headers: z.object({
      "x-regarde-token": z.string(),
      "x-regarde-token-id": z.string(),
      "x-jazz-account-id": z.string(),
      "x-api-key": z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: VerifyResponseSchema,
        },
      },
      description: "Verification result",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Unauthorized - missing or invalid API key",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Bad request - missing required headers",
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
  tags: ["Authentication"],
  summary: "Verify registration key",
  description: `
    Verifies a Jazz registration key for authentication.

    **Authentication:**
    - Header: X-API-Key (required) - API key for accessing this endpoint
    - Header: X-Regarde-Token (required) - Registration key from user's Jazz account
    - Header: X-Regarde-Token-Id (required) - CoMap ID of the registration key
    - Header: X-Jazz-Account-Id (required) - Jazz account ID of the user

    **Returns:**
    - isValid: boolean - Whether the registration key is valid
    - error: string (optional) - Error message if validation failed
  `,
});


