import { type ToolConfig } from "@alcyone-labs/arg-parser";

import { Logger } from "../../utils/logger.js";
import { withAdminService } from "../types.js";

export const inspectCommands: ToolConfig[] = [
  {
    name: "get-nickname",
    description: "Inspect current registry, reverse-registry, and reservation state for a nickname",
    flags: [
      {
        name: "nickname",
        type: "string",
        mandatory: true,
        options: ["--nickname"],
        description: "Nickname to inspect",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        admin.validateNickname(ctx.args.nickname);

        const loadedWorker = admin.getLoadedWorker();

        const accountId = loadedWorker.root?.registry?.[ctx.args.nickname] ?? null;
        const reverseNickname =
          accountId !== null ? (loadedWorker.root?.reverseRegistry?.[accountId] ?? null) : null;

        const reservationStatus = await admin.checkReservationStatus(ctx.args.nickname);

        const reverseMatches =
          accountId !== null && reverseNickname !== null
            ? reverseNickname === ctx.args.nickname
            : null;

        const result = {
          nickname: ctx.args.nickname,
          state: reservationStatus.state,
          accountId,
          reverseNickname,
          reverseMatches,
          isReserved: reservationStatus.isReserved,
          reservation: reservationStatus.reservation,
          warnings: reservationStatus.warnings,
        };

        Logger.info(`Nickname inspection: "${ctx.args.nickname}"`);
        console.log(`State: ${result.state}`);
        console.log(`Registry account: ${result.accountId ?? "Not found"}`);

        if (result.accountId !== null) {
          console.log(`Reverse nickname: ${result.reverseNickname ?? "Not found"}`);
          if (result.reverseMatches === false) {
            Logger.warning(
              `Mismatch: reverse registry points to "${result.reverseNickname}" (expected "${ctx.args.nickname}")`,
            );
          }
        }

        if (result.isReserved === true && result.reservation) {
          Logger.warning("Reservation found:");
          console.log(`  Category: ${result.reservation.category}`);
          console.log(`  Reserved by: ${result.reservation.reservedBy}`);
          console.log(`  Reserved at: ${new Date(result.reservation.reservedAt).toLocaleString()}`);
          if (result.reservation.reason) {
            console.log(`  Reason: ${result.reservation.reason}`);
          }
        }

        if (result.warnings && result.warnings.length > 0) {
          Logger.warning("Warnings:");
          result.warnings.forEach((warning, index) => {
            console.log(`  ${index + 1}. ${warning}`);
          });
        }

        return result;
      });
    },
  },

  {
    name: "get-account",
    description: "Inspect current reverse-registry and registry state for an account",
    flags: [
      {
        name: "accountId",
        type: "string",
        mandatory: true,
        options: ["--account-id"],
        description: "Account ID to inspect",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        admin.validateAccountId(ctx.args.accountId);

        const loadedWorker = admin.getLoadedWorker();

        const nickname = loadedWorker.root?.reverseRegistry?.[ctx.args.accountId] ?? null;
        const registryAccountId =
          nickname !== null ? (loadedWorker.root?.registry?.[nickname] ?? null) : null;

        const registryMatches =
          nickname !== null && registryAccountId !== null
            ? registryAccountId === ctx.args.accountId
            : null;

        const reservationStatus =
          nickname !== null ? await admin.checkReservationStatus(nickname) : null;

        const issues: string[] = [];
        if (nickname === null) {
          issues.push("No reverse registry entry for account");
        }
        if (nickname !== null && registryAccountId === null) {
          issues.push(
            `Reverse registry points to nickname "${nickname}", but registry has no entry for it`,
          );
        }
        if (registryMatches === false) {
          issues.push(
            `Mismatch: registry for nickname "${nickname}" points to account "${registryAccountId}" (expected "${ctx.args.accountId}")`,
          );
        }
        if (
          reservationStatus !== null &&
          reservationStatus.isReserved === true &&
          reservationStatus.reservation
        ) {
          issues.push(
            `Nickname "${nickname}" is reserved (category: ${reservationStatus.reservation.category})`,
          );
        }

        const result = {
          accountId: ctx.args.accountId,
          nickname,
          registryAccountId,
          registryMatches,
          reservation: reservationStatus !== null ? reservationStatus.reservation : undefined,
          reservationState: reservationStatus !== null ? reservationStatus.state : undefined,
          issues,
        };

        Logger.info(`Account inspection: ${ctx.args.accountId}`);
        console.log(`Reverse registry nickname: ${result.nickname ?? "Not found"}`);

        if (result.nickname !== null) {
          console.log(
            `Registry account for "${result.nickname}": ${result.registryAccountId ?? "Not found"}`,
          );
          if (result.registryMatches === true) {
            Logger.success("Registry and reverse registry match");
          } else if (result.registryMatches === false) {
            Logger.warning("Registry and reverse registry mismatch");
          }
        }

        if (result.issues.length > 0) {
          Logger.warning("Issues:");
          result.issues.forEach((issue, index) => {
            console.log(`  ${index + 1}. ${issue}`);
          });
        }

        return result;
      });
    },
  },
];
