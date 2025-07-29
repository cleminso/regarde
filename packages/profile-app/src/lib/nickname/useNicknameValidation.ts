import { useCallback, useState } from 'react';

import { checkNicknameAvailability } from '../api/nickname';
import { isValidNicknameFormat } from '../nickname/utils';

type NicknameStatus = 'empty' | 'available' | 'taken' | 'invalid';

// Handles nickname validation (format + availability)
// Accepts current nickname to avoid unnecessary API calls when unchanged

export function useNicknameValidation(currentNickname?: string) {
  const [status, setStatus] = useState<NicknameStatus>('empty');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const checkAvailability = useCallback(
    async (nickname: string) => {
      if (!nickname) {
        setStatus('empty');
        setErrorMessage('');
        return;
      }

      if (!isValidNicknameFormat(nickname)) {
        setStatus('invalid');
        setErrorMessage(
          'Nickname must be 3-20 characters, alphanumeric with dashes/underscores only.',
        );
        return;
      }

      if (currentNickname && nickname === currentNickname) {
        setStatus('available');
        setErrorMessage('');
        return;
      }

      try {
        const result = await checkNicknameAvailability(nickname);
        setStatus(result.available ? 'available' : 'taken');
        setErrorMessage('');
      } catch (error) {
        setStatus('invalid');
        setErrorMessage('Failed to check availability. Please try again.');
      }
    },
    [currentNickname],
  );

  return {
    status,
    errorMessage,
    checkAvailability,
    isValid: status === 'available',
  };
}
