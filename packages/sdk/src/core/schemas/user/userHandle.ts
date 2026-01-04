/**
 * # User Handle Profile - Human-readable Identity for Jazz Accounts
 *
 * ## Purpose
 * - Creates human-readable identities linked to a Jazz account IDs
 * - Applies nickname validation rules to ensure consistency
 * - Tracks user activity and account status for admin operations
 *
 * ## Flow
 * 1. User creates UserHandle using `UserHandle.create()` during registration
 * 2. Nickname validated against schema rules
 * 3. Account status tracked via isActive flag (allows temporary deactivation)
 * 4. Profile updates reflected in lastModified timestamps (for audit trail)
 *
 * ## Migration
 * - Added isActive field to allow graceful deactivation without data loss
 * - Added timestamps to track profile lifecycle (registration and modification)
 *
 * ## Why We Manage This Data
 * - **Soft delete capability**: isActive allows deactivation without removing nickname from registry
 * - **Accountability**: timestamps track when profiles were created/modified
 * - **Transition handling**: status flags help manage nickname changes without conflicts
 * - **Audit trail**: lastModified provides visibility into profile evolution
 */
import { co, z } from "jazz-tools";

/**
 * Schema for user profile linked to Jazz account IDs
 *
 * - nickname - User's unique identifier with validation rules
 *
 * - registeredAt - Unix timestamp when the profile was first created
 *
 * - lastModified - Unix timestamp of the most recent profile update
 *
 * - isActive - Whether the account is currently active (false when deactivating/changing)
 */
export const UserHandle = co
  .map({
    nickname: z
      .string()
      .min(3, "Nickname must be at least 3 characters")
      .max(20, "Nickname must be no more than 20 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Nickname can only contain letters, numbers, underscores, and hyphens",
      ),
    registeredAt: z.number(),
    lastModified: z.number(),
    isActive: z.boolean(),
  })
  .withMigration((userHandle) => {
    if (!userHandle.$jazz.has("isActive")) {
      userHandle.$jazz.set("isActive", false);
    }

    if (!userHandle.$jazz.has("registeredAt")) {
      userHandle.$jazz.set("registeredAt", Date.now());
    }

    if (!userHandle.$jazz.has("lastModified")) {
      userHandle.$jazz.set("lastModified", Date.now());
    }
  });

/**
 * Type alias for a loaded UserHandle instance
 */
export type TUserHandleLoaded = co.loaded<typeof UserHandle>;

/**
 * Sets nickname on UserHandle after successful registry verification
 *
 * @param nicknameData - The loaded UserHandle that will receive nickname
 * @param registeredNickname - The verified nickname from registry
 */
export function setNicknameFromRegistry(
  nicknameData: TUserHandleLoaded,
  registeredNickname: string,
): void {
  nicknameData.$jazz.set("nickname", registeredNickname);
  nicknameData.$jazz.set("isActive", true);
  nicknameData.$jazz.set("lastModified", Date.now());
}

/**
 * Deactivates UserHandle by setting isActive to false and updating timestamp
 *
 * @param nicknameData - The UserHandle to deactivate (nickname preserved in registry)
 */
export function deactivate(nicknameData: TUserHandleLoaded): void {
  nicknameData.$jazz.set("isActive", false);
  nicknameData.$jazz.set("lastModified", Date.now());
}
