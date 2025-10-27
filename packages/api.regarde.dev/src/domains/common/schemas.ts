import { z } from "zod";

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
    details: z.any().optional(),
  })
  .openapi("ErrorResponse");

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

