import { co } from "jazz-tools";
import { z } from "zod";

import { AppRegistry, AppsByUserRecord, AllRegistryAppsSchema } from "./app";
import { RegistryAuditLog } from "./audit";
import {
  NicknameRegistryCoRecord,
  ReverseNicknameRegistryCoRecord,
  ReservedNicknamesRegistry,
} from "./nickname";

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
export type TRegistryWorkerAccountRoot = co.loaded<typeof RegistryWorkerAccountRoot>;

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
    // Migration logic - implementation detail
    try {
      const loadedAccount = await account.$jazz.ensureLoaded({
        resolve: {
          root: true,
        },
      });

      console.dir("Loaded via ensureLoaded", loadedAccount);

      if (!loadedAccount.root.$isLoaded) {
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: NicknameRegistryCoRecord.create({}),
          reverseRegistry: ReverseNicknameRegistryCoRecord.create({}),
          auditLog: RegistryAuditLog.create([]),
          reservedNicknames: ReservedNicknamesRegistry.create({}),
          apps: AppRegistry.create({
            appsByUser: AppsByUserRecord.create({}),
            apps: AllRegistryAppsSchema.create({}),
            metadata: {},
            registeredAt: Date.now(),
            version: 1,
          }),
          processedProviderEvents: ProcessedProviderEvents.create({}),
        });
        loadedAccount.$jazz.set("root", newRoot);
        console.log("Root created after ensureLoaded since it was missing.");
        return;
      }

      console.debug("Root done");

      if (loadedAccount.root.registry === undefined) {
        const newRegistry = NicknameRegistryCoRecord.create({});
        loadedAccount.root.$jazz.set("registry", newRegistry);
        console.log("NicknameRegistry created in worker account root.");
      }

      console.debug("Root registry done");

      if (loadedAccount.root.reverseRegistry === undefined) {
        const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({});
        loadedAccount.root.$jazz.set("reverseRegistry", newReverseRegistry);
        console.log("ReverseNicknameRegistry created in worker account root.");
      }

      console.debug("Root reverse registry done");

      if (loadedAccount.root.auditLog === undefined) {
        const newAuditLog = RegistryAuditLog.create([]);
        loadedAccount.root.$jazz.set("auditLog", newAuditLog);
        console.log("AuditLog created in worker account root.");
      }

      console.debug("Root auditLog done");

      if (loadedAccount.root.reservedNicknames === undefined) {
        const newReservedNicknames = ReservedNicknamesRegistry.create({});
        loadedAccount.root.$jazz.set("reservedNicknames", newReservedNicknames);
        console.log("ReservedNicknames created in worker account root.");
      }

      console.debug("Root reservedNicknames done");

      if (loadedAccount.root.apps === undefined) {
        const newAppsRegistry = AppRegistry.create({
          appsByUser: AppsByUserRecord.create({}),
          apps: AllRegistryAppsSchema.create({}),
          metadata: {},
          registeredAt: Date.now(),
          version: 1,
        });
        loadedAccount.root.$jazz.set("apps", newAppsRegistry);
        console.log("AppRegistry created in worker account root.");
      }

      if (loadedAccount.root.processedProviderEvents === undefined) {
        const newProcessedProviderEvents = ProcessedProviderEvents.create({});
        loadedAccount.root.$jazz.set("processedProviderEvents", newProcessedProviderEvents);
        console.log("ProcessedProviderEvents created in worker account root.");
      }

      console.debug("Root apps done");
    } catch (e) {
      console.log("EnsureLoaded Root failed, fallback", account, e);

      const accountRootExists = account.root !== undefined && account.root !== null;
      const rootLoaded = accountRootExists === true && account.root.$isLoaded === true;

      if (rootLoaded === false) {
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: NicknameRegistryCoRecord.create({}),
          reverseRegistry: ReverseNicknameRegistryCoRecord.create({}),
          auditLog: RegistryAuditLog.create([]),
          reservedNicknames: ReservedNicknamesRegistry.create({}),
          apps: AppRegistry.create({
            appsByUser: AppsByUserRecord.create({}),
            apps: AllRegistryAppsSchema.create({}),
            metadata: {},
            registeredAt: Date.now(),
            version: 1,
          }),
          processedProviderEvents: ProcessedProviderEvents.create({}),
        });
        account.$jazz.set("root", newRoot);

        console.log(
          "Root created with NicknameRegistry, ReverseNicknameRegistry, AuditLog, ReservedNicknames, and AppRegistry in worker account since it was missing.",
        );
      } else {
        if (account.root.registry === undefined) {
          const newRegistry = NicknameRegistryCoRecord.create({});
          account.root.$jazz.set("registry", newRegistry);
          console.log("NicknameRegistry created in existing root during fallback.");
        }
        if (account.root.reverseRegistry === undefined) {
          const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({});
          account.root.$jazz.set("reverseRegistry", newReverseRegistry);
          console.log("ReverseNicknameRegistry created in existing root during fallback.");
        }
        if (account.root.auditLog === undefined) {
          const newAuditLog = RegistryAuditLog.create([]);
          account.root.$jazz.set("auditLog", newAuditLog);
          console.log("AuditLog created in existing root during fallback.");
        }
        if (account.root.reservedNicknames === undefined) {
          const newReservedNicknames = ReservedNicknamesRegistry.create({});
          account.root.$jazz.set("reservedNicknames", newReservedNicknames);
          console.log("ReservedNicknames created in existing root during fallback.");
        }
        if (account.root.apps === undefined) {
          const newAppsRegistry = AppRegistry.create({
            appsByUser: AppsByUserRecord.create({}),
            apps: AllRegistryAppsSchema.create({}),
            metadata: {},
            registeredAt: Date.now(),
            version: 1,
          });
          account.root.$jazz.set("apps", newAppsRegistry);
          console.log("AppRegistry created in existing root during fallback.");
        }

        if (account.root.processedProviderEvents === undefined) {
          const newProcessedProviderEvents = ProcessedProviderEvents.create({});
          account.root.$jazz.set("processedProviderEvents", newProcessedProviderEvents);
          console.log("ProcessedProviderEvents created in existing root during fallback.");
        }
      }
    }
  });

/** Loaded RegistryWorkerAccount instance */
export type TRegistryWorkerAccount = co.loaded<typeof RegistryWorkerAccount>;
