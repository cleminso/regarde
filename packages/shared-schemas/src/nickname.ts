import { co, Loaded, z } from "jazz-tools";

export const UserHandle = co.map({
  nickname: z.string(),
  registeredAt: z.number(),
  lastModified: z.number(),
  isActive: z.boolean(),
});

export type UserHandle = z.infer<typeof UserHandle>;

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
