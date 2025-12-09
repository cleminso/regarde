import { co, z } from "jazz-tools";

/**
 * # Nickname Registry Module - User Identity Management
 *
 * ## Purpose
 * - Maintains nickname-to-account ID mappings
 * - Provides reverse lookup from accounts to nicknames
 * - Tracks all nickname operations with audit trail
 * - Implements nickname reservations and policies
 *
 * ## Registry Structure
 * - Forward registry: nickname → Jazz Account ID
 * - Reverse registry: Jazz Account ID → nickname
 * - Reserved nicknames: protected names with metadata
 * - Audit log: complete change history
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
 *
 * - reservedAt - Unix timestamp when the reservation was created
 *
 * - reason - Optional explanation for the reservation
 *
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
 *
 * - timestamp - Unix timestamp of the change
 *
 * - jazzAccountId - Jazz Account ID affected by the change
 *
 * - oldNickname - Previous nickname (for update operations)
 *
 * - newNickname - New nickname (for add/update operations)
 *
 * - changedBy - ID of the entity that made the change
 *
 * - source - System that initiated the change
 *
 * - action - Type of registry operation
 *
 * - reservationReason - Reason for reservation (if applicable)
 *
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
 * Root schema containing all registry components
 *
 * - registry - Forward nickname-to-account mapping
 * - reverseRegistry - Reverse account-to-nickname mapping
 * - auditLog - Complete change history
 * - reservedNicknames - Protected names with metadata
 */
export const RegistryWorkerAccountRoot = co.map({
  registry: NicknameRegistryCoRecord,
  reverseRegistry: ReverseNicknameRegistryCoRecord,
  auditLog: RegistryAuditLog,
  reservedNicknames: ReservedNicknamesRegistry,
});
export type RegistryWorkerAccountRoot = co.loaded<
  typeof RegistryWorkerAccountRoot
>;

const EmptyProfile = co.profile();

/**
 * Worker account that manages the nickname registry and serves public requests
 *
 * Worker account that manages all nickname operations while maintaining
 * audit trails and enforcing reservation policies.
 *
 * - profile - Empty placeholder (worker account has no personal profile)
 *
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
    } catch (e) {
      console.log("EnsureLoaded Root failed, fallback", account, e);

      if (!account.root.$isLoaded) {
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: NicknameRegistryCoRecord.create({}),
          reverseRegistry: ReverseNicknameRegistryCoRecord.create({}),
          auditLog: RegistryAuditLog.create([]),
          reservedNicknames: ReservedNicknamesRegistry.create({}),
        });
        account.$jazz.set("root", newRoot);

        console.log(
          "Root created with NicknameRegistry, ReverseNicknameRegistry, AuditLog, and ReservedNicknames in worker account since it was missing.",
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
      }
    }
  });

export type RegistryWorkerAccount = co.loaded<typeof RegistryWorkerAccount>;
