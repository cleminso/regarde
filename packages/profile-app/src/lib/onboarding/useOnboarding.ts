import { useClerk } from '@clerk/clerk-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useMyAccount } from '../account/useMyAccount';
import { useRegistrationKey } from '../account/useRegistrationKey';
import { checkNicknameAvailability } from '../api/nickname';
import { registerNicknameWithServer } from '../nickname/services';
import { isValidNicknameFormat } from '../nickname/utils';
import { createNicknameUrl } from '../utils';

const PENDING_NICKNAME_KEY = 'pending-nickname';

type ValidationStatus =
  | 'empty'
  | 'invalid'
  | 'checking'
  | 'available'
  | 'taken'
  | 'reserved';

// Add a global flag to prevent multiple registrations
let globalRegistrationInProgress = false;

export function useOnboarding() {
  const navigate = useNavigate();
  const clerk = useClerk();

  const { jazzAppProfile, account: me, isAuthenticated } = useMyAccount();

  const { getValidKey, isAccountReady } = useRegistrationKey();

  // Registration state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const registrationInProgress = useRef(false);
  const hasProcessedPendingNickname = useRef(false);

  // Validation state
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>('empty');
  const [validationError, setValidationError] = useState('');

  // Single source of truth for current nickname
  const currentNickname = jazzAppProfile?.userHandle?.nickname || '';
  const isNicknameActive = jazzAppProfile?.userHandle?.isActive || false;

  // Validation logic
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

      // Check if this is the user's current nickname
      if (currentNickname && nickname === currentNickname) {
        setValidationStatus('available');
        setValidationError('');
        return;
      }

      setValidationStatus('checking');
      try {
        const result = await checkNicknameAvailability(nickname);

        if (result.available) {
          setValidationStatus('available');
          setValidationError('');
        } else if (result.reserved) {
          setValidationStatus('reserved');
          const categoryText = result.reservationCategory
            ? ` (${result.reservationCategory})`
            : '';
          const reasonText = result.reservationReason
            ? `: ${result.reservationReason}`
            : '';
          setValidationError(
            `This nickname is reserved${categoryText}${reasonText}`,
          );
        } else {
          setValidationStatus('taken');
          setValidationError('');
        }
      } catch (error) {
        setValidationStatus('invalid');
        setValidationError('Failed to check availability. Please try again.');
      }
    },
    [currentNickname],
  );

  // Handle post-auth registration - with global lock
  useEffect(() => {
    if (!isAuthenticated || !me?.id || !isAccountReady) return;
    if (
      registrationInProgress.current ||
      hasProcessedPendingNickname.current ||
      globalRegistrationInProgress
    )
      return;

    const pendingNickname = localStorage.getItem(PENDING_NICKNAME_KEY);
    if (!pendingNickname || currentNickname) return;

    // Global and local locks
    globalRegistrationInProgress = true;
    hasProcessedPendingNickname.current = true;
    registrationInProgress.current = true;

    const completeRegistration = async () => {
      setIsProcessing(true);
      setError(null);

      try {
        await registerNicknameWithServer({
          nickname: pendingNickname,
          accountId: me.id,
          getRegistrationKey: getValidKey,
        });

        localStorage.removeItem(PENDING_NICKNAME_KEY);
        navigate(createNicknameUrl(pendingNickname, '/edit'));
      } catch (err) {
        if (
          !(err instanceof Error) ||
          !err.message?.includes('already has a nickname')
        ) {
          setError(err instanceof Error ? err.message : 'Registration failed');
          hasProcessedPendingNickname.current = false;
        }
        localStorage.removeItem(PENDING_NICKNAME_KEY);
      } finally {
        setIsProcessing(false);
        registrationInProgress.current = false;
        globalRegistrationInProgress = false;
      }
    };

    completeRegistration();
  }, [
    isAuthenticated,
    me?.id,
    isAccountReady,
    currentNickname,
    navigate,
    getValidKey,
  ]);

  // Reset processing flag when user gets a nickname
  useEffect(() => {
    if (currentNickname && isNicknameActive) {
      registrationInProgress.current = false;
      hasProcessedPendingNickname.current = false;
      setIsProcessing(false);
    }
  }, [currentNickname, isNicknameActive]);

  // Register nickname
  const register = useCallback(
    async (nickname: string) => {
      if (!nickname || isProcessing || registrationInProgress.current) return;

      registrationInProgress.current = true;
      setIsProcessing(true);
      setError(null);

      try {
        if (!isAuthenticated) {
          localStorage.setItem(PENDING_NICKNAME_KEY, nickname);
          clerk.openSignIn({});
          registrationInProgress.current = false;
          setIsProcessing(false);
          return;
        }

        if (!me?.id || !isAccountReady) {
          setError('Account not ready. Please try again.');
          registrationInProgress.current = false;
          setIsProcessing(false);
          return;
        }

        await registerNicknameWithServer({
          nickname,
          accountId: me.id,
          oldNickname: currentNickname,
          getRegistrationKey: getValidKey,
        });

        // Wait a bit for the onboarding data to sync
        setTimeout(() => {
          navigate(createNicknameUrl(nickname, '/edit'));
          registrationInProgress.current = false;
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed');
        localStorage.removeItem(PENDING_NICKNAME_KEY);
        registrationInProgress.current = false;
        setIsProcessing(false);
      }
    },
    [
      isAuthenticated,
      me?.id,
      isAccountReady,
      currentNickname,
      clerk,
      navigate,
      isProcessing,
      getValidKey,
    ],
  );

  // Update nickname (for existing users)
  const update = useCallback(
    async (nickname: string) => {
      if (
        !nickname ||
        nickname === currentNickname ||
        isProcessing ||
        registrationInProgress.current
      )
        return;
      if (!jazzAppProfile?.userHandle) {
        setError(
          'Onboarding data not available. Please refresh and try again.',
        );
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        await registerNicknameWithServer({
          nickname,
          accountId: me!.id,
          oldNickname: currentNickname,
          getRegistrationKey: getValidKey,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      me?.id,
      jazzAppProfile?.userHandle?.id,
      currentNickname,
      isProcessing,
      getValidKey,
    ],
  );

  // View profile
  const view = useCallback((nickname: string) => {
    if (nickname) {
      window.open(`${window.location.origin}/${nickname}`, '_blank');
    }
  }, []);

  return {
    // State
    currentNickname,
    isNicknameActive,
    isProcessing,
    error,

    // Validation
    validationStatus,
    validationError,
    checkAvailability,

    // Actions
    register,
    update,
    view,
    clearError: useCallback(() => setError(null), []),

    // Status
    isAuthenticated,
    isAccountReady: Boolean(me?.profile && isAccountReady),
    hasExistingNickname: Boolean(currentNickname && isNicknameActive),

    // Account info
    accountId: me?.id,
    profile: me?.profile,
  };
}
