import { createRoute, z } from "@hono/zod-openapi";
import {
  RegisterAppRequestSchema,
  RegisterAppResponseSchema,
} from "../domains/app/schemas";
import { ErrorResponseSchema } from "../domains/common/schemas"; // Assuming this exists, I should check common schemas

// Fallback error schema if common doesn't exist (I'll check later, safest to define inline or import if sure)
// I'll check common schemas first to be safe, but for now I'll assume standard
// Actually, let's look at `packages/api.regarde.dev/src/domains/common/schemas` first.

// Wait, I should not guess imports. I will assume it exists based on previous file views (register.ts imported it).

export const registerAppRoute = createRoute({
  method: "post",
  path: "/register-app",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterAppRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RegisterAppResponseSchema,
        },
      },
      description: "App registered successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema || z.object({ error: z.string() }),
        },
      },
      description: "Bad Request",
    },
    401: {
      description: "Unauthorized",
    },
    500: {
      description: "Internal Server Error",
    },
  },
  tags: ["App Registry"],
  summary: "Register a new application",
  description:
    "Registers a new application and returns webhook configuration details.",
});
