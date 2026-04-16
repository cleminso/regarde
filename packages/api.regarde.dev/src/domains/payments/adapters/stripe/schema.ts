import { z } from "zod";

export const StripeEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  livemode: z.boolean(),
  created: z.number(),
  data: z.object({
    object: z.record(z.string(), z.any()),
  }),
});

export type TStripeEvent = z.infer<typeof StripeEventSchema>;
