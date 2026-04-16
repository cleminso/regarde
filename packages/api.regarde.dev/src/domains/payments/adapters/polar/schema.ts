import { z } from "zod";

export const PolarWebhookSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.any()),
});

export type TPolarWebhook = z.infer<typeof PolarWebhookSchema>;
