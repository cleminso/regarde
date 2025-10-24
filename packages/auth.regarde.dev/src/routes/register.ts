import { createRoute } from "@hono/zod-openapi";
import { verifyRegistrationKey } from "../auth/verify.js";
import { ErrorResponseSchema } from "../schemas/common.js";
import { RegisterRequestSchema } from "@regarde-dev/jazz-schemas/regarde.dev";

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
      description:
        "Registration/swap/deletion successful - no content returned",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Unauthorized - missing or invalid registration key",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description:
        "Bad request - invalid request body or missing required fields",
    },
    403: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description:
        "Forbidden - account does not own the nickname being swapped/deleted",
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
    Polymorphic endpoint for nickname management. Requires X-Registration-Key header for authentication.

    **Authentication:**
    - Header: X-Registration-Key (required) - Registration key from user's Jazz account
    - Header: X-Registration-Key-Id (required) - CoMap ID of the registration key

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

export const registerHandler = (
  nicknameRegistry: any,
  reverseNicknameRegistry: any,
  worker: any,
  reservedNicknames: any,
) => {
  return async (c: any) => {
    try {
      const { nickname, jazzAccountID, oldNickname } = c.req.valid("json");

      const registrationKey = c.req.header("X-Registration-Key");
      const registrationKeyId = c.req.header("X-Registration-Key-Id");

      if (!registrationKey) {
        console.log(
          `Missing registration key header for AccountID "${jazzAccountID}"`,
        );
        return c.json({ error: "Missing registration key header" }, 401);
      }

      if (!nickname && !oldNickname) {
        return c.json(
          {
            error:
              "Must provide either a new nickname or an old one to delete/swap",
          },
          400,
        );
      }

      console.log(
        `Received registration request: nickname="${nickname}", AccountID="${jazzAccountID}"`,
      );

      const verificationResult = await verifyRegistrationKey(
        jazzAccountID,
        registrationKey,
        registrationKeyId,
        worker,
      );
      if (!verificationResult.isValid) {
        console.log(
          `Authentication failed for AccountID "${jazzAccountID}": ${verificationResult.error}`,
        );
        return c.json(
          { error: `Authentication failed: ${verificationResult.error}` },
          403,
        );
      }

      console.log(`Authentication successful for AccountID "${jazzAccountID}"`);

      const currentNicknameForAccount = reverseNicknameRegistry[jazzAccountID];
      const existingAccountForNickname = nicknameRegistry[nickname];
      const existingAccountForOldNickname = nicknameRegistry[oldNickname];

      if (!nickname && oldNickname) {
        if (currentNicknameForAccount !== oldNickname) {
          console.log(
            `Account "${jazzAccountID}" does not own nickname "${oldNickname}". Current: "${currentNicknameForAccount}"`,
          );
          return c.json(
            { error: "Account does not own the nickname to delete" },
            403,
          );
        }

        delete nicknameRegistry[oldNickname];
        delete reverseNicknameRegistry[jazzAccountID];
        console.log(
          `Nickname "${oldNickname}" and reverse entry for AccountID "${jazzAccountID}" deleted.`,
        );

        return c.body(null, 204);
      }

      if (
        existingAccountForNickname &&
        existingAccountForNickname !== jazzAccountID
      ) {
        console.log(
          `Nickname "${nickname}" is already taken by AccountID: ${existingAccountForNickname}.`,
        );
        return c.json({ error: "Nickname already taken" }, 409);
      }

      const reservation = reservedNicknames[nickname];
      if (reservation) {
        console.log(
          `Nickname "${nickname}" is reserved (category: ${reservation.category}, reserved by: ${reservation.reservedBy}).`,
        );
        return c.json(
          {
            error: "Nickname is reserved",
            reservationCategory: reservation.category,
            reservationReason: reservation.reason,
          },
          403,
        );
      }

      if (oldNickname) {
        if (existingAccountForOldNickname !== jazzAccountID) {
          console.log(
            `Account "${jazzAccountID}" does not own oldNickname "${oldNickname}" for swap. Current: "${currentNicknameForAccount}"`,
          );
          return c.json(
            {
              error:
                "Account does not own the nickname specified as oldNickname",
            },
            403,
          );
        }

        if (oldNickname === nickname) {
          console.log(
            `Swap request where oldNickname "${oldNickname}" is same as new nickname "${nickname}" for AccountID "${jazzAccountID}". No-op.`,
          );

          return c.body(null, 204);
        }

        delete nicknameRegistry[oldNickname];
        console.log(`Removed old nickname "${oldNickname}" from registry.`);
      } else {
        if (currentNicknameForAccount) {
          console.log(
            `AccountID "${jazzAccountID}" already has a nickname "${currentNicknameForAccount}". Cannot register a new one without specifying oldNickname for swap.`,
          );
          return c.json(
            {
              error: `Account already has a nickname: "${currentNicknameForAccount}"`,
            },
            409,
          );
        }
      }

      nicknameRegistry.$jazz.set(nickname, jazzAccountID);
      reverseNicknameRegistry.$jazz.set(jazzAccountID, nickname);
      console.log(
        `Nickname "${nickname}" registered/swapped for AccountID: ${jazzAccountID}.`,
      );

      return c.body(null, 204);
    } catch (error: any) {
      console.error(`Error processing /register request: ${error}`);
      return c.json({ error: error.message || "Internal server error" }, 500);
    }
  };
};
