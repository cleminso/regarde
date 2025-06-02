import { z } from "zod";

export const ErrorResponseSchema = z.object({
  error: z.string().describe("Error message")
});

export const SuccessResponseSchema = z.object({
  message: z.string().describe("Success message")
});