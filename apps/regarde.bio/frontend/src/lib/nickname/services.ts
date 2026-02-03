import { type GetValidKeyFunction } from "../account/useRegistrationToken";
import { registerNickname } from "../api/nickname";

import { isPlaceholderNickname } from "./utils";

// Handles server-side nickname registration/update
// Separated from React hooks for easier testing and error handling

export async function registerNicknameWithServer({
  nickname,
  accountId,
  oldNickname,
  getRegardeTokenAuth,
}: {
  nickname: string;
  accountId: string;
  oldNickname?: string;
  getRegardeTokenAuth: GetValidKeyFunction;
}): Promise<void> {
  // Only send oldNickname if it's a real nickname (not placeholder)
  // This determines server behavior: new registration vs swap/update
  const shouldSendOldNickname = oldNickname && !isPlaceholderNickname(oldNickname);

  await registerNickname(
    {
      nickname,
      jazzAccountID: accountId,
      oldNickname: shouldSendOldNickname ? oldNickname : undefined,
    },
    getRegardeTokenAuth,
  );
}
