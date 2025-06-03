import { z } from "zod";

export const RegisterRequestSchema = z.object({
  nickname: z.string().min(1, "Nickname is required"),
  accountId: z.string().min(1, "Account ID is required"),
});

export const RegisterResponseSchema = z.object({
  nickname: z.string(),
  accountId: z.string(),
  registered: z.boolean(),
  message: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;