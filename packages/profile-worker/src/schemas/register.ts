import { z } from "zod";

export const RegisterRequestSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .transform((val) => val.toLowerCase().trim()),
  jazzAccountID: z.string().min(1, "Jazz Account ID is required"),
  oldNickname: z
    .string()
    .optional()
    .transform((val) => (val ? val.toLowerCase().trim() : val)),
});

export const RegisterResponseSchema = z.object({
  nickname: z.string(),
  jazzAccountID: z.string(),
  registered: z.boolean(),
  message: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
