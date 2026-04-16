import { z } from "zod";

type TJsonPrimitive = string | number | boolean | null;
export type TJsonValue = TJsonPrimitive | { [key: string]: TJsonValue } | TJsonValue[];

export const jsonValueSchema: z.ZodType<TJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const jsonObjectSchema: z.ZodType<Record<string, TJsonValue>> = z.record(
  z.string(),
  jsonValueSchema,
);

export type TJsonObject = z.infer<typeof jsonObjectSchema>;

export const parseJsonObject = (rawBody: string): TJsonObject | null => {
  let parsedPayloadUnknown: unknown;

  try {
    parsedPayloadUnknown = JSON.parse(rawBody);
  } catch {
    return null;
  }

  const parseResult = jsonObjectSchema.safeParse(parsedPayloadUnknown);

  if (parseResult.success !== true) {
    return null;
  }

  return parseResult.data;
};
