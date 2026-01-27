import { co, z } from "jazz-tools";

/**
 * Audit record for registry changes.
 *
 * Fields:
 * - `monotonicId`: Sequential ID for ordering audit entries
 * - `timestamp`: Unix timestamp of change
 * - `jazzAccountId`: Account affected by change
 * - `oldNickname`: Previous nickname (for updates)
 * - `newNickname`: New nickname (for add/update)
 * - `changedBy`: Entity that made the change
 * - `source`: admin-cli, user-app, or worker
 * - `action`: add, update, remove, reserve, or unreserve
 * - `reservationReason`: Reason for reservation (if applicable)
 * - `reservationCategory`: Reservation type (if applicable)
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

/** Loaded RegistryAuditEntry instance */
export type TRegistryAuditEntry = co.loaded<typeof RegistryAuditEntryCoMap>;

/** Sequential list of all registry audit entries */
export const RegistryAuditLog = co.list(RegistryAuditEntryCoMap);

/** Loaded RegistryAuditLog instance */
export type TRegistryAuditLog = co.loaded<typeof RegistryAuditLog>;
