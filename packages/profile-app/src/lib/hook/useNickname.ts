import { Loaded } from 'jazz-tools';
import { useCallback, useState } from 'react';

import { checkNicknameAvailability, registerNickname } from '../nicknameApi';
import { OnboardingProfile } from '../schema';

type NicknameStatus = 'empty' | 'available' | 'taken' | 'invalid';

type UseNicknameValidationProps = {
  profile: Loaded<typeof OnboardingProfile> | undefined;
};

export function useNicknameValidation({ profile }: UseNicknameValidationProps) {
  const [status, setStatus] = useState<NicknameStatus>('empty');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isValidFormat = (nickname: string): boolean => {
    const trimmed = nickname.trim();
    return (
      trimmed.length >= 1 &&
      trimmed.length <= 20 &&
      /^[a-zA-Z0-9_-]+$/.test(trimmed)
    );
  };

  const checkAvailability = useCallback(
    async (nickname: string) => {
      const trimmed = nickname.trim();

      if (!trimmed) {
        setStatus('empty');
        setErrorMessage('');
        return;
      }

      if (!isValidFormat(trimmed)) {
        setStatus('invalid');
        setErrorMessage('Nickname must be alphanumerical, dashes are allowed.');
        return;
      }

      if (profile?.nickname === trimmed) {
        setStatus('available');
        setErrorMessage('');
        return;
      }

      try {
        const result = await checkNicknameAvailability(trimmed);
        setStatus(result.available ? 'available' : 'taken');
        setErrorMessage('');
      } catch (error) {
        setStatus('invalid');
        setErrorMessage('Failed to check availability');
      }
    },
    [profile],
  );

  return { status, errorMessage, checkAvailability };
}

export async function registerProfileNickname({
  accountId,
  profile,
  nickname,
  oldNickname,
}: {
  accountId: string;
  profile: Loaded<typeof OnboardingProfile>;
  nickname: string;
  oldNickname: string | undefined;
}) {
  const trimmedNickname = nickname.trim();

  if (!accountId || !profile) {
    throw new Error('Authentication context missing for registration');
  }

  if (trimmedNickname !== oldNickname) {
    const availabilityCheck = await checkNicknameAvailability(trimmedNickname);
    if (!availabilityCheck.available) {
      throw new Error(`Nickname "${trimmedNickname}" is no longer available.`);
    }
  }

  await registerNickname({
    nickname: trimmedNickname,
    jazzAccountID: accountId,
    oldNickname: oldNickname,
  });

  profile.nickname = trimmedNickname || undefined;
}
