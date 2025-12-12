import { z } from "zod";

export const RegisterAppRequestSchema = z.object({
  name: z.string().min(1).max(100),
  paymentProvider: z.enum(["lemonsqueezy", "stripe"]),
  ownerAccountId: z.string(), // We will validate this against Jazz later or assume trust if token is valid?
  // We might want to validate that ownerAccountId matches the authenticated user if we had user auth
});

export const RegisterAppResponseSchema = z.object({
  appId: z.string(),
  webhookUrl: z.url(),
  webhookSecret: z.string(),
});
