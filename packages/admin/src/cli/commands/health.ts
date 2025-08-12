import { Command, withAdminService } from "../types.js";
import { Logger } from "../../utils/logger.js";

export const healthCommands: Command[] = [
  {
    name: "health",
    description: "Check registry integrity and health",
    flags: [],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const healthReport = await admin.healthCheck();

        Logger.info("Registry Health Check");
        console.log("=".repeat(50));

        const statusColor = healthReport.isHealthy ? "\x1b[32m" : "\x1b[33m";
        console.log(
          `Status: ${statusColor}${healthReport.status.toUpperCase()}\x1b[0m`,
        );
        console.log(`Last checked: ${healthReport.lastChecked}`);
        console.log("");

        console.log("Registry Statistics:");
        console.log(`  • Total nicknames: ${healthReport.totalNicknames}`);
        console.log(`  • Total accounts: ${healthReport.totalAccounts}`);
        console.log(
          `  • Reserved nicknames: ${healthReport.reservedNicknames}`,
        );
        console.log(`  • Audit log entries: ${healthReport.auditLogEntries}`);
        console.log("");

        if (healthReport.issues.length > 0) {
          Logger.warning("Issues Found:");
          healthReport.issues.forEach((issue: string, index: number) => {
            console.log(`  ${index + 1}. ${issue}`);
          });
          console.log("");
        } else {
          Logger.success("No issues found!");
        }

        if (!healthReport.isHealthy) {
          console.log("Detailed Inconsistencies:");

          if (healthReport.inconsistencies.orphanedNicknames.length > 0) {
            console.log(
              `  Orphaned nicknames (${healthReport.inconsistencies.orphanedNicknames.length}):`,
            );
            healthReport.inconsistencies.orphanedNicknames
              .slice(0, 5)
              .forEach((nickname: string) => {
                console.log(`    - ${nickname}`);
              });
            if (healthReport.inconsistencies.orphanedNicknames.length > 5) {
              console.log(
                `    ... and ${healthReport.inconsistencies.orphanedNicknames.length - 5} more`,
              );
            }
          }

          if (healthReport.inconsistencies.orphanedAccounts.length > 0) {
            console.log(
              `  Orphaned accounts (${healthReport.inconsistencies.orphanedAccounts.length}):`,
            );
            healthReport.inconsistencies.orphanedAccounts
              .slice(0, 5)
              .forEach((account: string) => {
                console.log(`    - ${account}`);
              });
            if (healthReport.inconsistencies.orphanedAccounts.length > 5) {
              console.log(
                `    ... and ${healthReport.inconsistencies.orphanedAccounts.length - 5} more`,
              );
            }
          }
        }

        return healthReport;
      });
    },
  },

  {
    name: "check-nickname-health",
    description: "Check health of a specific nickname or account",
    flags: [
      {
        name: "nickname",
        type: "string",
        mandatory: false,
        options: ["--nickname"],
        description: "The nickname to check",
      },
      {
        name: "accountId",
        type: "string",
        mandatory: false,
        options: ["--account-id"],
        description: "The account ID to check",
      },
    ],
    handler: async (ctx) => {
      if (!ctx.args.nickname && !ctx.args.accountId) {
        throw new Error("Either --nickname or --account-id must be provided");
      }

      return withAdminService(async (admin) => {
        const healthReport = await admin.checkNicknameHealth(
          ctx.args.nickname,
          ctx.args.accountId,
        );

        Logger.info("Nickname Health Check");
        console.log("=".repeat(40));

        if (healthReport.nickname) {
          console.log(`Nickname: ${healthReport.nickname}`);
        }
        if (healthReport.accountId) {
          console.log(`Account ID: ${healthReport.accountId}`);
        }
        console.log("");

        console.log("Status Checks:");
        console.log(`  ${Logger.formatStatus(healthReport.registryStatus, "Registry", healthReport.registryStatus)}`);
        console.log(`  ${Logger.formatStatus(healthReport.reverseRegistryStatus, "Reverse Registry", healthReport.reverseRegistryStatus)}`);
        console.log(`  ${Logger.formatStatus(healthReport.onboardingStatus, "Onboarding", healthReport.onboardingStatus)}`);
        console.log("");

        if (healthReport.issues.length > 0) {
          Logger.warning("Issues Found:");
          healthReport.issues.forEach((issue: string, index: number) => {
            console.log(`  ${index + 1}. ${issue}`);
          });
          console.log("");
        } else {
          Logger.success("No issues found!");
        }

        if (healthReport.recommendations.length > 0) {
          Logger.info("Recommendations:");
          healthReport.recommendations.forEach((rec: string, index: number) => {
            console.log(`  ${index + 1}. ${rec}`);
          });
        }

        return healthReport;
      });
    },
  },

  {
    name: "fix-nickname",
    description: "Attempt to fix synchronization issues for a nickname",
    flags: [
      {
        name: "nickname",
        type: "string",
        mandatory: false,
        options: ["--nickname"],
        description: "The nickname to fix",
      },
      {
        name: "accountId",
        type: "string",
        mandatory: false,
        options: ["--account-id"],
        description: "The account ID to fix",
      },
    ],
    handler: async (ctx) => {
      if (!ctx.args.nickname && !ctx.args.accountId) {
        throw new Error("Either --nickname or --account-id must be provided");
      }

      return withAdminService(async (admin) => {
        const fixResult = await admin.fixNickname(
          ctx.args.nickname,
          ctx.args.accountId,
        );

        Logger.info("Fix Nickname Operation");
        console.log("=".repeat(40));

        if (fixResult.success) {
          Logger.success("Fix operation completed successfully!");
        } else {
          Logger.error("Fix operation encountered errors.");
        }
        console.log("");

        if (fixResult.changes.length > 0) {
          Logger.info("Changes Made:");
          fixResult.changes.forEach((change: string, index: number) => {
            console.log(`  ${index + 1}. ${change}`);
          });
          console.log("");
        }

        if (fixResult.errors && fixResult.errors.length > 0) {
          Logger.error("Errors Encountered:");
          fixResult.errors.forEach((error: string, index: number) => {
            console.log(`  ${index + 1}. ${error}`);
          });
        }

        return fixResult;
      });
    },
  },
];
