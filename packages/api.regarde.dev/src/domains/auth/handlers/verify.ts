import { co, Loaded } from "jazz-tools";

import { RegardeAuth, RegistryWorkerAccount, useLogging } from "@regarde-dev/core";

const logger = useLogging({
  module: import.meta.filename,
});

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

export async function verifyRegardeAuth(
  jazzAccountId: string,
  providedRegardeAuth: string,
  regardeAuthCoValueId: string,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<VerificationResult> {
  try {
    const isJazzAccountIdValid = typeof jazzAccountId === "string" && jazzAccountId !== "";

    const isProvidedRegardeAuthValid =
      typeof providedRegardeAuth === "string" && providedRegardeAuth !== "";

    if (isJazzAccountIdValid === false || isProvidedRegardeAuthValid === false) {
      return {
        isValid: false,
        error: "Invalid jazzAccountId or registration token: must be non-empty strings",
      };
    }

    const regardeAuth = (await RegardeAuth.load(regardeAuthCoValueId, {
      resolve: true,
    })) as Loaded<typeof RegardeAuth>;

    const isRegardeAuthLoaded = regardeAuth.$isLoaded === true;
    if (isRegardeAuthLoaded === false) {
      logger.error({
        message: "Failed to load RegardeAuth",
        data: {
          jazzAccountId,
          regardeAuthCoValueId,
        },
      });
      return {
        isValid: false,
        error:
          "RegardeAuth CoMap not found - verify X-Regarde-Token-Id header contains valid CoValue ID",
      };
    }

    logger.info({
      message: "RegardeAuth loaded successfully, proceeding with verification",
      data: {
        jazzAccountId,
        regardeAuthCoValueId,
      },
    });

    const userAccount = await co.account().load(jazzAccountId, {
      loadAs: worker,
    });

    const isUserAccountLoaded = userAccount.$isLoaded === true;
    if (isUserAccountLoaded === false) {
      logger.error({
        message: "Failed to load userAccount",
        data: {
          jazzAccountId,
        },
      });
      return {
        isValid: false,
        error: "User account not found",
      };
    }

    const isUserCanAdminRegardeAuth = userAccount.canAdmin(regardeAuth);
    if (isUserCanAdminRegardeAuth === false) {
      logger.debug({
        message: "User does not own RegardeAuth CoValue",
        data: {
          jazzAccountId,
          regardeAuthCoValueId,
          regardeAuthCovalueId: regardeAuth.$jazz.id,
        },
      });
      return {
        isValid: false,
        error: "User does not have permission to access this RegardeAuth CoMap",
      };
    }

    if (regardeAuth.token !== providedRegardeAuth) {
      logger.error({
        message: "Invalid registration token",
        data: {
          jazzAccountId,
          regardeAuthCoValueId,
          providedTokenLength: providedRegardeAuth.length,
          storedTokenLength: regardeAuth.token.length,
          tokensMatch: providedRegardeAuth === regardeAuth.token, // false
          tokenExpiresAt: regardeAuth.expiresAt,
          currentTime: Date.now(),
        },
      });
      return { isValid: false, error: "Invalid registration token" };
    }

    if (regardeAuth.expiresAt && Date.now() > regardeAuth.expiresAt) {
      logger.error({
        message: "Registration token has expired",
        data: {
          jazzAccountId,
          regardeAuthCoValueId,
          tokenExpiresAt: regardeAuth.expiresAt,
          currentTime: Date.now(),
          ageMinutes: Math.floor((Date.now() - regardeAuth.expiresAt) / 60000),
        },
      });
      return { isValid: false, error: "Registration token has expired" };
    }

    logger.info({
      message: "Registration token verified successfully",
      data: {
        jazzAccountId,
        regardeAuthCoValueId,
      },
    });
    return { isValid: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error({
      message: "Unexpected error during registration token verification",
      data: {
        jazzAccountId,
        errorMessage,
      },
    });
    return {
      isValid: false,
      error: `Verification failed: ${errorMessage}`,
    };
  }
}
