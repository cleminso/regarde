import { z } from "zod";

export const VerifyResponseSchema = z.object({
  isValid: z.boolean(),
  error: z.string().optional(),
});

export type TVerifyResponse = z.infer<typeof VerifyResponseSchema>;
