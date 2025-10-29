import { verifyRegardeAuth } from "./verify";
import type { Loaded } from "jazz-tools";
import type { RegistryWorkerAccount } from "@regarde-dev/sdk/registry";

const HARDCODED_API_KEY = "nick-sauve.app-ilfaitbeautoday";

export const verifyHandler = (worker: Loaded<typeof RegistryWorkerAccount>) => {
  return async (c: any) => {
    try {
      const apiKey = c.req.header("X-API-Key");
      const regardeAuth = c.req.header("X-Regarde-Token");
      const regardeAuthId = c.req.header("X-Regarde-Token-Id");
      const jazzAccountId = c.req.header("X-Jazz-Account-Id");

      if (!apiKey) {
        console.log("Missing API key header");
        return c.json({ error: "Missing API key header" }, 401);
      }

      if (apiKey !== HARDCODED_API_KEY) {
        console.log("Invalid API key");
        return c.json({ error: "Invalid API key" }, 401);
      }

      if (!regardeAuth || !regardeAuthId || !jazzAccountId) {
        console.log("Missing required headers");
        return c.json(
          {
            error:
              "Missing required headers: X-Regarde-Token, X-Regarde-Token-Id, X-Jazz-Account-Id",
          },
          400,
        );
      }

      console.log(`Verifying registration key for account: ${jazzAccountId}`);

      const verificationResult = await verifyRegardeAuth(
        jazzAccountId,
        regardeAuth,
        regardeAuthId,
      );

      console.log(
        `Verification result for account ${jazzAccountId}: ${verificationResult.isValid}`,
      );

      return c.json(verificationResult, 200);
    } catch (error: any) {
      console.error(`Error processing /verify request: ${error}`);
      return c.json({ error: error.message || "Internal server error" }, 500);
    }
  };
};

