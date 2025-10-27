import { verifyRegardeAuth } from "#/domains/auth/handlers/verify";
import type {
  NicknameRegistry,
  ReverseNicknameRegistry,
  ReservedNicknamesRegistry,
} from "@regarde-dev/jazz-schemas/regarde.dev";
import type { Loaded } from "jazz-tools";
import type { RegistryWorkerAccount } from "@regarde-dev/jazz-schemas/regarde.dev";

export const registerHandler = (
  nicknameRegistry: NicknameRegistry,
  reverseNicknameRegistry: ReverseNicknameRegistry,
  worker: Loaded<typeof RegistryWorkerAccount>,
  reservedNicknames: ReservedNicknamesRegistry,
) => {
  return async (c: any) => {
    try {
      const { nickname, jazzAccountID, oldNickname } = c.req.valid("json");

      const regardeAuth = c.req.header("X-Regarde-Token");
      const regardeAuthId = c.req.header("X-Regarde-Token-Id");

      if (!regardeAuth) {
        console.log(
          `Missing registration token header for AccountID "${jazzAccountID}"`,
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
        `Received registration request: nickname="${nickname}", AccountID="${jazzAccountID}"`,
      );

      const verificationResult = await verifyRegardeAuth(
        jazzAccountID,
        regardeAuth,
        regardeAuthId,
      );
      if (!verificationResult.isValid) {
        console.log(
          `Authentication failed for AccountID "${jazzAccountID}": ${verificationResult.error}`,
        );
        return c.json(
          { error: `Authentication failed: ${verificationResult.error}` },
          403,
        );
      }

      console.log(`Authentication successful for AccountID "${jazzAccountID}"`);

      const currentNicknameForAccount = reverseNicknameRegistry[jazzAccountID];
      const existingAccountForNickname = nicknameRegistry[nickname];
      const existingAccountForOldNickname = nicknameRegistry[oldNickname];

      if (!nickname && oldNickname) {
        if (currentNicknameForAccount !== oldNickname) {
          console.log(
            `Account "${jazzAccountID}" does not own nickname "${oldNickname}". Current: "${currentNicknameForAccount}"`,
          );
          return c.json(
            { error: "Account does not own the nickname to delete" },
            403,
          );
        }

        nicknameRegistry.$jazz.delete(oldNickname);
        reverseNicknameRegistry.$jazz.delete(jazzAccountID);
        console.log(
          `Nickname "${oldNickname}" and reverse entry for AccountID "${jazzAccountID}" deleted.`,
        );

        return c.body(null, 204);
      }

      if (
        existingAccountForNickname &&
        existingAccountForNickname !== jazzAccountID
      ) {
        console.log(
          `Nickname "${nickname}" is already taken by AccountID: ${existingAccountForNickname}.`,
        );
        return c.json({ error: "Nickname already taken" }, 409);
      }

      const reservation = reservedNicknames[nickname];
      if (reservation) {
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
        if (existingAccountForOldNickname !== jazzAccountID) {
          console.log(
            `Account "${jazzAccountID}" does not own oldNickname "${oldNickname}" for swap. Current: "${currentNicknameForAccount}"`,
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
            `Swap request where oldNickname "${oldNickname}" is same as new nickname "${nickname}" for AccountID "${jazzAccountID}". No-op.`,
          );

          return c.body(null, 204);
        }

        nicknameRegistry.$jazz.delete(oldNickname);
        console.log(`Removed old nickname "${oldNickname}" from registry.`);
      } else {
        if (currentNicknameForAccount) {
          console.log(
            `AccountID "${jazzAccountID}" already has a nickname "${currentNicknameForAccount}". Cannot register a new one without specifying oldNickname for swap.`,
          );
          return c.json(
            {
              error: `Account already has a nickname: "${currentNicknameForAccount}"`,
            },
            409,
          );
        }
      }

      nicknameRegistry.$jazz.set(nickname, jazzAccountID);
      reverseNicknameRegistry.$jazz.set(jazzAccountID, nickname);
      console.log(
        `Nickname "${nickname}" registered/swapped for AccountID: ${jazzAccountID}.`,
      );

      return c.body(null, 204);
    } catch (error: any) {
      console.error(`Error processing /register request: ${error}`);
      return c.json({ error: error.message || "Internal server error" }, 500);
    }
  };
};

