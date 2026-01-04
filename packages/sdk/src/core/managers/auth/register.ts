/**
 * # Registration Schemas - User Registration Data Flow
 *
 * ## Purpose
 * - Defines request/response data structure for nickname registration
 * - Validates incoming registration data with specific rules
 * - Standardizes communication between client and registry server
 *
 * ## Request Flow
 * 1. Client creates registration request with nickname/jazzAccountId
 * 2. Schema validates and formats the nickname (lowercase, trimmed)
 * 3. Server processes validated request and updates registry
 * 4. Server returns standardized response with registration outcome
 *
 * ## Validation Rules
 * - Nickname: Required, transformed to lowercase and trimmed whitespace
 * - Jazz Account ID: Required, string format validation
 * - Previous Nickname: Optional, for nickname change operations
 */
import { z } from "zod";

/**
 * Validates registration request data before server processing
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
    .transform((val: string | undefined) =>
      val ? val.toLowerCase().trim() : val,
    ),
});

/**
 * Standardizes registration response format for client consumption
 */
export const RegisterResponseSchema = z.object({
  nickname: z.string(),
  jazzAccountID: z.string(),
  isRegistered: z.boolean(),
  message: z.string().optional(),
});

/**
 * TypeScript type for validated registration request parameters
 */
export type TRegisterRequest = z.infer<typeof RegisterRequestSchema>;

/**
 * TypeScript type for registration response from server
 */
export type TRegisterResponse = z.infer<typeof RegisterResponseSchema>;
