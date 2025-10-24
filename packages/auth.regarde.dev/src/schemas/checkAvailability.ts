import { z } from "zod";

export const CheckAvailabilityRequestSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .transform((val) => val.toLowerCase().trim()),
});

export const CheckAvailabilityResponseSchema = z.object({
  nickname: z.string(),
  available: z.boolean(),
  takenBy: z.string().optional(),
  reserved: z.boolean().optional(),
  reservationCategory: z.string().optional(),
  reservationReason: z.string().optional(),
});

export type CheckAvailabilityRequest = z.infer<
  typeof CheckAvailabilityRequestSchema
>;
export type CheckAvailabilityResponse = z.infer<
  typeof CheckAvailabilityResponseSchema
>;

