import { co, z } from "jazz-tools";

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
export type TRegistryAuditEntry = co.loaded<typeof RegistryAuditEntryCoMap>;

/**
 * Sequential list of all registry audit entries
 */
export const RegistryAuditLog = co.list(RegistryAuditEntryCoMap);
export type TRegistryAuditLog = co.loaded<typeof RegistryAuditLog>;
