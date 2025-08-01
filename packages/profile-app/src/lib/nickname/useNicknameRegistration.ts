import { useClerk } from '@clerk/clerk-react';
import { useIsAuthenticated } from 'jazz-tools/react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { useMyAccount } from '../account/useMyAccount';
import { useOnboardingData } from '../account/useOnboardingData';
import { useRegistrationKey } from '../account/useRegistrationKey';
import { createNicknameUrl } from '../utils';
import { registerNicknameWithServer } from './services';
import { useNicknameValidation } from './useNicknameValidation';

const PENDING_NICKNAME_KEY = 'pending-nickname';

export function useNicknameRegistration() {
  const navigate = useNavigate();
  const clerk = useClerk();
  const isAuthenticated = useIsAuthenticated();

  const { accountId, isAccountReady } = useMyAccount();
  const { currentNickname } = useOnboardingData();
  const { getValidKey } = useRegistrationKey();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = useNicknameValidation(
    isAuthenticated ? currentNickname : '',
  );

  // Handle post-authentication registration
  useEffect(() => {
    const pendingNickname = localStorage.getItem(PENDING_NICKNAME_KEY);

    if (
      isAuthenticated &&
      pendingNickname &&
      accountId &&
      isAccountReady &&
      !currentNickname
    ) {
      const completeRegistration = async () => {
        setIsProcessing(true);

        try {
          await registerNicknameWithServer({
            nickname: pendingNickname,
            accountId,
            oldNickname: currentNickname,
            getRegistrationKey: getValidKey,
          });

          localStorage.removeItem(PENDING_NICKNAME_KEY);
          navigate(createNicknameUrl(pendingNickname, '/edit'));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Registration failed');
          localStorage.removeItem(PENDING_NICKNAME_KEY);
        } finally {
          setIsProcessing(false);
        }
      };

      completeRegistration();
    }
  }, [
    isAuthenticated,
    accountId,
    isAccountReady,
    currentNickname,
    navigate,
    getValidKey,
  ]);

  const register = useCallback(
    async (nickname: string) => {
      if (!nickname) return;

      setIsProcessing(true);
      setError(null);

      try {
        if (!isAuthenticated) {
          localStorage.setItem(PENDING_NICKNAME_KEY, nickname);
          clerk.openSignIn({});
          setIsProcessing(false);
          return;
        }

        if (!accountId || !isAccountReady) {
          setError('Account data loading. Please try again in a moment.');
          setIsProcessing(false);
          return;
        }

        await registerNicknameWithServer({
          nickname,
          accountId,
          oldNickname: currentNickname,
          getRegistrationKey: getValidKey,
        });

        navigate(createNicknameUrl(nickname, '/edit'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed');
        localStorage.removeItem(PENDING_NICKNAME_KEY);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      isAuthenticated,
      accountId,
      isAccountReady,
      currentNickname,
      getValidKey,
      navigate,
      clerk,
    ],
  );

  const view = useCallback((nickname: string) => {
    if (nickname) {
      window.open(`${window.location.origin}/${nickname}`, '_blank');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    ...validation,
    isProcessing,
    error,
    register,
    view,
    clearError,
  };
}
