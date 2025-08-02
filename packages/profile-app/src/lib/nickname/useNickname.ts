import { useCallback, useState } from 'react';

import { checkNicknameAvailability } from '../api/nickname';
import { useOnboarding } from '../onboarding/useOnboarding';
import { isValidNicknameFormat } from './utils';

type ValidationStatus =
  | 'empty'
  | 'invalid'
  | 'checking'
  | 'available'
  | 'taken';

export function useNickname() {
  const { currentNickname } = useOnboarding();

  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>('empty');
  const [validationError, setValidationError] = useState('');

  const checkAvailability = useCallback(
    async (nickname: string) => {
      if (!nickname) {
        setValidationStatus('empty');
        setValidationError('');
        return;
      }

      if (!isValidNicknameFormat(nickname)) {
        setValidationStatus('invalid');
        setValidationError(
          'Nickname must be 3-20 characters, alphanumeric with dashes/underscores only.',
        );
        return;
      }

      if (currentNickname && nickname === currentNickname) {
        setValidationStatus('available');
        setValidationError('');
        return;
      }

      setValidationStatus('checking');
      try {
        const result = await checkNicknameAvailability(nickname);
        setValidationStatus(result.available ? 'available' : 'taken');
        setValidationError('');
      } catch (error) {
        setValidationStatus('invalid');
        setValidationError('Failed to check availability. Please try again.');
      }
    },
    [currentNickname],
  );

  const view = useCallback((nickname: string) => {
    if (nickname) {
      window.open(`${window.location.origin}/${nickname}`, '_blank');
    }
  }, []);

  return {
    currentNickname,

    validationStatus,
    validationError,
    checkAvailability,

    view,
  };
}
