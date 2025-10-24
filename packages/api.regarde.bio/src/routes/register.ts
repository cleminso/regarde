import { ErrorResponseSchema } from "@/schemas/common";
import { createRoute } from "@hono/zod-openapi";
import {
  OnboardingAccount,
  JazzAppProfile,
  deactivate,
  setNicknameFromRegistry,
} from "@regarde-dev/jazz-schemas";
import { RegisterRequestSchema } from "@regarde-dev/jazz-schemas/regarde.dev";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "https://auth.regarde.dev";

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

async function syncUserHandle(
  jazzAccountID: string,
  nickname: string | null,
  operation: "register" | "update" | "delete",
): Promise<void> {
  try {
    console.log(
      `Syncing userHandle nickname for AccountID "${jazzAccountID}", operation: ${operation}`,
    );

    const account = await OnboardingAccount.load(jazzAccountID, {
      resolve: {
        profile: {
          "regarde.bio": true,
        },
      },
    });

    if (!account) {
      console.warn(
        `Could not load account ${jazzAccountID} for userHandle nickname sync`,
      );
      return;
    }

    if (!account.profile) {
      console.warn(`No profile found for account ${jazzAccountID}`);
      return;
    }

    const data = await JazzAppProfile.load(account.profile["regarde.bio"], {
      resolve: {
        userHandle: true,
      },
    });

    await data?.$jazz.ensureLoaded({
      resolve: {
        userHandle: true,
      },
    });

    const userHandle = data?.userHandle;
    console.log("Resolved: ", userHandle);

    if (!userHandle) {
      console.warn(`No userHandle nickname found for account ${jazzAccountID}`);
      return;
    }

    if (operation === "delete") {
      deactivate(userHandle);
      console.log(
        `UserHandle nickname deactivated for AccountID "${jazzAccountID}"`,
      );
    } else if (nickname) {
      setNicknameFromRegistry(userHandle, nickname);
      console.log(
        `UserHandle nickname synced with registry for AccountID "${jazzAccountID}": "${nickname}"`,
        account.profile["regarde.bio"],
        data.$jazz.id,
        userHandle.$jazz.id,
      );
    }
  } catch (error) {
    console.error(
      `Failed to sync userHandle nickname for AccountID "${jazzAccountID}":`,
      error,
    );
  }
}

export const registerHandler = () => {
  return async (c: any) => {
    try {
      const { nickname, jazzAccountID, oldNickname } = c.req.valid("json");

      const registrationKey = c.req.header("X-Registration-Key");
      const registrationKeyId = c.req.header("X-Registration-Key-Id");

      if (!registrationKey || !registrationKeyId) {
        console.log(
          `Missing registration key headers for AccountID "${jazzAccountID}"`,
        );
        return c.json({ error: "Missing registration key headers" }, 401);
      }

      console.log(
        `[api.regarde.bio] Proxying registration request to auth.regarde.dev: nickname="${nickname}", AccountID="${jazzAccountID}"`,
      );

      const authResponse = await fetch(`${AUTH_SERVICE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Registration-Key": registrationKey,
          "X-Registration-Key-Id": registrationKeyId,
        },
        body: JSON.stringify({
          nickname,
          jazzAccountID,
          oldNickname,
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}));
        console.log(
          `[api.regarde.bio] auth.regarde.dev returned error: ${authResponse.status}`,
        );
        return c.json(
          {
            error:
              errorData.error ||
              `Registration failed: ${authResponse.status} ${authResponse.statusText}`,
          },
          authResponse.status,
        );
      }

      console.log(
        `[api.regarde.bio] Registration successful at auth.regarde.dev, now syncing userHandle`,
      );

      const operation =
        !nickname && oldNickname
          ? "delete"
          : oldNickname
            ? "update"
            : "register";

      await syncUserHandle(jazzAccountID, nickname || null, operation);

      console.log(
        `[api.regarde.bio] UserHandle synced for AccountID "${jazzAccountID}"`,
      );

      return c.body(null, 204);
    } catch (error: any) {
      console.error(
        `[api.regarde.bio] Error processing /register request: ${error}`,
      );
      return c.json({ error: error.message || "Internal server error" }, 500);
    }
  };
};
