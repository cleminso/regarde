import { verifyRegardeAuth } from "#/domains/auth/handlers/verify";
import type {
  TNicknameRegistry,
  TReverseNicknameRegistry,
  TReservedNicknamesRegistry,
  RegistryWorkerAccount,
} from "@regarde-dev/core";
import type { Loaded } from "jazz-tools";

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

      if (!regardeAuth) {
        console.log(
          `Missing registration token header for AccountID "${jazzAccountId}"`,
        );
        return c.json({ error: "Missing registration token header" }, 401);
      }

      if (!nickname && !oldNickname) {
        return c.json(
          {
            error:
              "Must provide either a new nickname or an old one to delete/swap",
          },
          400,
        );
      }

      console.log(
        `Received registration request: nickname="${nickname}", AccountID="${jazzAccountId}"`,
      );

      const verificationResult = await verifyRegardeAuth(
        jazzAccountId,
        regardeAuth,
        regardeAuthId,
        worker,
      );
      if (!verificationResult.isValid) {
        console.log(
          `Authentication failed for AccountID "${jazzAccountId}": ${verificationResult.error}`,
        );
        return c.json(
          { error: `Authentication failed: ${verificationResult.error}` },
          403,
        );
      }

      console.log(`Authentication successful for AccountID "${jazzAccountId}"`);

      const currentNicknameForAccount = reverseNicknameRegistry[jazzAccountId];
      const existingAccountForNickname = nicknameRegistry[nickname];
      const existingAccountForOldNickname = nicknameRegistry[oldNickname];

      if (!nickname && oldNickname) {
        if (currentNicknameForAccount !== oldNickname) {
          console.log(
            `Account "${jazzAccountId}" does not own nickname "${oldNickname}". Current: "${currentNicknameForAccount}"`,
          );
          return c.json(
            { error: "Account does not own the nickname to delete" },
            403,
          );
        }

        nicknameRegistry.$jazz.delete(oldNickname);
        reverseNicknameRegistry.$jazz.delete(jazzAccountId);
        console.log(
          `Nickname "${oldNickname}" and reverse entry for AccountID "${jazzAccountId}" deleted.`,
        );

        return c.body(null, 204);
      }

      if (
        existingAccountForNickname &&
        existingAccountForNickname !== jazzAccountId
      ) {
        console.log(
          `Nickname "${nickname}" is already taken by AccountID: ${existingAccountForNickname}.`,
        );
        return c.json({ error: "Nickname already taken" }, 409);
      }

      const reservation = reservedNicknames[nickname];
      if (reservation.$isLoaded) {
        console.log(
          `Nickname "${nickname}" is reserved (category: ${reservation.category}, reserved by: ${reservation.reservedBy}).`,
        );
        return c.json(
          {
            error: "Nickname is reserved",
            reservationCategory: reservation.category,
            reservationReason: reservation.reason,
          },
          403,
        );
      }

      if (oldNickname) {
        if (existingAccountForOldNickname !== jazzAccountId) {
          console.log(
            `Account "${jazzAccountId}" does not own oldNickname "${oldNickname}" for swap. Current: "${currentNicknameForAccount}"`,
          );
          return c.json(
            {
              error:
                "Account does not own the nickname specified as oldNickname",
            },
            403,
          );
        }

        if (oldNickname === nickname) {
          console.log(
            `Swap request where oldNickname "${oldNickname}" is same as new nickname "${nickname}" for AccountID "${jazzAccountId}". No-op.`,
          );

          return c.body(null, 204);
        }

        nicknameRegistry.$jazz.delete(oldNickname);
        console.log(`Removed old nickname "${oldNickname}" from registry.`);
      } else {
        if (currentNicknameForAccount) {
          console.log(
            `AccountID "${jazzAccountId}" already has a nickname "${currentNicknameForAccount}". Cannot register a new one without specifying oldNickname for swap.`,
          );
          return c.json(
            {
              error: `Account already has a nickname: "${currentNicknameForAccount}"`,
            },
            409,
          );
        }
      }

      nicknameRegistry.$jazz.set(nickname, jazzAccountId);
      reverseNicknameRegistry.$jazz.set(jazzAccountId, nickname);
      console.log(
        `Nickname "${nickname}" registered/swapped for AccountID: ${jazzAccountId}.`,
      );

      return c.body(null, 204);
    } catch (error: any) {
      console.error(`Error processing /register request: ${error}`);
      return c.json({ error: error.message || "Internal server error" }, 500);
    }
  };
};
