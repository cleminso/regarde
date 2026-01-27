import type { Loaded } from "jazz-tools";

import { RegistryWorkerAccount, useLogging } from "@regarde-dev/core";

import { verifyRegardeAuth } from "./verify";

const logger = useLogging({
  module: __filename,
});
const HARDCODED_API_KEY = "nick-sauve.app-ilfaitbeautoday";

export const verifyHandler = (worker: Loaded<typeof RegistryWorkerAccount>) => {
  return async (c: any) => {
    try {
      const apiKey = c.req.header("X-API-Key");
      const regardeAuth = c.req.header("X-Regarde-Token");
      const regardeAuthId = c.req.header("X-Regarde-Token-Id");
      const jazzAccountId = c.req.header("X-Jazz-Account-Id");

      const apiKeyPresent = apiKey !== null && apiKey !== undefined;
      if (!apiKeyPresent) {
        logger.error({
          message: "API key header is missing",
          data: {
            apiKeyNull: apiKey === null,
            apiKeyUndefined: apiKey === undefined,
          },
        });
        return c.json({ error: "Missing API key header" }, 401);
      }

      // TODO: to fix when working on `appId` with initRegardeSDK
      if (apiKey !== HARDCODED_API_KEY) {
        return c.json({ error: "Invalid API key" }, 401);
      }

      const isRequiredHeadersPresent =
        regardeAuth !== null &&
        regardeAuth !== undefined &&
        regardeAuthId !== null &&
        regardeAuthId !== undefined &&
        jazzAccountId !== null &&
        jazzAccountId !== undefined;
      if (!isRequiredHeadersPresent) {
        logger.error({
          message: "missing required headers",
          data: {
            regardeAuthId,
            regardeAuthNull: regardeAuth === null,
            regardeAuthUndefined: regardeAuthId === undefined,
            jazzAccountId,
          },
        });
        return c.json(
          {
            error:
              "Missing required headers: X-Regarde-Token, X-Regarde-Token-Id, X-Jazz-Account-Id",
          },
          400,
        );
      }

      const verificationResult = await verifyRegardeAuth(
        jazzAccountId,
        regardeAuth,
        regardeAuthId,
        worker,
      );

      logger.info({
        message: "Verification completed",
        data: {
          isValid: verificationResult.isValid,
          jazzAccountId:
            jazzAccountId === null || jazzAccountId === undefined ? "not provided" : "[SANITIZED]",
        },
      });

      return c.json(verificationResult, 200);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
      logger.error({
        message: "Failed to process /verify request",
        data: {
          errorMessage,
        },
      });
      return c.json({ error: errorMessage }, 500);
    }
  };
};
