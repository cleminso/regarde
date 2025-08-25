import { withAdminService } from "../types.js";
import { type ToolConfig } from "@alcyone-labs/arg-parser";
import { Logger } from "../../utils/logger.js";

export const performanceCommands: ToolConfig[] = [
  {
    name: "benchmark",
    description: "Run performance benchmarks on registry operations",
    flags: [
      {
        name: "operations",
        type: "number",
        mandatory: false,
        options: ["--operations"],
        description: "Number of operations to benchmark (default: 100)",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const operations = ctx.args.operations || 100;
        const result = await admin.runBenchmark(operations);

        Logger.info("Registry Performance Benchmark");
        console.log("=".repeat(50));
        console.log(`Operations tested: ${operations}`);
        console.log(`Average response time: ${result.averageResponseTime}ms`);
        console.log(`Throughput: ${result.operationsPerSecond} ops/sec`);
        console.log(`Memory usage: ${result.memoryUsage}MB`);

        if (result.averageResponseTime > 1000) {
          Logger.warning("Performance degradation detected!");
        }

        return result;
      });
    },
  },

  {
    name: "audit-security",
    description: "Security audit of registry access patterns",
    flags: [
      {
        name: "days",
        type: "number",
        mandatory: false,
        options: ["--days"],
        description: "Number of days to analyze (default: 7)",
      },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        const days = ctx.args.days || 7;
        const result = await admin.auditSecurity(days);

        Logger.info("Security Audit Report");
        console.log("=".repeat(50));
        console.log(`Analysis period: ${days} days`);
        console.log(`Total operations: ${result.totalOperations}`);
        console.log(`Admin operations: ${result.adminOperations}`);
        console.log(`Failed operations: ${result.failedOperations}`);

        if (result.suspiciousActivity.length > 0) {
          Logger.warning("Suspicious activity detected:");
          result.suspiciousActivity.forEach((activity: any, index: number) => {
            console.log(
              `  ${index + 1}. ${activity.description} at ${new Date(activity.timestamp).toLocaleString()}`,
            );
          });
        }

        return result;
      });
    },
  },
];
