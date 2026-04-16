import { co, z } from "jazz-tools";

import { useLogging } from "#core/logger";

import { RegardeAppRegistry, RegardeAppsByUserRecord, AllRegardeRegistryAppsSchema } from "./app";
import { RegistryAuditLog } from "./audit";
import {
  NicknameRegistryCoRecord,
  ReverseNicknameRegistryCoRecord,
  ReservedNicknamesRegistry,
} from "./nickname";

const logger = useLogging({ module: import.meta.filename });

/**
 * Idempotency index for webhook events.
 *
 * Key format: `LS_{providerIdentifier}`
 * Value: PaymentEvent CoValue ID
 *
 * Example: `LS_89b36d62-4f5c-4353-853f-0c769d0535c8`
 */
export const ProcessedProviderEvents = co.record(z.string(), z.string());

export const RegistryWebhookDeliveryOutcome = z.enum([
  "processed",
  "duplicate",
  "unsupported",
  "context_error",
  "signature_error",
  "processing_error",
]);

export const RegistryWebhookDelivery = z.object({
  appId: z.string(),
  ownerAccountId: z.string(),
  webhookId: z.string(),
  provider: z.enum(["stripe", "polar"]),
  environment: z.enum(["sandbox", "production"]),
  providerEventId: z.string(),
  parsedEventType: z.string(),
  receivedAt: z.number(),
  httpStatusCode: z.string(),
  error: z.optional(z.string()),
  regardeEventId: z.optional(z.string()),
  deliveryOutcome: RegistryWebhookDeliveryOutcome,
  isRetry: z.boolean(),
  retryCount: z.number(),
});

export type TRegistryWebhookDelivery = z.infer<typeof RegistryWebhookDelivery>;

export const RegistryWebhookAttemptCountByProviderEvent = co.record(z.string(), z.number());
export const RegistryWebhookAttemptCounts = co.record(
  z.string(),
  RegistryWebhookAttemptCountByProviderEvent,
);

/**
 * Global webhook delivery projection for worker-side analytics.
 */
export const RegistryWebhookDeliveriesFeed = co.feed(RegistryWebhookDelivery);

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
 * - `webhookDeliveries`: Global webhook delivery
 * - `webhookAttemptCounts`: Per-webhook attempt counters by provider event ID
 */
