import { useClerk } from '@clerk/clerk-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useMyRegardeAccount } from '../account/useMyRegardeAccount';
import { useRegardeAuth } from '../account/useRegistrationToken';
import { checkNicknameAvailability } from '../api/nickname';
import { registerNicknameWithServer } from '../nickname/services';
import { isValidNicknameFormat } from '../nickname/utils';
import { createNicknameUrl } from '../utils/utils';

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

type UseClerkOnboardingOptions = {
  customAuthCallback?: (nickname: string) => void;
};

export function useClerkOnboarding(options: UseClerkOnboardingOptions = {}) {
  const navigate = useNavigate();
  const clerk = useClerk();

  const { regardeProfile, account, isAuthenticated } = useMyRegardeAccount();

  const { getValidKey, isAccountReady } = useRegardeAuth();

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
  const currentNickname = regardeProfile?.userHandle?.nickname || '';
  const isNicknameActive = regardeProfile?.userHandle?.isActive || false;

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
    if (!isAuthenticated || !account?.$jazz.id) return;

    if (!isAccountReady) return;

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
        // Check availability before registering
        const availabilityResult = await checkNicknameAvailability(pendingNickname);

        if (!availabilityResult.available) {
          if (availabilityResult.reserved) {
            const categoryText = availabilityResult.reservationCategory
              ? ` (${availabilityResult.reservationCategory})`
              : '';
            const reasonText = availabilityResult.reservationReason
              ? `: ${availabilityResult.reservationReason}`
              : '';
            setError(`This nickname is reserved${categoryText}${reasonText}`);
          } else {
            setError('This nickname is already taken');
          }
          localStorage.removeItem(PENDING_NICKNAME_KEY);
          hasProcessedPendingNickname.current = false;
          return;
        }

        await registerNicknameWithServer({
          nickname: pendingNickname,
          accountId: account.$jazz.id,
          getRegardeAuth: getValidKey,
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
    account?.$jazz.id,
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

          // Use custom auth callback if provided, otherwise use Clerk modal
          if (options.customAuthCallback) {
            options.customAuthCallback(nickname);
          } else {
            clerk.openSignIn({});
          }

          registrationInProgress.current = false;
          setIsProcessing(false);
          return;
        }

        if (!account?.$jazz.id || !isAccountReady) {
          setError('Account not ready. Please try again.');
          registrationInProgress.current = false;
          setIsProcessing(false);
          return;
        }

        // Check availability before registering
        const availabilityResult = await checkNicknameAvailability(nickname);

        if (!availabilityResult.available) {
          if (availabilityResult.reserved) {
            const categoryText = availabilityResult.reservationCategory
              ? ` (${availabilityResult.reservationCategory})`
              : '';
            const reasonText = availabilityResult.reservationReason
              ? `: ${availabilityResult.reservationReason}`
              : '';
            setError(`This nickname is reserved${categoryText}${reasonText}`);
          } else {
            setError('This nickname is already taken');
          }
          registrationInProgress.current = false;
          setIsProcessing(false);
          return;
        }

        await registerNicknameWithServer({
          nickname,
          accountId: account.$jazz.id,
          oldNickname: currentNickname,
          getRegardeAuth: getValidKey,
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
      account?.$jazz.id,
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
      if (!regardeProfile?.userHandle) {
        setError(
          'Onboarding data not available. Please refresh and try again.',
        );
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        // Check availability before updating
        const availabilityResult = await checkNicknameAvailability(nickname);

        if (!availabilityResult.available) {
          if (availabilityResult.reserved) {
            const categoryText = availabilityResult.reservationCategory
              ? ` (${availabilityResult.reservationCategory})`
              : '';
            const reasonText = availabilityResult.reservationReason
              ? `: ${availabilityResult.reservationReason}`
              : '';
            setError(`This nickname is reserved${categoryText}${reasonText}`);
          } else {
            setError('This nickname is already taken');
          }
          return;
        }

        await registerNicknameWithServer({
          nickname,
          accountId: account!.$jazz.id,
          oldNickname: currentNickname,
          getRegardeAuth: getValidKey,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      account?.$jazz.id,
      regardeProfile?.userHandle?.$jazz.id,
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
    isAccountReady: Boolean(account?.profile && isAccountReady),
    hasExistingNickname: Boolean(currentNickname && isNicknameActive),

    // Account info
    accountId: account?.$jazz.id,
    profile: account?.profile,
  };
}
