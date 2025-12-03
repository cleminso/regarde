import { withAdminService } from "../types.js";
import { type ToolConfig } from "@alcyone-labs/arg-parser";
import { Logger } from "../../utils/logger.js";

export const reservationCommands: ToolConfig[] = [
  {
    name: "reserve",
    description: "Reserve a nickname to prevent registration",
    flags: [
      {
        name: "nickname",
        type: "string",
        mandatory: true,
        options: ["--nickname"],
        description: "The nickname to reserve",
      },
      {
        name: "reason",
        type: "string",
        mandatory: false,
        options: ["--reason"],
        description: "Reason for reservation",
      },
      {
        name: "category",
        type: "string",
        mandatory: false,
        options: ["--category"],
        description:
          "Reservation category (admin, brand, system, offensive, custom)",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const category = ctx.args.category || "custom";
        const validCategories = [
          "admin",
          "brand",
          "system",
          "offensive",
          "custom",
        ];

        if (!validCategories.includes(category)) {
          throw new Error(
            `Invalid category. Must be one of: ${validCategories.join(", ")}`,
          );
        }

        const result = await admin.reserveNickname(
          ctx.args.nickname,
          category,
          ctx.args.reason,
        );
        Logger.success(
          `Successfully reserved nickname "${ctx.args.nickname}" (category: ${category})`,
        );
        if (ctx.args.reason) {
          Logger.info(`Reason: ${ctx.args.reason}`);
        }
        return result;
      });
    },
  },

  {
    name: "unreserve",
    description: "Remove a nickname reservation",
    flags: [
      {
        name: "nickname",
        type: "string",
        mandatory: true,
        options: ["--nickname"],
        description: "The nickname to unreserve",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const result = await admin.unreserveNickname(ctx.args.nickname);
        Logger.success(
          `Successfully unreserved nickname "${ctx.args.nickname}"`,
        );
        return result;
      });
    },
  },

  {
    name: "list-reserved",
    description: "List all reserved nicknames",
    flags: [
      {
        name: "category",
        type: "string",
        mandatory: false,
        options: ["--category"],
        description:
          "Filter by category (admin, brand, system, offensive, custom)",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const result = await admin.listReservedNicknames(ctx.args.category);

        if (result.reservations.length === 0) {
          const categoryFilter = ctx.args.category
            ? ` in category "${ctx.args.category}"`
            : "";
          Logger.info(`No reserved nicknames found${categoryFilter}.`);
          return result;
        }

        Logger.info("Reserved Nicknames:");
        result.reservations.forEach((reservation: any) => {
          const timeAgo = getTimeAgo(new Date(reservation.reservedAt));
          console.log(
            `  • ${reservation.nickname} (${reservation.category}) - reserved ${timeAgo}`,
          );
          if (reservation.reason) {
            console.log(`    Reason: ${reservation.reason}`);
          }
          console.log(`    Reserved by: ${reservation.reservedBy}`);
        });

        return result;
      });
    },
  },

  {
    name: "check-reserved",
    description: "Check if a nickname is reserved",
    flags: [
      {
        name: "nickname",
        type: "string",
        mandatory: true,
        options: ["--nickname"],
        description: "The nickname to check",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const result = await admin.checkReservationStatus(ctx.args.nickname);

        if (result.isReserved && result.reservation) {
          Logger.warning(`Nickname "${ctx.args.nickname}" is RESERVED`);
          console.log(`  Category: ${result.reservation.category}`);
          console.log(`  Reserved by: ${result.reservation.reservedBy}`);
          console.log(`  Reserved at: ${new Date(result.reservation.reservedAt).toLocaleString()}`);
          if (result.reservation.reason) {
            console.log(`  Reason: ${result.reservation.reason}`);
          }
        } else {
          Logger.success(`Nickname "${ctx.args.nickname}" is available (not reserved)`);
        }

        return result;
      });
    },
  },
];

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}
