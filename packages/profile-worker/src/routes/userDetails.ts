import { createRoute } from "@hono/zod-openapi";
import {
  UserDetailsRequestSchema,
  UserDetailsResponseSchema,
} from "../schemas/userDetails";
import { ErrorResponseSchema } from "../schemas/common";
import { OnboardingAccount } from "../schemas/profile";

export const userDetailsRoute = createRoute({
  method: "get",
  path: "/users/{jazzAccountId}",
  request: {
    params: UserDetailsRequestSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserDetailsResponseSchema,
        },
      },
      description: "User details retrieved successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "User not found",
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
  tags: ["User Management"],
  summary: "Get user public details",
  description:
    "Retrieve public information about a user by their Jazz Account ID, including their nickname and public profile data",
});

export const userDetailsHandler = (reverseNicknameRegistry: any) => {
  return async (c: any) => {
    try {
      const { jazzAccountId } = c.req.valid("param");

      console.log(
        `Looking up user details for Jazz Account ID: "${jazzAccountId}"`,
      );

      // Get nickname from reverse registry
      const nickname = reverseNicknameRegistry[jazzAccountId];

      try {
        const account = await OnboardingAccount.load(jazzAccountId, {
          resolve: {
            profile: {
              projects: {
                $each: true,
              },
              socialLinks: {
                $each: true,
              },
              workExp: {
                $each: true,
              },
            },
          },
        });

        if (!account) {
          return c.json(
            {
              jazzAccountId,
              nickname: nickname || undefined,
              exists: false,
            },
            200,
          );
        }

        const publicData: Record<string, any> = {
          ...account.profile,
        };

        return c.json(
          {
            jazzAccountId,
            nickname: nickname || undefined,
            publicData,
            exists: true,
          },
          200,
        );
      } catch (accountError) {
        console.log(
          `Account ${jazzAccountId} could not be loaded: ${accountError}`,
        );

        // Return what we know even if account loading failed
        return c.json(
          {
            jazzAccountId,
            nickname: nickname || undefined,
            exists: !!nickname, // If they have a nickname, they probably exist
          },
          200,
        );
      }
    } catch (error: any) {
      console.error(
        `Error processing /users/${c.req.param("jazzAccountId")} request: ${error}`,
      );
      return c.json({ error: error.message || "Internal server error" }, 500);
    }
  };
};
