import type {
  TNicknameRegistry,
  TReverseNicknameRegistry,
  TReservedNicknamesRegistry,
  RegistryWorkerAccount,
} from "@regarde-dev/core";
import type { Loaded } from "jazz-tools";

import { verifyRegardeAuth } from "#/domains/auth/handlers/verify";
import { useLogging } from "@regarde-dev/core";

const logger = useLogging({
  module: import.meta.filename,
});

export const registerHandler = (
  nicknameRegistry: TNicknameRegistry,
  reverseNicknameRegistry: TReverseNicknameRegistry,
  worker: Loaded<typeof RegistryWorkerAccount>,
  reservedNicknames: TReservedNicknamesRegistry,
) => {
  return async (c: any) => {
    try {
      const { nickname, jazzAccountId, oldNickname } = c.req.valid("json");
      const regardeAuth = c.req.header("X-Regarde-Token");
      const regardeAuthId = c.req.header("X-Regarde-Token-Id");

      const isRegardeAuthPresent = regardeAuth !== null && regardeAuth !== undefined;
      if (!isRegardeAuthPresent) {
        logger.debug({
          message: "missing registration token header",
          data: {
            nickname,
            jazzAccountId,
            oldNickname,
            regardeAuth,
            regardeAuthId,
          },
        });
        return c.json({ error: "Missing registration token header" }, 401);
      }

      const isNicknamePresent = nickname !== null && nickname !== undefined;
      const isOldNicknamePresent = oldNickname !== null && oldNickname !== undefined;

      if (!isNicknamePresent && !isOldNicknamePresent) {
        logger.error({
          message: "Must provide either a new nickname or an old one to delete/swap",
          data: {
            isNicknamePresent,
            isOldNicknamePresent,
          },
        });
        return c.json(
          {
            error: "Must provide either a new nickname or an old one to delete/swap",
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
      if (!verificationResult.isValid) {
        logger.error({
          message: "Authentication failed",
          data: {
            jazzAccountId,
            regardeAuth,
            regardeAuthId,
            worker,
          },
        });
        return c.json({ error: `Authentication failed: ${verificationResult.error}` }, 403);
      }

      logger.debug({
        message: "Authentication successful",
        data: {
          jazzAccountId,
          regardeAuthId,
        },
      });

      // load current state from registry
      const currentNicknameForAccount = reverseNicknameRegistry[jazzAccountId];
      const existingAccountForNickname = nicknameRegistry[nickname];
      const existingAccountForOldNickname = nicknameRegistry[oldNickname];

      // Branch 1 - Delete nickname
      if (!nickname && oldNickname) {
        // (1) - verify user owns oldNickname
        if (currentNicknameForAccount !== oldNickname) {
          logger.warn({
            message: "Account does not own nickname to delete",
            data: {
              jazzAccountId,
              oldNickname,
              currentNicknameForAccount,
            },
          });
          return c.json({ error: "Account does not own the nickname to delete" }, 403);
        }

        // (2) - delete from both registries
        nicknameRegistry.$jazz.delete(oldNickname);
        reverseNicknameRegistry.$jazz.delete(jazzAccountId);
        logger.debug({
          message: "Nickname and reverse entry deleted",
          data: {
            nickname: oldNickname,
            jazzAccountId,
          },
        });
        return c.body(null, 204);
      }

      // check if nickname is already taken by a jazzAccountId
      if (existingAccountForNickname && existingAccountForNickname !== jazzAccountId) {
        logger.warn({
          message: "Nickname already taken by another account",
          data: {
            nickname,
            requestedBy: jazzAccountId,
            ownedBy: existingAccountForNickname,
          },
        });
        return c.json({ error: "Nickname already taken" }, 409);
      }

      // check if nickname is reserved
      const reservation = reservedNicknames[nickname];
      const isReservationLoaded =
        reservation !== null && reservation !== undefined && reservation.$isLoaded === true;
      if (isReservationLoaded === true) {
        logger.warn({
          message: "Nickname is reserved",
          data: {
            nickname,
            reservedBy: reservation.reservedBy,
            category: reservation.category,
            reason: reservation.reason,
          },
        });
        return c.json(
          {
            error: "Nickname is reserved",
            reservationCategory: reservation.category,
            reservationReason: reservation.reason,
          },
          403,
        );
      }

      // Branch 2 - Swap/Register nickname
      if (oldNickname) {
        // oldNickname is provided
        if (existingAccountForOldNickname !== jazzAccountId) {
          logger.warn({
            message: "Account does not own oldNickname for swap",
            data: {
              oldNickname,
              jazzAccountId,
              currentNickname: currentNicknameForAccount,
            },
          });
          return c.json(
            {
              error: "Account does not own the nickname specified as oldNickname",
            },
            403,
          );
        }

        if (oldNickname === nickname) {
          logger.debug({
            message: "Swap request: oldNickname equals new nickname (no-op)",
            data: {
              oldNickname,
              newNickname: nickname,
              jazzAccountId,
            },
          });
          return c.body(null, 204);
        }

        nicknameRegistry.$jazz.delete(oldNickname);
        logger.debug({
          message: "Old nickname removed from registry during swap",
          data: {
            oldNickname,
            jazzAccountId,
          },
        });
      } else {
        // no oldNickname provided
        if (currentNicknameForAccount) {
          logger.error({
            message:
              "Account already has a nickname. Must specify oldNickname to register a new nickname",
            data: {
              jazzAccountId,
              currentNicknameForAccount,
            },
          });
          return c.json(
            {
              error: `Account already has a nickname: "${currentNicknameForAccount}"`,
            },
            409,
          );
        }
      }

      // (2) - register nickname to both registries
      nicknameRegistry.$jazz.set(nickname, jazzAccountId);
      reverseNicknameRegistry.$jazz.set(jazzAccountId, nickname);
      logger.info({
        message: "Nickname registered successfully",
        data: {
          nickname,
          jazzAccountId,
        },
      });

      return c.body(null, 204);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logger.error({
        message: "Failed to process /register request",
        data: { errorMessage },
      });

      return c.json({ error: errorMessage }, 500);
    }
  };
};
