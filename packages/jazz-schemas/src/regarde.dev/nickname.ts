import { co, Loaded, z } from "jazz-tools";

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

    if (!userHandle.$jazz.owner.getRoleOf("co_zoppoxWWJaHYKPgSgUkuCCXQX21")) {
      console.log("Adding worker account to UserHandle");
      co.group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21")
        .then((jazzProfileWorkerGroup) => {
          if (!jazzProfileWorkerGroup) {
            console.debug("No public group");
            return;
          }

          userHandle.$jazz.owner.addMember(jazzProfileWorkerGroup, "writer");

          console.log("Regarde.dev Account added to UserHandle");
        });
    }
  });

export type UserHandle = co.loaded<typeof UserHandle>;

export function setNicknameFromRegistry(
  nicknameData: Loaded<typeof UserHandle>,
  registeredNickname: string,
): void {
  nicknameData.$jazz.set("nickname", registeredNickname);
  nicknameData.$jazz.set("isActive", true);
  nicknameData.$jazz.set("lastModified", Date.now());
}

export function deactivate(nicknameData: Loaded<typeof UserHandle>): void {
  nicknameData.$jazz.set("isActive", false);
  nicknameData.$jazz.set("lastModified", Date.now());
}
