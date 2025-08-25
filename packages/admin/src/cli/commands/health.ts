import { withAdminService } from "../types.js";
import { type ToolConfig } from "@alcyone-labs/arg-parser";
import { Logger } from "../../utils/logger.js";

export const healthCommands: ToolConfig[] = [
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

        return healthReport;
      });
    },
  },

  {
    name: "check-nickname-health",
    description: "Check health status for a specific nickname or account",
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

        const registryValue = healthReport.nickname
          ? admin.loadedWorker.root?.registry?.[healthReport.nickname] ||
            "Not found"
          : "N/A";
        const reverseValue = healthReport.accountId
          ? admin.loadedWorker.root?.reverseRegistry?.[
              healthReport.accountId
            ] || "Not found"
          : "N/A";

        console.log(
          `  ${Logger.formatStatus(healthReport.registryStatus, "Registry", registryValue)}`,
        );
        console.log(
          `  ${Logger.formatStatus(healthReport.reverseRegistryStatus, "Reverse Registry", reverseValue)}`,
        );
        console.log(
          `  ${Logger.formatStatus(healthReport.onboardingStatus, "Onboarding", healthReport.onboardingStatus === "ok" ? "Valid" : "Issues detected")}`,
        );

        if (healthReport.issues && healthReport.issues.length > 0) {
          console.log("\nIssues Found:");
          healthReport.issues.forEach((issue: string, index: number) => {
            console.log(`  ${index + 1}. ${issue}`);
          });
        }

        if (
          healthReport.recommendations &&
          healthReport.recommendations.length > 0
        ) {
          console.log("\nRecommendations:");
          healthReport.recommendations.forEach((rec: string, index: number) => {
            console.log(`  ${index + 1}. ${rec}`);
          });
        }

        return healthReport;
      });
    },
  },

  {
    name: "check-connectivity",
    description: "Test Jazz worker connectivity and sync status",
    flags: [],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const result = await admin.checkConnectivity();

        Logger.info("Jazz Worker Connectivity Check");
        console.log("=".repeat(50));
        console.log(
          `Worker Status: ${result.workerOnline ? "Online" : "Offline"}`,
        );
        console.log(
          `Sync Server: ${result.syncServerConnected ? "Connected" : "Disconnected"}`,
        );
        console.log(
          `Last Sync: ${result.lastSync ? new Date(result.lastSync).toLocaleString() : "Never"}`,
        );
        console.log(`Response Time: ${result.responseTimeMs}ms`);

        if (!result.workerOnline || !result.syncServerConnected) {
          Logger.error("Connectivity issues detected!");
          process.exit(1);
        }

        return result;
      });
    },
  },

  {
    name: "fix-nickname",
    description:
      "Attempt to fix synchronization issues for a nickname or account",
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
        const result = await admin.fixNickname(
          ctx.args.nickname,
          ctx.args.accountId,
        );

        if (result.success) {
          Logger.success("Synchronization issues fixed successfully!");
          if (result.changes && result.changes.length > 0) {
            console.log("\nActions taken:");
            result.changes.forEach((change: string, index: number) => {
              console.log(`  ${index + 1}. ${change}`);
            });
          }
        } else {
          Logger.info("No synchronization issues found or no fixes applied.");
          if (result.errors && result.errors.length > 0) {
            console.log("\nErrors encountered:");
            result.errors.forEach((error: string, index: number) => {
              console.log(`  ${index + 1}. ${error}`);
            });
          }
        }

        return result;
      });
    },
  },
];
