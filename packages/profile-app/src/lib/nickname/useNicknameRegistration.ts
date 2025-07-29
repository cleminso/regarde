// packages/profile-app/src/lib/nickname/useNicknameRegistration.ts
import { useClerk } from '@clerk/clerk-react';
import { useIsAuthenticated } from 'jazz-tools/react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { useMyAccount } from '../account/useMyAccount';
import { useRegistrationKey } from '../account/useRegistrationKey';
import { createNicknameUrl } from '../utils';
import { registerNicknameWithServer } from './services';
import { useNicknameValidation } from './useNicknameValidation';

export function useNicknameRegistration() {
  console.log('🔥 useNicknameRegistration hook called');

  const navigate = useNavigate();
  const clerk = useClerk();
  const isAuthenticated = useIsAuthenticated();

  // ✅ ALWAYS call the same hooks in the same order
  const { accountId, isAccountReady, currentNickname } = useMyAccount();
  const { getValidKey } = useRegistrationKey();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingNickname, setPendingNickname] = useState<string>('');
  const [authAttempted, setAuthAttempted] = useState(false);

  // ✅ Always call validation - use appropriate nickname based on auth state
  const validation = useNicknameValidation(
    isAuthenticated ? currentNickname : '',
  );

  // Handle post-authentication registration for pending nicknames
  useEffect(() => {
    console.log('🔄 useEffect triggered - checking pending registration');
    console.log('authAttempted:', authAttempted);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('pendingNickname:', pendingNickname);
    console.log('accountId:', accountId);
    console.log('isAccountReady:', isAccountReady);

    if (
      authAttempted &&
      isAuthenticated &&
      pendingNickname &&
      accountId &&
      isAccountReady
    ) {
      const completeRegistration = async () => {
        try {
          console.log(
            '✅ Completing pending registration for:',
            pendingNickname,
          );

          await registerNicknameWithServer({
            nickname: pendingNickname,
            accountId,
            oldNickname: currentNickname,
            getRegistrationKey: getValidKey,
          });

          console.log(
            '✅ Registration completed, redirecting to:',
            createNicknameUrl(pendingNickname, '/edit'),
          );
          navigate(createNicknameUrl(pendingNickname, '/edit'));
        } catch (err) {
          console.error('❌ Registration error in useEffect:', err);
          setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
          setIsProcessing(false);
          setAuthAttempted(false);
          setPendingNickname('');
        }
      };

      completeRegistration();
    }
  }, [
    authAttempted,
    isAuthenticated,
    pendingNickname,
    accountId,
    isAccountReady,
    currentNickname,
    getValidKey,
    navigate,
  ]);

  const register = useCallback(
    async (nickname: string) => {
      if (!nickname) return;

      console.log('=== REGISTER FLOW START ===');
      console.log('Nickname:', nickname);
      console.log('isAuthenticated:', isAuthenticated);
      console.log('accountId:', accountId);
      console.log('isAccountReady:', isAccountReady);

      setIsProcessing(true);
      setError(null);

      try {
        if (!isAuthenticated) {
          // ✅ User not authenticated - trigger auth
          console.log(
            '🔐 User not authenticated, triggering auth for:',
            nickname,
          );
          setPendingNickname(nickname);
          setAuthAttempted(true);
          clerk.openSignIn({});
        } else if (accountId && isAccountReady) {
          // ✅ User authenticated and account ready - register immediately
          console.log('🚀 Account ready, registering immediately');

          await registerNicknameWithServer({
            nickname,
            accountId,
            oldNickname: currentNickname,
            getRegistrationKey: getValidKey,
          });

          console.log(
            '✅ Registration completed successfully, redirecting to:',
            createNicknameUrl(nickname, '/edit'),
          );
          navigate(createNicknameUrl(nickname, '/edit'));
          setIsProcessing(false);
        } else {
          // ✅ Authenticated but account not ready
          console.log('⏳ Account not ready yet');
          setError('Account data loading. Please try again in a moment.');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('❌ Registration error:', err);
        setError(err instanceof Error ? err.message : 'Registration failed');
        setIsProcessing(false);
        setAuthAttempted(false);
        setPendingNickname('');
      }

      console.log('=== REGISTER FLOW END ===');
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
