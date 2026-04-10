import { createRoute, z } from "@hono/zod-openapi";

export const unifiedWebhookRoute = createRoute({
  method: "post",
  path: "/v1/webhooks/{provider}/{appId}/{webhookId}",
  summary: "Unified Payment Webhook Endpoint",
  description:
    "Receives and processes webhook events from payment providers (Stripe, Polar). Validates signature using webhook-specific secret, stores raw payload in CoFeed, and creates normalized events.",
  request: {
    params: z.object({
      provider: z.enum(["stripe", "polar"]),
      appId: z.string(),
      webhookId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.unknown(),
        },
      },
      description: "Payment Provider Webhook Payload",
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            received: z.boolean(),
            duplicate: z.boolean().optional(),
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
      description: "Invalid payload, unsupported provider, or missing context",
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
