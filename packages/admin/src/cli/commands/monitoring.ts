import { withAdminService } from "../types.js";
import { type ToolConfig } from "@alcyone-labs/arg-parser";
import { Logger } from "../../utils/logger.js";

export const monitoringCommands: ToolConfig[] = [
  {
    name: "metrics",
    description: "Display registry metrics and statistics",
    flags: [
      {
        name: "format",
        type: "string",
        mandatory: false,
        options: ["--format"],
        description: "Output format: json, prometheus, text (default: text)",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const metrics = await admin.getMetrics();
        const format = ctx.args.format || "text";

        if (format === "json") {
          console.log(JSON.stringify(metrics, null, 2));
        } else if (format === "prometheus") {
          console.log(
            `# HELP jazz_registry_nicknames Total number of registered nicknames`,
          );
          console.log(`# TYPE jazz_registry_nicknames gauge`);
          console.log(`jazz_registry_nicknames ${metrics.totalNicknames}`);
          console.log(
            `# HELP jazz_registry_accounts Total number of accounts with nicknames`,
          );
          console.log(`# TYPE jazz_registry_accounts gauge`);
          console.log(`jazz_registry_accounts ${metrics.totalAccounts}`);
          console.log(
            `# HELP jazz_registry_reserved Total number of reserved nicknames`,
          );
          console.log(`# TYPE jazz_registry_reserved gauge`);
          console.log(`jazz_registry_reserved ${metrics.reservedNicknames}`);
        } else {
          Logger.info("Registry Metrics");
          console.log("=".repeat(40));
          console.log(`Total Nicknames: ${metrics.totalNicknames}`);
          console.log(`Total Accounts: ${metrics.totalAccounts}`);
          console.log(`Reserved Nicknames: ${metrics.reservedNicknames}`);
          console.log(`Audit Log Entries: ${metrics.auditLogEntries}`);
          console.log(
            `Last Updated: ${new Date(metrics.lastUpdated).toLocaleString()}`,
          );
        }

        return metrics;
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
];
