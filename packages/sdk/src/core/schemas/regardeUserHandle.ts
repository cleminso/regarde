import { co, z } from "jazz-tools";

/**
 * User profile with nickname.
 *
 * Links Jazz account ID to human-readable nickname with validation.
 * Tracks profile status and modification history.
 *
 * @schema
 * - `nickname`: 3-20 chars, alphanumeric + underscore + hyphen
 * - `registeredAt`: Registration timestamp
 * - `lastModified`: Last update timestamp
 * - `isActive`: Whether profile is active
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
    const hasIsActive = userHandle.$jazz.has("isActive") === true;
    if (hasIsActive === false) {
      userHandle.$jazz.set("isActive", false);
    }

    const hasRegisteredAt = userHandle.$jazz.has("registeredAt") === true;
    if (hasRegisteredAt === false) {
      userHandle.$jazz.set("registeredAt", Date.now());
    }

    const hasLastModified = userHandle.$jazz.has("lastModified") === true;
    if (hasLastModified === false) {
      userHandle.$jazz.set("lastModified", Date.now());
    }
  });

/** Loaded UserHandle instance */
export type TUserHandleLoaded = co.loaded<typeof UserHandle>;

/**
 * Sets verified nickname on UserHandle.
 *
 * Called after successful registry registration.
 *
 * @param nicknameData - Loaded UserHandle to update
 * @param registeredNickname - Verified nickname from registry
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
 * Deactivates UserHandle while preserving nickname.
 *
 * @param nicknameData - UserHandle to deactivate
 */
export function deactivate(nicknameData: TUserHandleLoaded): void {
  nicknameData.$jazz.set("isActive", false);
  nicknameData.$jazz.set("lastModified", Date.now());
}
