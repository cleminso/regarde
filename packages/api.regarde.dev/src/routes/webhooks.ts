import { createRoute, z } from "@hono/zod-openapi";

export const webhookLemonSqueezyRoute = createRoute({
  method: "post",
  path: "/webhooks/lemonsqueezy/{appId}",
  summary: "Lemon Squeezy Webhook Endpoint",
  description:
    "Receives and processes webhook events from Lemon Squeezy (e.g., order_created). Verifies signature and provisions access.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.unknown(), // we parse it manually/strictly inside because we need raw body for signature
        },
      },
      description: "Lemon Squeezy Webhook Payload",
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            received: z.boolean(),
          }),
        },
      },
      description: "Webhook received successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Invalid payload or signature",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Unauthorized (Signature Mismatch)",
    },
  },
  tags: ["Webhooks"],
});
