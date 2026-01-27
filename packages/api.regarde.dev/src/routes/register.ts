import { createRoute } from "@hono/zod-openapi";

import { ErrorResponseSchema } from "#/domains/common/schemas";
import { RegisterRequestSchema } from "#/domains/nickname/schemas";

export const registerRoute = createRoute({
  method: "post",
  path: "/register",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "Registration/swap/deletion successful - no content returned",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Unauthorized - missing or invalid registration token",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Bad request - invalid request body or missing required fields",
    },
    403: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Forbidden - account does not own the nickname being swapped/deleted",
    },
    409: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description:
        "Conflict - nickname already taken or account already has a nickname without specifying oldNickname",
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
  summary: "Register, update, or delete nickname",
  description: `
    Polymorphic endpoint for nickname management. Requires X-Regarde-Token header for authentication.

    **Authentication:**
    - Header: X-Regarde-Token (required) - Registration token from user's Jazz account
    - Header: X-Regarde-Token-Id (required) - CoMap ID of the registration token

    **Operations based on nickname and oldNickname fields:**

    **1. Register New Nickname:**
    - Provide: nickname (desired name), jazzAccountID
    - Leave empty: oldNickname
    - Requirement: Account must not have an existing nickname
    - Example: { "nickname": "john_doe", "jazzAccountID": "acc123", "oldNickname": "" }

    **2. Swap/Update Nickname:**
    - Provide: nickname (new name), jazzAccountID, oldNickname (current name)
    - Requirement: Account must own the oldNickname
    - Example: { "nickname": "jane_doe", "jazzAccountID": "acc123", "oldNickname": "john_doe" }

    **3. Delete Nickname:**
    - Provide: jazzAccountID, oldNickname (name to delete)
    - Leave empty: nickname
    - Requirement: Account must own the oldNickname
    - Example: { "nickname": "", "jazzAccountID": "acc123", "oldNickname": "john_doe" }

    **Validation Rules:**
    - Each nickname can only be owned by one account
    - Each account can only own one nickname at a time
    - To change nickname, must provide oldNickname for swap operation
    - Account must own the oldNickname to perform swap/delete operations
  `,
});
