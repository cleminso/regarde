import { useClerk } from '@clerk/clerk-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import { checkNicknameAvailability } from '../api/nickname';
import { createNicknameUrl } from '../utils';
import { registerNicknameWithServer } from './services';
import { useOnboardingAccount } from '../account/useAccount';
import { isValidNicknameFormat } from './utils';

type ValidationStatus = 'empty' | 'invalid' | 'checking' | 'available' | 'taken';

const PENDING_NICKNAME_KEY = 'pending-nickname';

// Unified nickname management
export function useNickname() {
  const navigate = useNavigate();
  const clerk = useClerk();
  const account = useOnboardingAccount();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('empty');
  const [validationError, setValidationError] = useState('');

  // Single validation function
  const checkAvailability = useCallback(
    async (nickname: string) => {
      if (!nickname) {
        setValidationStatus('empty');
        setValidationError('');
        return;
      }

      if (!isValidNicknameFormat(nickname)) {
        setValidationStatus('invalid');
        setValidationError('Nickname must be 3-20 characters, alphanumeric with dashes/underscores only.');
        return;
      }

      // Check if this is the user's current nickname
      if (account.currentNickname && nickname === account.currentNickname) {
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
    [account.currentNickname],
  );

  // Single registration function (handles both new + update)
  const register = useCallback(
    async (nickname: string) => {
      if (!nickname) return;

      setIsProcessing(true);
      setError(null);

      try {
        if (!account.isAuthenticated) {
          localStorage.setItem(PENDING_NICKNAME_KEY, nickname);
          clerk.openSignIn({});
          setIsProcessing(false);
          return;
        }

        if (!account.accountId || !account.isAccountReady) {
          setError('Account data loading. Please try again in a moment.');
          setIsProcessing(false);
          return;
        }

        const isUpdate = Boolean(account.currentNickname);

        await registerNicknameWithServer({
          nickname,
          accountId: account.accountId,
          oldNickname: isUpdate ? account.currentNickname : undefined,
          getRegistrationKey: account.getValidKey,
        });

        if (!isUpdate) {
          navigate(createNicknameUrl(nickname, '/edit'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Operation failed');
      } finally {
        setIsProcessing(false);
      }
    },
    [account, navigate, clerk],
  );

  // View profile function
  const view = useCallback((nickname: string) => {
    if (nickname) {
      window.open(`${window.location.origin}/${nickname}`, '_blank');
    }
  }, []);

  return {
    // State from account
    ...account,

    // Validation
    validationStatus,
    validationError,
    checkAvailability,

    // Actions
    register,
    view,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}
