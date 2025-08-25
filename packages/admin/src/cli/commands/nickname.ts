import { withAdminService } from "../types.js";
import { type ToolConfig } from "@alcyone-labs/arg-parser";
import { Logger } from "../../utils/logger.js";

export const nicknameCommands: ToolConfig[] = [
  {
    name: "add",
    description: "Add a new nickname to account mapping",
    flags: [
      {
        name: "nickname",
        type: "string",
        mandatory: true,
        options: ["--nickname"],
        description: "The nickname to register",
      },
      {
        name: "accountId",
        type: "string",
        mandatory: true,
        options: ["--account-id"],
        description: "The Jazz account ID to associate with the nickname",
      },
      {
        name: "allowReserved",
        type: "boolean",
        mandatory: false,
        options: ["--allow-reserved"],
        description:
          "Allow registration of reserved nicknames (admin override)",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const result = await admin.addNickname(
          ctx.args.nickname,
          ctx.args.accountId,
          ctx.args.allowReserved || false,
        );
        Logger.success(
          `Successfully added nickname "${ctx.args.nickname}" to account ${ctx.args.accountId}`,
        );
        return result;
      });
    },
  },

  {
    name: "update",
    description: "Transfer a nickname to a different accountId",
    flags: [
      {
        name: "nickname",
        type: "string",
        mandatory: true,
        options: ["--nickname"],
        description: "The nickname to transfer",
      },
      {
        name: "accountId",
        type: "string",
        mandatory: true,
        options: ["--account-id"],
        description: "The new Jazz account ID to associate with the nickname",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const result = await admin.updateNickname(
          ctx.args.nickname,
          ctx.args.accountId,
        );
        Logger.success(
          `Successfully transferred nickname "${ctx.args.nickname}" to account ${ctx.args.accountId}`,
        );
        if (result.oldAccountId) {
          Logger.info(`Previous account: ${result.oldAccountId}`);
        }
        return result;
      });
    },
  },

  {
    name: "remove",
    description: "Remove a nickname from the registry",
    flags: [
      {
        name: "nickname",
        type: "string",
        mandatory: true,
        options: ["--nickname"],
        description: "The nickname to remove",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const result = await admin.removeNickname(ctx.args.nickname);
        Logger.success(`Successfully removed nickname "${ctx.args.nickname}"`);
        if (result.removedAccountId) {
          Logger.info(`Removed from account: ${result.removedAccountId}`);
        }
        return result;
      });
    },
  },
];
