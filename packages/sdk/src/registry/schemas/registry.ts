import { co, z } from "jazz-tools";
import { App } from "../../payments";
/**
 * # Registry Module - Nickname and App Management
 *
 * ## Purpose
 * - Maintains nickname-to-account ID mappings
 * - Provides reverse lookup from accounts to nicknames
 * - Tracks all nickname operations with audit trail
 * - Implements nickname reservations and policies
 * - Manages application registrations and metadata
 * - Tracks payment webhook configuration status
 *
 * ## Registry Structure
 * - Forward registry: nickname → Jazz Account ID
 * - Reverse registry: Jazz Account ID → nickname
 * - Reserved nicknames: protected names with metadata
 * - Audit log: complete change history
 * - Apps registry: application definitions and metadata
 */

/**
 * Forward mapping from nicknames to Jazz Account IDs
 */
export const NicknameRegistryCoRecord = co.record(z.string(), z.string());
export type NicknameRegistry = co.loaded<typeof NicknameRegistryCoRecord>;

/**
 * Reverse mapping from Jazz Account IDs to nicknames
 */
export const ReverseNicknameRegistryCoRecord = co.record(
  z.string(),
  z.string(),
);
export type ReverseNicknameRegistry = co.loaded<
  typeof ReverseNicknameRegistryCoRecord
>;

/**
 * Information about a reserved nickname
 *
 * - reservedBy - ID of the user/admin who reserved the nickname
 * - reservedAt - Unix timestamp when the reservation was created
 * - reason - Optional explanation for the reservation
 * - category - Reservation type for policy enforcement
 */
export const ReservationEntry = co.map({
  reservedBy: z.string(),
  reservedAt: z.number(),
  reason: z.optional(z.string()),
  category: z.enum(["admin", "brand", "system", "offensive", "custom"]),
});
export type ReservationEntry = co.loaded<typeof ReservationEntry>;

export const ReservedNicknamesRegistry = co.record(
  z.string(),
  ReservationEntry,
);
export type ReservedNicknamesRegistry = co.loaded<
  typeof ReservedNicknamesRegistry
>;

/**
 * Audit record for registry change tracking
 *
 * - monotonicId - Sequential ID for ordering audit entries
 * - timestamp - Unix timestamp of the change
 * - jazzAccountId - Jazz Account ID affected by the change
 * - oldNickname - Previous nickname (for update operations)
 * - newNickname - New nickname (for add/update operations)
 * - changedBy - ID of the entity that made the change
 * - source - System that initiated the change
 * - action - Type of registry operation
 * - reservationReason - Reason for reservation (if applicable)
 * - reservationCategory - Reservation type (if applicable)
 */
export const RegistryAuditEntryCoMap = co.map({
  monotonicId: z.string(),
  timestamp: z.number(),
  jazzAccountId: z.string(),
  oldNickname: z.optional(z.string()),
  newNickname: z.optional(z.string()),
  changedBy: z.string(),
  source: z.enum(["admin-cli", "user-app", "worker"]),
  action: z.enum(["add", "update", "remove", "reserve", "unreserve"]),
  reservationReason: z.optional(z.string()),
  reservationCategory: z.optional(
    z.enum(["admin", "brand", "system", "offensive", "custom"]),
  ),
});
export type RegistryAuditEntry = co.loaded<typeof RegistryAuditEntryCoMap>;

/**
 * Sequential list of all registry audit entries
 */
export const RegistryAuditLog = co.list(RegistryAuditEntryCoMap);
export type RegistryAuditLog = co.loaded<typeof RegistryAuditLog>;

/**
 * Represents an application controlled by the app owner
 *
 * - name - Human-readable application name
 * - description - Application description and purpose
 * - ownerAccountId - Jazz Account ID of the app owner
 * - paymentProvider - Payment provider handling subscriptions
 * - providerAppId - Provider-specific application identifier
 * - isEnabled - Can this app accept payments?
 * - createdAt - Unix timestamp when app was registered
 * - metadata - Additional app configuration data
 * - webhookSecret -
 * - payments - When last successful payment received
 */

/**
 * Registry-controlled metadata for an application
 *
 * - appId - Reference to the App CoValue
 * - isVerified - Whether app is verified and accepting subscriptions
 * - hasAccess - Does user have access right now?
 * - webhookConfigured - Whether webhook is set up for payment processing
 * - createdAt - When Regarde created this metadata record
 */
