import { co, Loaded, z } from "jazz-tools";

export const UserHandle = co.map({
  nickname: z.string()
    .min(3, "Nickname must be at least 3 characters")
    .max(20, "Nickname must be no more than 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Nickname can only contain letters, numbers, underscores, and hyphens"),
  registeredAt: z.number(),
  lastModified: z.number(),
  isActive: z.boolean(),
});

export type UserHandle = co.loaded<typeof UserHandle>;

export function setNicknameFromRegistry(
  nicknameData: Loaded<typeof UserHandle>,
  registeredNickname: string,
): void {
  nicknameData.nickname = registeredNickname;
  nicknameData.isActive = true;
  nicknameData.lastModified = Date.now();
}

export function deactivate(nicknameData: Loaded<typeof UserHandle>): void {
  nicknameData.isActive = false;
  nicknameData.lastModified = Date.now();
}
