import { z } from "zod";

/**
 * Zod schema for registration request validation.
 *
 * Applies validation and formatting:
 * - Nickname: required, lowercase, trimmed
 * - Jazz Account ID: required string
 * - Old Nickname: optional, lowercase, trimmed (for updates)
 */
export const RegisterRequestSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .transform((val: string) => val.toLowerCase().trim()),
  jazzAccountID: z.string().min(1, "Jazz Account ID is required"),
  oldNickname: z
    .string()
    .optional()
    .transform((val: string | undefined) => (val !== undefined && val !== "" ? val.toLowerCase().trim() : val)),
});

/**
 * Zod schema for registration response from server.
 *
 * Standardizes format for nickname registration outcomes.
 */
export const RegisterResponseSchema = z.object({
  nickname: z.string(),
  jazzAccountID: z.string(),
  isRegistered: z.boolean(),
  message: z.string().optional(),
});

/** Validated registration request parameters */
export type TRegisterRequest = z.infer<typeof RegisterRequestSchema>;

/** Registration response from server */
export type TRegisterResponse = z.infer<typeof RegisterResponseSchema>;
