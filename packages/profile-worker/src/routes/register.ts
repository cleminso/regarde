import { createRoute } from "@hono/zod-openapi";
import { RegisterRequestSchema } from "../schemas/register";
import { ErrorResponseSchema } from "../schemas/common";

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
      description: "Conflict - nickname already taken or account already has a nickname without specifying oldNickname",
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
    Polymorphic endpoint for nickname management. Supports three operations based on the combination of nickname and oldNickname fields:

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

export const registerHandler = (nicknameRegistry: any, reverseNicknameRegistry: any) => {
  return async (c: any) => {
    try {
      const {
        nickname,
        jazzAccountID,
        oldNickname,
      } = c.req.valid("json");

      if (!nickname && !oldNickname) {
        return c.json({ error: "Must provide either a new nickname or an old one to delete/swap" }, 400);
      }

      console.log(
        `Received registration request: nickname="${nickname}", AccountID="${jazzAccountID}", oldNickname="${oldNickname}"`,
      );

      const currentNicknameForAccount = reverseNicknameRegistry[jazzAccountID];
      const existingAccountForNickname = nicknameRegistry[nickname];
      const existingAccountForOldNickname = nicknameRegistry[oldNickname];

      // --- Handle Delete ---
      if (!nickname && oldNickname) {
        if (currentNicknameForAccount !== oldNickname) {
          console.log(
            `Account "${jazzAccountID}" does not own nickname "${oldNickname}". Current: "${currentNicknameForAccount}"`,
          );
          return c.json({ error: "Account does not own the nickname to delete" }, 403);
        }

        delete nicknameRegistry[oldNickname];
        delete reverseNicknameRegistry[jazzAccountID];
        console.log(
          `Nickname "${oldNickname}" and reverse entry for AccountID "${jazzAccountID}" deleted.`,
        );
        return c.body(null, 204);
      }

      // --- Handle Swap or Register ---
      // Check if the new nickname is already taken by someone else
      if (existingAccountForNickname && existingAccountForNickname !== jazzAccountID) {
        console.log(
          `Nickname "${nickname}" is already taken by AccountID: ${existingAccountForNickname}.`,
        );
        return c.json({ error: "Nickname already taken" }, 409);
      }

      // If oldNickname is provided, it's a swap attempt
      if (oldNickname) {
        // Validate that the account owns the oldNickname they are trying to swap from
        if (existingAccountForOldNickname !== jazzAccountID) {
          console.log(
            `Account "${jazzAccountID}" does not own oldNickname "${oldNickname}" for swap. Current: "${currentNicknameForAccount}"`,
          );
          return c.json({ error: "Account does not own the nickname specified as oldNickname" }, 403);
        }

        // If the old nickname is the same as the new nickname, it's a no-op swap
        if (oldNickname === nickname) {
          console.log(
            `Swap request where oldNickname "${oldNickname}" is same as new nickname "${nickname}" for AccountID "${jazzAccountID}". No-op.`,
          );
          return c.body(null, 204);
        }

        // Perform the swap: remove old, add new
        delete nicknameRegistry[oldNickname];
        console.log(`Removed old nickname "${oldNickname}" from registry.`);
      } else {
        // If oldNickname is NOT provided, it's a new registration attempt
        // Check if the account already has *any* nickname
        if (currentNicknameForAccount) {
          console.log(
            `AccountID "${jazzAccountID}" already has a nickname "${currentNicknameForAccount}". Cannot register a new one without specifying oldNickname for swap.`,
          );
          return c.json({ error: `Account already has a nickname: "${currentNicknameForAccount}"` }, 409);
        }
      }

      // If we reached here, the new nickname is available and validation passed (or it's a valid swap)
      // Register the new nickname and update reverse registry
      nicknameRegistry[nickname] = jazzAccountID;
      reverseNicknameRegistry[jazzAccountID] = nickname;
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