export const RegistryAppMetadata = co.map({
  get app() {
    return App;
  },
  isVerified: z.boolean().default(true),
  hasAccess: z.boolean(),
  webhookConfigured: z.boolean().default(false),
  createdAt: z.number(),
  version: z.number().default(1),
});
export type RegistryAppMetadata = co.loaded<typeof RegistryAppMetadata>;

/**
 * Collection of all apps in the registry
 */
export const AllRegistryAppsSchema = co.record(z.string(), RegistryAppMetadata);
export type TAllRegistryAppsSchema = co.loaded<typeof AllRegistryAppsSchema>;

/**
 * Collection of apps grouped by user
 */
export const AppsByUserRecord = co.record(
  z.string(),
  co.list(RegistryAppMetadata),
);
export type AppsByUserRecord = co.loaded<typeof AppsByUserRecord>;

/**
 * Registry of all applications and their metadata
 *
 * - apps - Mapping of app IDs to app definitions owned by developers
 * - metadata - Registry-controlled metadata for each app
 * - registeredAt - Unix timestamp when registry was created
 * - version - Schema version for migration tracking
 */
export const AppRegistry = co.map({
  // All apps for 1 user
  appsByUser: AppsByUserRecord,
  // All apps in registry, 1 per AppId
  apps: AllRegistryAppsSchema,
  metadata: co.record(z.string(), z.string()),
  registeredAt: z.number(),
  version: z.number().default(1),
});
export type AppRegistry = co.loaded<typeof AppRegistry>;

/**
 * Root schema containing all registry components
 *
 * - registry - Forward nickname-to-account mapping
 * - reverseRegistry - Reverse account-to-nickname mapping
 * - auditLog - Complete change history
 * - reservedNicknames - Protected names with metadata
 * - apps - Application registry for subscription management
 */
export const RegistryWorkerAccountRoot = co.map({
  registry: NicknameRegistryCoRecord,
  reverseRegistry: ReverseNicknameRegistryCoRecord,
  auditLog: RegistryAuditLog,
  reservedNicknames: ReservedNicknamesRegistry,
  apps: AppRegistry,
});
export type RegistryWorkerAccountRoot = co.loaded<
  typeof RegistryWorkerAccountRoot
>;

const EmptyProfile = co.profile();

/**
 * Worker account that manages the nickname registry and serves public requests.
 *
 * Worker account that manages all nickname operations while maintaining
 * audit trails and enforcing reservation policies.
 * - profile - Empty placeholder (worker account has no personal profile)
 * - root - Schema containing all registry data structures
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

      console.debug("Root apps done");
    } catch (e) {
      console.log("EnsureLoaded Root failed, fallback", account, e);

      if (!account.root.$isLoaded) {
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
        });
        account.$jazz.set("root", newRoot);

        console.log(
          "Root created with NicknameRegistry, ReverseNicknameRegistry, AuditLog, ReservedNicknames, and AppRegistry in worker account since it was missing.",
        );
      } else {
        if (account.root.registry === undefined) {
          const newRegistry = NicknameRegistryCoRecord.create({});
          account.root.$jazz.set("registry", newRegistry);
          console.log(
            "NicknameRegistry created in existing root during fallback.",
          );
        }
        if (account.root.reverseRegistry === undefined) {
          const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({});
          account.root.$jazz.set("reverseRegistry", newReverseRegistry);
          console.log(
            "ReverseNicknameRegistry created in existing root during fallback.",
          );
        }
        if (account.root.auditLog === undefined) {
          const newAuditLog = RegistryAuditLog.create([]);
          account.root.$jazz.set("auditLog", newAuditLog);
          console.log("AuditLog created in existing root during fallback.");
        }
        if (account.root.reservedNicknames === undefined) {
          const newReservedNicknames = ReservedNicknamesRegistry.create({});
          account.root.$jazz.set("reservedNicknames", newReservedNicknames);
          console.log(
            "ReservedNicknames created in existing root during fallback.",
          );
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
      }
    }
  });

export type RegistryWorkerAccount = co.loaded<typeof RegistryWorkerAccount>;
