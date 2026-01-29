import { co } from "jazz-tools";
import { z } from "zod";

import { useLogging } from "#core/logger";
import { AppRegistry, AppsByUserRecord, AllRegistryAppsSchema } from "./app";
import { RegistryAuditLog } from "./audit";
import {
  NicknameRegistryCoRecord,
  ReverseNicknameRegistryCoRecord,
  ReservedNicknamesRegistry,
} from "./nickname";

const logger = useLogging({ module: __filename });

/**
 * Idempotency index for webhook events.
 *
 * Key format: `LS_{providerIdentifier}`
 * Value: PaymentEvent CoValue ID
 *
 * Example: `LS_89b36d62-4f5c-4353-853f-0c769d0535c8`
 */
export const ProcessedProviderEvents = co.record(z.string(), z.string());

/**
 * Root schema containing all registry components.
 *
 * @schema
 * - `registry`: Nickname to account ID mapping
 * - `reverseRegistry`: Account ID to nickname mapping
 * - `auditLog`: Complete change history
 * - `reservedNicknames`: Protected names with metadata
 * - `apps`: Application registry
 * - `processedProviderEvents`: Webhook event deduplication
 */
export const RegistryWorkerAccountRoot = co.map({
  registry: NicknameRegistryCoRecord,
  reverseRegistry: ReverseNicknameRegistryCoRecord,
  auditLog: RegistryAuditLog,
  reservedNicknames: ReservedNicknamesRegistry,
  apps: AppRegistry,
  processedProviderEvents: ProcessedProviderEvents,
});

/** Loaded RegistryWorkerAccountRoot instance */
export type TRegistryWorkerAccountRoot = co.loaded<
  typeof RegistryWorkerAccountRoot
>;

const EmptyProfile = co.profile();

/**
 * Worker account managing nickname registry.
 *
 * Handles all nickname operations with audit trails.
 * Profile is empty placeholder (worker has no personal profile).
 *
 * @schema
 * - `profile`: Empty placeholder
 * - `root`: Registry data structures
 */
