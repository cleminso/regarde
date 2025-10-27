import { createRoute } from "@hono/zod-openapi";
import { ErrorResponseSchema } from "../schemas/common.js";
import { verifyRegardeAuth } from "../auth/verify.js";
import { z } from "zod";

const HARDCODED_API_KEY = "nick-sauve.app-ilfaitbeautoday";

const VerifyResponseSchema = z.object({
  isValid: z.boolean(),
  error: z.string().optional(),
});

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

export const verifyHandler = (worker: any) => {
  return async (c: any) => {
    try {
      const apiKey = c.req.header("X-API-Key");
      const regardeAuth = c.req.header("X-Regarde-Token");
      const regardeAuthId = c.req.header("X-Regarde-Token-Id");
      const jazzAccountId = c.req.header("X-Jazz-Account-Id");

      if (!apiKey) {
        console.log("Missing API key header");
        return c.json({ error: "Missing API key header" }, 401);
      }

      if (apiKey !== HARDCODED_API_KEY) {
        console.log("Invalid API key");
        return c.json({ error: "Invalid API key" }, 401);
      }

      if (!regardeAuth || !regardeAuthId || !jazzAccountId) {
        console.log("Missing required headers");
        return c.json(
          {
            error:
              "Missing required headers: X-Regarde-Token, X-Regarde-Token-Id, X-Jazz-Account-Id",
          },
          400,
        );
      }

      console.log(`Verifying registration key for account: ${jazzAccountId}`);

      const verificationResult = await verifyRegardeAuth(
        jazzAccountId,
        regardeAuth,
        regardeAuthId,
      );

      console.log(
        `Verification result for account ${jazzAccountId}: ${verificationResult.isValid}`,
      );

      return c.json(verificationResult, 200);
    } catch (error: any) {
      console.error(`Error processing /verify request: ${error}`);
      return c.json({ error: error.message || "Internal server error" }, 500);
    }
  };
};
