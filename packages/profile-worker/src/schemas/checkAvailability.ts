import { z } from "zod";

export const CheckAvailabilityRequestSchema = z.object({
  nickname: z.string().min(1).describe("Nickname to check availability for")
});

export const CheckAvailabilityResponseSchema = z.object({
  nickname: z.string().describe("The nickname that was checked"),
  available: z.boolean().describe("Whether the nickname is available for registration"),
  takenBy: z.string().optional().describe("Jazz account ID that owns this nickname (only present if not available)")
});