import { co, z } from "jazz-tools";

/** Forward mapping: nicknames to Jazz account IDs. */
export const NicknameRegistryCoRecord = co.record(z.string(), z.string());

/** Loaded NicknameRegistry instance */
export type TNicknameRegistry = co.loaded<typeof NicknameRegistryCoRecord>;

/** Reverse mapping: Jazz account IDs to nicknames */
export const ReverseNicknameRegistryCoRecord = co.record(z.string(), z.string());

/** Loaded ReverseNicknameRegistry instance */
export type TReverseNicknameRegistry = co.loaded<typeof ReverseNicknameRegistryCoRecord>;

/**
 * Reserved nickname with metadata.
 *
 * @schema
 * - reservedBy: User/admin who reserved it
 * - reservedAt: Unix timestamp of reservation
 * - reason: Optional explanation
 * - category: admin, brand, system, offensive, or custom
 */
export const ReservationEntry = co.map({
  reservedBy: z.string(),
  reservedAt: z.number(),
  reason: z.optional(z.string()),
  category: z.enum(["admin", "brand", "system", "offensive", "custom"]),
});

/** Loaded ReservationEntry instance */
export type TReservationEntry = co.loaded<typeof ReservationEntry>;

/** All reserved nicknames, indexed by nickname */
export const ReservedNicknamesRegistry = co.record(z.string(), ReservationEntry);

/** Loaded ReservedNicknamesRegistry instance */
export type TReservedNicknamesRegistry = co.loaded<typeof ReservedNicknamesRegistry>;
