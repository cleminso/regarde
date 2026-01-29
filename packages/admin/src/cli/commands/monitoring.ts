import { type ToolConfig } from "@alcyone-labs/arg-parser";
import { z } from "zod";

import { Logger } from "../../utils/logger.js";
import { withAdminService } from "../types.js";

const METRICS_FORMATS = ["json", "prometheus", "text"] as const;
const METRICS_FORMAT_SCHEMA = z.enum(METRICS_FORMATS);

export const monitoringCommands: ToolConfig[] = [
  {
    name: "metrics",
    description: "Display registry metrics and statistics",
    flags: [
      {
        name: "outputFormat",
        type: METRICS_FORMAT_SCHEMA,
        mandatory: false,
        options: ["--output-format"],
        description: "Output format: json, prometheus, text (default: text)",
        defaultValue: "text",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const metrics = await admin.getMetrics();
        const format = ctx.args.outputFormat;

        if (format === "json") {
          // No-op: JSON output is handled by the CLI wrapper when --format=json is used.
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
];
