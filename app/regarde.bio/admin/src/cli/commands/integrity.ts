import { withAdminService } from "../types.js";
import { type ToolConfig } from "@alcyone-labs/arg-parser";
import { Logger } from "../../utils/logger.js";

export const integrityCommands: ToolConfig[] = [
  {
    name: "validate-data",
    description: "Comprehensive data integrity validation",
    flags: [
      {
        name: "fix",
        type: "boolean",
        mandatory: false,
        options: ["--fix"],
        description: "Automatically fix detected issues",
      },
      {
        name: "verbose",
        type: "boolean",
        mandatory: false,
        options: ["--verbose"],
        description: "Show detailed validation results",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const result = await admin.validateDataIntegrity(ctx.args.fix || false);

        Logger.info("Data Integrity Validation");
        console.log("=".repeat(50));

        if (result.isValid) {
          Logger.success("All data integrity checks passed!");
        } else {
          Logger.warning(`Found ${result.issues.length} integrity issue(s):`);

          result.issues.forEach((issue: any, index: number) => {
            console.log(`  ${index + 1}. ${issue.type}: ${issue.description}`);
            if (ctx.args.verbose && issue.details) {
              console.log(`     Details: ${issue.details}`);
            }
            if (issue.fixed) {
              console.log(`Fixed automatically`);
            }
          });
        }

        return result;
      });
    },
  },

  {
    name: "check-duplicates",
    description: "Check for duplicate nickname registrations",
    flags: [],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const result = await admin.checkDuplicates();

        Logger.info("Duplicate Registration Check");
        console.log("=".repeat(50));

        if (result.duplicates.length === 0) {
          Logger.success("No duplicate registrations found!");
        } else {
          Logger.warning(`Found ${result.duplicates.length} duplicate(s):`);

          result.duplicates.forEach((dup: any, index: number) => {
            console.log(`  ${index + 1}. Nickname: ${dup.nickname}`);
            console.log(`     Accounts: ${dup.accounts.join(", ")}`);
          });
        }

        return result;
      });
    },
  },
];
