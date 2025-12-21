import { z } from "zod";

export const RegisterAppRequestSchema = z.object({
  appId: z.string().min(1), // The ID of the app created by the client
});

export const RegisterAppResponseSchema = z.object({
  appId: z.string(),
  webhookUrl: z.url(),
  webhookSecret: z.string(),
});
