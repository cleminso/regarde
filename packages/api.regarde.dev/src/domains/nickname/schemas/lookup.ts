import { z } from "zod";

export const LookupRequestSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .transform((val) => val.toLowerCase().trim()),
});

export const LookupResponseSchema = z.object({
  nickname: z.string(),
  accountId: z.string(),
});

export type LookupRequest = z.infer<typeof LookupRequestSchema>;
export type LookupResponse = z.infer<typeof LookupResponseSchema>;

