import { z } from "zod";

const logMessageSchema = z.object({
  message: z.string().describe("What is happening now, what you want to know"),
  data: z
    .object({
      metadata: z
        .record(z.string(), z.any())
        .optional()
        .describe("The context metadata"),
    })
    .and(z.record(z.string(), z.any()))
    .describe("The data / context / metadata that is relevant to the message"),
});

export type TLog = z.input<typeof logMessageSchema>;

// Centralized logger
const logger = {
  info: (data: TLog) => console.info(data.message, data),
  debug: (data: TLog) => console.debug(data.message, data),
  warn: (data: TLog) => console.warn(data.message, data),
  error: (data: TLog) => console.error(data.message, data),
};

export const useLogging = (metadata: TLog["data"]["metadata"]) => {
  return {
    info: (data: TLog) => logger.info(Object.assign({}, data, { metadata })),
    debug: (data: TLog) => logger.debug(Object.assign({}, data, { metadata })),
    warn: (data: TLog) => logger.warn(Object.assign({}, data, { metadata })),
    error: (data: TLog) => logger.error(Object.assign({}, data, { metadata })),
  };
};
