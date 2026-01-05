import { co, z } from "jazz-tools";
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
export type TNicknameRegistry = co.loaded<typeof NicknameRegistryCoRecord>;

/**
 * Reverse mapping from Jazz Account IDs to nicknames
 */
export const ReverseNicknameRegistryCoRecord = co.record(
  z.string(),
  z.string(),
);
export type TReverseNicknameRegistry = co.loaded<
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
export type TReservationEntry = co.loaded<typeof ReservationEntry>;

export const ReservedNicknamesRegistry = co.record(
  z.string(),
  ReservationEntry,
);
export type TReservedNicknamesRegistry = co.loaded<
  typeof ReservedNicknamesRegistry
>;