export const RegistryWorkerAccountRoot = co.map({
  registry: NicknameRegistryCoRecord,
  reverseRegistry: ReverseNicknameRegistryCoRecord,
  auditLog: RegistryAuditLog,
  reservedNicknames: ReservedNicknamesRegistry,
  apps: RegardeAppRegistry,
  processedProviderEvents: ProcessedProviderEvents,
  webhookDeliveries: RegistryWebhookDeliveriesFeed,
  webhookAttemptCounts: RegistryWebhookAttemptCounts,
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
    try {
      const loadedAccount = await account.$jazz.ensureLoaded({
        resolve: {
          root: true,
        },
      });

      const isRootLoaded = loadedAccount.root.$isLoaded === true;
      if (isRootLoaded === false) {
        // Create all nested CoValues first
        const newRegistry = NicknameRegistryCoRecord.create({}, { owner: account });
        await newRegistry.$jazz.waitForSync();
        const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({}, { owner: account });
        await newReverseRegistry.$jazz.waitForSync();
        const newAuditLog = RegistryAuditLog.create([], { owner: account });
        await newAuditLog.$jazz.waitForSync();
        const newReservedNicknames = ReservedNicknamesRegistry.create({}, { owner: account });
        await newReservedNicknames.$jazz.waitForSync();

        const appsByUser = RegardeAppsByUserRecord.create({}, { owner: account });
        await appsByUser.$jazz.waitForSync();
        const allApps = AllRegardeRegistryAppsSchema.create({}, { owner: account });
        await allApps.$jazz.waitForSync();
        const newAppsRegistry = RegardeAppRegistry.create({
          appsByUser: appsByUser,
          apps: allApps,
          metadata: {},
          registeredAt: Date.now(),
          version: 1,
        }, { owner: account });
        await newAppsRegistry.$jazz.waitForSync();

        const newProcessedProviderEvents = ProcessedProviderEvents.create({}, { owner: account });
        await newProcessedProviderEvents.$jazz.waitForSync();
        const newWebhookDeliveries = RegistryWebhookDeliveriesFeed.create([], { owner: account });
        await newWebhookDeliveries.$jazz.waitForSync();
        const newWebhookAttemptCounts = RegistryWebhookAttemptCounts.create({}, { owner: account });
        await newWebhookAttemptCounts.$jazz.waitForSync();

        // Create root with all children and set in one operation
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: newRegistry,
          reverseRegistry: newReverseRegistry,
          auditLog: newAuditLog,
          reservedNicknames: newReservedNicknames,
          apps: newAppsRegistry,
          processedProviderEvents: newProcessedProviderEvents,
          webhookDeliveries: newWebhookDeliveries,
          webhookAttemptCounts: newWebhookAttemptCounts,
        }, { owner: account });
        await newRoot.$jazz.waitForSync();

        loadedAccount.$jazz.set("root", newRoot);
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
        const newRegistry = NicknameRegistryCoRecord.create({}, { owner: account });
        loadedAccount.root.$jazz.set("registry", newRegistry);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "NicknameRegistry created in worker account root",
          data: {},
        });
      }

      const hasReverseRegistry = loadedAccount.root.$jazz.has("reverseRegistry") === true;
      if (hasReverseRegistry === false) {
        const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({}, { owner: account });
        loadedAccount.root.$jazz.set("reverseRegistry", newReverseRegistry);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "ReverseNicknameRegistry created in worker account root",
          data: {},
        });
      }

      const hasAuditLog = loadedAccount.root.$jazz.has("auditLog") === true;
      if (hasAuditLog === false) {
        const newAuditLog = RegistryAuditLog.create([], { owner: account });
        loadedAccount.root.$jazz.set("auditLog", newAuditLog);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "AuditLog created in worker account root",
          data: {},
        });
      }

      const hasReservedNicknames = loadedAccount.root.$jazz.has("reservedNicknames") === true;
      if (hasReservedNicknames === false) {
        const newReservedNicknames = ReservedNicknamesRegistry.create({}, { owner: account });
        loadedAccount.root.$jazz.set("reservedNicknames", newReservedNicknames);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "ReservedNicknames created in worker account root",
          data: {},
        });
      }

      const hasApps = loadedAccount.root.$jazz.has("apps") === true;
      const appsValue = loadedAccount.root.apps;
      const isAppsLoaded =
        appsValue !== null && appsValue !== undefined && appsValue.$isLoaded === true;

      if (hasApps === false || isAppsLoaded === false) {
        const appsByUser = RegardeAppsByUserRecord.create({}, { owner: account });
        await appsByUser.$jazz.waitForSync();
        const allApps = AllRegardeRegistryAppsSchema.create({}, { owner: account });
        await allApps.$jazz.waitForSync();
        const newAppsRegistry = RegardeAppRegistry.create({
          appsByUser: appsByUser,
          apps: allApps,
          metadata: {},
          registeredAt: Date.now(),
          version: 1,
        }, { owner: account });
        await newAppsRegistry.$jazz.waitForSync();

        loadedAccount.root.$jazz.set("apps", newAppsRegistry);
        await loadedAccount.root.$jazz.waitForSync();
        await loadedAccount.$jazz.waitForSync();

        logger.info({
          message: "AppRegistry created in worker account root",
          data: { appRegistryId: newAppsRegistry.$jazz.id },
        });
      }

      const hasProcessedProviderEvents =
        loadedAccount.root.$jazz.has("processedProviderEvents") === true;
      if (hasProcessedProviderEvents === false) {
        const newProcessedProviderEvents = ProcessedProviderEvents.create({}, { owner: account });
        loadedAccount.root.$jazz.set("processedProviderEvents", newProcessedProviderEvents);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "ProcessedProviderEvents created in worker account root",
          data: {},
        });
      }

      const hasWebhookDeliveries = loadedAccount.root.$jazz.has("webhookDeliveries") === true;
      if (hasWebhookDeliveries === false) {
        const newWebhookDeliveries = RegistryWebhookDeliveriesFeed.create([], { owner: account });
        loadedAccount.root.$jazz.set("webhookDeliveries", newWebhookDeliveries);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "WebhookDeliveries created in worker account root",
          data: {},
        });
      }

      const hasWebhookAttemptCounts = loadedAccount.root.$jazz.has("webhookAttemptCounts") === true;
      if (hasWebhookAttemptCounts === false) {
        const newWebhookAttemptCounts = RegistryWebhookAttemptCounts.create({}, { owner: account });
        loadedAccount.root.$jazz.set("webhookAttemptCounts", newWebhookAttemptCounts);
        await loadedAccount.root.$jazz.waitForSync();
        logger.info({
          message: "WebhookAttemptCounts created in worker account root",
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
        const newRegistry = NicknameRegistryCoRecord.create({}, { owner: account });
        await newRegistry.$jazz.waitForSync();
        const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({}, { owner: account });
        await newReverseRegistry.$jazz.waitForSync();
        const newAuditLog = RegistryAuditLog.create([], { owner: account });
        await newAuditLog.$jazz.waitForSync();
        const newReservedNicknames = ReservedNicknamesRegistry.create({}, { owner: account });
        await newReservedNicknames.$jazz.waitForSync();

        const appsByUser = RegardeAppsByUserRecord.create({}, { owner: account });
        await appsByUser.$jazz.waitForSync();
        const allApps = AllRegardeRegistryAppsSchema.create({}, { owner: account });
        await allApps.$jazz.waitForSync();
        const newAppsRegistry = RegardeAppRegistry.create({
          appsByUser: appsByUser,
          apps: allApps,
          metadata: {},
          registeredAt: Date.now(),
          version: 1,
        }, { owner: account });
        await newAppsRegistry.$jazz.waitForSync();

        const newProcessedProviderEvents = ProcessedProviderEvents.create({}, { owner: account });
        await newProcessedProviderEvents.$jazz.waitForSync();
        const newWebhookDeliveries = RegistryWebhookDeliveriesFeed.create([], { owner: account });
        await newWebhookDeliveries.$jazz.waitForSync();
        const newWebhookAttemptCounts = RegistryWebhookAttemptCounts.create({}, { owner: account });
        await newWebhookAttemptCounts.$jazz.waitForSync();

        // Create root with all children and set in one operation
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: newRegistry,
          reverseRegistry: newReverseRegistry,
          auditLog: newAuditLog,
          reservedNicknames: newReservedNicknames,
          apps: newAppsRegistry,
          processedProviderEvents: newProcessedProviderEvents,
          webhookDeliveries: newWebhookDeliveries,
          webhookAttemptCounts: newWebhookAttemptCounts,
        }, { owner: account });
        await newRoot.$jazz.waitForSync();

        account.$jazz.set("root", newRoot);
        await account.$jazz.waitForSync();

        logger.info({
          message: "Root created with all registries in fallback migration",
          data: {},
        });
      } else {
        // Check and create individual fields with sync waits
        const hasRegistry = account.root.$jazz.has("registry") === true;
        if (hasRegistry === false) {
          const newRegistry = NicknameRegistryCoRecord.create({}, { owner: account });
          account.root.$jazz.set("registry", newRegistry);
          await account.root.$jazz.waitForSync();
          logger.info({
            message: "NicknameRegistry created in existing root during fallback",
            data: {},
          });
        }

        const hasReverseRegistry = account.root.$jazz.has("reverseRegistry") === true;
        if (hasReverseRegistry === false) {
          const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({}, { owner: account });
          account.root.$jazz.set("reverseRegistry", newReverseRegistry);
          await account.root.$jazz.waitForSync();
          logger.info({
            message: "ReverseNicknameRegistry created in existing root during fallback",
            data: {},
          });
        }

        const hasAuditLog = account.root.$jazz.has("auditLog") === true;
        if (hasAuditLog === false) {
          const newAuditLog = RegistryAuditLog.create([], { owner: account });
          account.root.$jazz.set("auditLog", newAuditLog);
          await account.root.$jazz.waitForSync();
          logger.info({
            message: "AuditLog created in existing root during fallback",
            data: {},
          });
        }

        const hasReservedNicknames = account.root.$jazz.has("reservedNicknames") === true;
        if (hasReservedNicknames === false) {
          const newReservedNicknames = ReservedNicknamesRegistry.create({}, { owner: account });
          account.root.$jazz.set("reservedNicknames", newReservedNicknames);
          await account.root.$jazz.waitForSync();
          logger.info({
            message: "ReservedNicknames created in existing root during fallback",
            data: {},
          });
        }

        const hasApps = account.root.$jazz.has("apps") === true;
        if (hasApps === false) {
          const appsByUser = RegardeAppsByUserRecord.create({}, { owner: account });
          await appsByUser.$jazz.waitForSync();
          const allApps = AllRegardeRegistryAppsSchema.create({}, { owner: account });
          await allApps.$jazz.waitForSync();
          const newAppsRegistry = RegardeAppRegistry.create({
            appsByUser: appsByUser,
            apps: allApps,
            metadata: {},
            registeredAt: Date.now(),
            version: 1,
          }, { owner: account });
          await newAppsRegistry.$jazz.waitForSync();

          account.root.$jazz.set("apps", newAppsRegistry);
          await account.root.$jazz.waitForSync();
          await account.$jazz.waitForSync();

          logger.info({
            message: "AppRegistry created in existing root during fallback",
            data: { appRegistryId: newAppsRegistry.$jazz.id },
          });
        }

        const hasProcessedProviderEvents =
          account.root.$jazz.has("processedProviderEvents") === true;
        if (hasProcessedProviderEvents === false) {
          const newProcessedProviderEvents = ProcessedProviderEvents.create({}, { owner: account });
          account.root.$jazz.set("processedProviderEvents", newProcessedProviderEvents);
          await account.root.$jazz.waitForSync();
          logger.info({
            message: "ProcessedProviderEvents created in existing root during fallback",
            data: {},
          });
        }

        const hasWebhookDeliveries = account.root.$jazz.has("webhookDeliveries") === true;
        if (hasWebhookDeliveries === false) {
          const newWebhookDeliveries = RegistryWebhookDeliveriesFeed.create([], { owner: account });
          account.root.$jazz.set("webhookDeliveries", newWebhookDeliveries);
          await account.root.$jazz.waitForSync();
          logger.info({
            message: "WebhookDeliveries created in existing root during fallback",
            data: {},
          });
        }

        const hasWebhookAttemptCounts = account.root.$jazz.has("webhookAttemptCounts") === true;
        if (hasWebhookAttemptCounts === false) {
          const newWebhookAttemptCounts = RegistryWebhookAttemptCounts.create({}, { owner: account });
          account.root.$jazz.set("webhookAttemptCounts", newWebhookAttemptCounts);
          await account.root.$jazz.waitForSync();
          logger.info({
            message: "WebhookAttemptCounts created in existing root during fallback",
            data: {},
          });
        }
      }
    }
  });

/** Loaded RegistryWorkerAccount instance */
export type TRegistryWorkerAccount = co.loaded<typeof RegistryWorkerAccount>;