export const RegistryWorkerAccount = co
  .account({
    profile: EmptyProfile,
    root: RegistryWorkerAccountRoot,
  })
  .withMigration(async (account) => {
    try {
      const loadedAccount = await account.$jazz.ensureLoaded({
        resolve: {
          root: true,
        },
      });

      if (loadedAccount.root.$isLoaded === false) {
        // Create all nested CoValues first
        const newRegistry = NicknameRegistryCoRecord.create({});
        const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({});
        const newAuditLog = RegistryAuditLog.create([]);
        const newReservedNicknames = ReservedNicknamesRegistry.create({});

        const appsByUser = AppsByUserRecord.create({});
        const allApps = AllRegistryAppsSchema.create({});
        const newAppsRegistry = AppRegistry.create({
          appsByUser: appsByUser,
          apps: allApps,
          metadata: {},
          registeredAt: Date.now(),
          version: 1,
        });

        const newProcessedProviderEvents = ProcessedProviderEvents.create({});

        // Create root with all children and set in one operation
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: newRegistry,
          reverseRegistry: newReverseRegistry,
          auditLog: newAuditLog,
          reservedNicknames: newReservedNicknames,
          apps: newAppsRegistry,
          processedProviderEvents: newProcessedProviderEvents,
        });

        loadedAccount.$jazz.set("root", newRoot);
        await newRoot.$jazz.waitForSync();
        await loadedAccount.$jazz.waitForSync();

        logger.info({
          message: "Root created with all registries after ensureLoaded",
          data: { accountId: loadedAccount.$jazz.id },
        });
        return;
      }

      // Check and create individual fields if missing
      const hasRegistry = loadedAccount.root.$jazz.has("registry") === true;
      if (hasRegistry === false) {
        const newRegistry = NicknameRegistryCoRecord.create({});
        loadedAccount.root.$jazz.set("registry", newRegistry);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "NicknameRegistry created in worker account root",
          data: {},
        });
      }

      const hasReverseRegistry =
        loadedAccount.root.$jazz.has("reverseRegistry") === true;
      if (hasReverseRegistry === false) {
        const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({});
        loadedAccount.root.$jazz.set("reverseRegistry", newReverseRegistry);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "ReverseNicknameRegistry created in worker account root",
          data: {},
        });
      }

      const hasAuditLog = loadedAccount.root.$jazz.has("auditLog") === true;
      if (hasAuditLog === false) {
        const newAuditLog = RegistryAuditLog.create([]);
        loadedAccount.root.$jazz.set("auditLog", newAuditLog);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "AuditLog created in worker account root",
          data: {},
        });
      }

      const hasReservedNicknames =
        loadedAccount.root.$jazz.has("reservedNicknames") === true;
      if (hasReservedNicknames === false) {
        const newReservedNicknames = ReservedNicknamesRegistry.create({});
        loadedAccount.root.$jazz.set("reservedNicknames", newReservedNicknames);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "ReservedNicknames created in worker account root",
          data: {},
        });
      }

      const hasApps = loadedAccount.root.$jazz.has("apps") === true;
      if (hasApps === false) {
        const appsByUser = AppsByUserRecord.create({});
        const allApps = AllRegistryAppsSchema.create({});
        const newAppsRegistry = AppRegistry.create({
          appsByUser: appsByUser,
          apps: allApps,
          metadata: {},
          registeredAt: Date.now(),
          version: 1,
        });

        loadedAccount.root.$jazz.set("apps", newAppsRegistry);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "AppRegistry created in worker account root",
          data: {},
        });
      }

      const hasProcessedProviderEvents =
        loadedAccount.root.$jazz.has("processedProviderEvents") === true;
      if (hasProcessedProviderEvents === false) {
        const newProcessedProviderEvents = ProcessedProviderEvents.create({});
        loadedAccount.root.$jazz.set(
          "processedProviderEvents",
          newProcessedProviderEvents,
        );
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "ProcessedProviderEvents created in worker account root",
          data: {},
        });
      }
    } catch (error) {
      logger.error({
        message: "EnsureLoaded Root failed, using fallback migration",
        data: { error: error instanceof Error ? error.message : String(error) },
      });

      if (account.root === null || account.root.$isLoaded === false) {
        // Create all nested CoValues first
        const newRegistry = NicknameRegistryCoRecord.create({});
        const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({});
        const newAuditLog = RegistryAuditLog.create([]);
        const newReservedNicknames = ReservedNicknamesRegistry.create({});

        const appsByUser = AppsByUserRecord.create({});
        const allApps = AllRegistryAppsSchema.create({});
        const newAppsRegistry = AppRegistry.create({
          appsByUser: appsByUser,
          apps: allApps,
          metadata: {},
          registeredAt: Date.now(),
          version: 1,
        });

        const newProcessedProviderEvents = ProcessedProviderEvents.create({});

        // Create root with all children and set in one operation
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: newRegistry,
          reverseRegistry: newReverseRegistry,
          auditLog: newAuditLog,
          reservedNicknames: newReservedNicknames,
          apps: newAppsRegistry,
          processedProviderEvents: newProcessedProviderEvents,
        });

        account.$jazz.set("root", newRoot);
        await newRoot.$jazz.waitForSync();
        await account.$jazz.waitForSync();

        logger.info({
          message: "Root created with all registries in fallback migration",
          data: {},
        });
      } else {
        // Check and create individual fields with sync waits
        const hasRegistry = account.root.$jazz.has("registry") === true;
        if (hasRegistry === false) {
          const newRegistry = NicknameRegistryCoRecord.create({});
          account.root.$jazz.set("registry", newRegistry);
          await account.root.$jazz.waitForSync();
          logger.info({
            message:
              "NicknameRegistry created in existing root during fallback",
            data: {},
          });
        }

        const hasReverseRegistry =
          account.root.$jazz.has("reverseRegistry") === true;
        if (hasReverseRegistry === false) {
          const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({});
          account.root.$jazz.set("reverseRegistry", newReverseRegistry);
          await account.root.$jazz.waitForSync();
          logger.info({
            message:
              "ReverseNicknameRegistry created in existing root during fallback",
            data: {},
          });
        }

        const hasAuditLog = account.root.$jazz.has("auditLog") === true;
        if (hasAuditLog === false) {
          const newAuditLog = RegistryAuditLog.create([]);
          account.root.$jazz.set("auditLog", newAuditLog);
          await account.root.$jazz.waitForSync();
          logger.info({
            message: "AuditLog created in existing root during fallback",
            data: {},
          });
        }

        const hasReservedNicknames =
          account.root.$jazz.has("reservedNicknames") === true;
        if (hasReservedNicknames === false) {
          const newReservedNicknames = ReservedNicknamesRegistry.create({});
          account.root.$jazz.set("reservedNicknames", newReservedNicknames);
          await account.root.$jazz.waitForSync();
          logger.info({
            message:
              "ReservedNicknames created in existing root during fallback",
            data: {},
          });
        }

        const hasApps = account.root.$jazz.has("apps") === true;
        if (hasApps === false) {
          const appsByUser = AppsByUserRecord.create({});
          const allApps = AllRegistryAppsSchema.create({});
          const newAppsRegistry = AppRegistry.create({
            appsByUser: appsByUser,
            apps: allApps,
            metadata: {},
            registeredAt: Date.now(),
            version: 1,
          });

          account.root.$jazz.set("apps", newAppsRegistry);
          await account.root.$jazz.waitForSync();
          logger.info({
            message: "AppRegistry created in existing root during fallback",
            data: {},
          });
        }

        const hasProcessedProviderEvents =
          account.root.$jazz.has("processedProviderEvents") === true;
        if (hasProcessedProviderEvents === false) {
          const newProcessedProviderEvents = ProcessedProviderEvents.create({});
          account.root.$jazz.set(
            "processedProviderEvents",
            newProcessedProviderEvents,
          );
          await account.root.$jazz.waitForSync();
          logger.info({
            message:
              "ProcessedProviderEvents created in existing root during fallback",
            data: {},
          });
        }
      }
    }
  });

/** Loaded RegistryWorkerAccount instance */
export type TRegistryWorkerAccount = co.loaded<typeof RegistryWorkerAccount>;
