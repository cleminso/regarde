import { co, Loaded, z } from "jazz-tools";

export const OnboardingNickname = co.map({
  nickname: z.string(),
  registeredAt: z.number(),
  lastModified: z.number(),
  isActive: z.boolean(),
});

export type OnboardingNickname = z.infer<typeof OnboardingNickname>;

export function setNicknameFromRegistry(
  nicknameData: Loaded<typeof OnboardingNickname>,
  registeredNickname: string,
): void {
  nicknameData.nickname = registeredNickname;
  nicknameData.isActive = true;
  nicknameData.lastModified = Date.now();
}

export function deactivate(
  nicknameData: Loaded<typeof OnboardingNickname>,
): void {
  nicknameData.isActive = false;
  nicknameData.lastModified = Date.now();
}
