import { GetValidKeyFunction } from '../account/useRegistrationKey';
import { registerNickname } from '../api/nickname';
import { isPlaceholderNickname } from './utils';

// Handles server-side nickname registration/update
// Separated from React hooks for easier testing and error handling

export async function registerNicknameWithServer({
  nickname,
  accountId,
  oldNickname,
  getRegistrationKey,
}: {
  nickname: string;
  accountId: string;
  oldNickname?: string;
  getRegistrationKey: GetValidKeyFunction;
}): Promise<void> {
  // Only send oldNickname if it's a real nickname (not placeholder)
  // This determines server behavior: new registration vs swap/update
  const shouldSendOldNickname =
    oldNickname && !isPlaceholderNickname(oldNickname);

  await registerNickname(
    {
      nickname,
      jazzAccountID: accountId,
      oldNickname: shouldSendOldNickname ? oldNickname : undefined,
    },
    getRegistrationKey,
  );
}
