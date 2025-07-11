import { useClerk } from '@clerk/clerk-react';
import { Loaded } from 'jazz-tools';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { checkNicknameAvailability, registerNickname } from '../api/nickname';
import { OnboardingAccount, OnboardingProfile } from '../schema';
import { createNicknameUrl } from '../utils';
import { useRegistrationKey } from './useRegistrationKey';

type NicknameStatus = 'empty' | 'available' | 'taken' | 'invalid';

type UseNicknameValidationProps = {
  profile: Loaded<typeof OnboardingProfile> | undefined;
};

export function useNicknameValidation({ profile }: UseNicknameValidationProps) {
  const [status, setStatus] = useState<NicknameStatus>('empty');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isValidFormat = (nickname: string): boolean => {
    return (
      nickname.length >= 3 &&
      nickname.length <= 20 &&
      /^[a-zA-Z0-9_-]+$/.test(nickname)
    );
  };

  const checkAvailability = useCallback(
    async (nickname: string) => {
      if (!nickname) {
        setStatus('empty');
        setErrorMessage('');
        return;
      }

      if (!isValidFormat(nickname)) {
        setStatus('invalid');
        setErrorMessage('Nickname must be alphanumerical, dashes are allowed.');
        return;
      }

      if (profile?.onboarding?.nickname === nickname) {
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
        setErrorMessage('Failed to check availability');
      }
    },
    [profile],
  );

  return { status, errorMessage, checkAvailability };
}

function validateOnboardingStructure(
  profile: Loaded<typeof OnboardingProfile>,
): void {
  if (!profile.onboarding) {
    throw new Error(
      'Profile onboarding structure not found. Please refresh and try again.',
    );
  }

  if (!profile.onboarding._owner) {
    throw new Error(
      'Onboarding nickname group not properly configured. Please contact support.',
    );
  }

  // Check if the onboarding structure is ready for operations
  if (typeof profile.onboarding.nickname !== 'string') {
    throw new Error(
      'Onboarding nickname structure is invalid. Please refresh and try again.',
    );
  }
}

export async function registerProfileNickname({
  accountId,
  profile,
  nickname,
  oldNickname,
  getRegistrationKey,
}: {
  accountId: string;
  profile: Loaded<typeof OnboardingProfile>;
  nickname: string;
  oldNickname: string | undefined;
  getRegistrationKey: () => Promise<string | null>;
}) {
  if (!accountId || !profile) {
    throw new Error('Authentication context missing for registration');
  }

  // Validate onboarding structure before proceeding
  validateOnboardingStructure(profile);

  const registrationKey = await getRegistrationKey();
  if (!registrationKey) {
    throw new Error('Registration key not available');
  }

  if (nickname !== oldNickname) {
    const availabilityCheck = await checkNicknameAvailability(nickname);
    if (!availabilityCheck.available) {
      throw new Error(`Nickname "${nickname}" is no longer available.`);
    }
  }

  await registerNickname(
    {
      nickname,
      jazzAccountID: accountId,
      oldNickname,
    },
    getRegistrationKey,
  );

  // Update the onboarding nickname after successful registration
  if (profile.onboarding) {
    profile.onboarding.nickname = nickname;
  }
}

export function useNicknameRegistration() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const clerk = useClerk();
  const { getValidKey } = useRegistrationKey();

  const { me } = useAccount(OnboardingAccount, {
    resolve: {
      profile: {
        registrationKey: true,
        onboarding: true,
      },
    },
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingNickname, setPendingNickname] = useState<string>('');
  const [authAttempted, setAuthAttempted] = useState(false);

  if (me === undefined) {
    return {
      status: 'empty' as const,
      errorMessage: '',
      checkAvailability: async () => {},
      isProcessing: false,
      error: null,
      register: async () => {},
      view: () => {},
      clearError: () => {},
    };
  }

  if (me === null) {
    return {
      status: 'empty' as const,
      errorMessage: 'Account not accessible',
      checkAvailability: async () => {},
      isProcessing: false,
      error: 'Account not accessible',
      register: async () => {},
      view: () => {},
      clearError: () => {},
    };
  }

  if (!me.profile) {
    return {
      status: 'empty' as const,
      errorMessage: 'Profile not accessible',
      checkAvailability: async () => {},
      isProcessing: false,
      error: 'Profile not accessible',
      register: async () => {},
      view: () => {},
      clearError: () => {},
    };
  }

  const profile = me.profile;
  const accountId = me.id;

  const validation = useNicknameValidation({ profile });

  useEffect(() => {
    if (
      authAttempted &&
      isAuthenticated &&
      pendingNickname &&
      accountId &&
      profile
    ) {
      const completeRegistration = async () => {
        try {
          await registerProfileNickname({
            accountId,
            profile,
            nickname: pendingNickname,
            oldNickname: profile.onboarding?.nickname,
            getRegistrationKey: getValidKey,
          });
          navigate(createNicknameUrl(pendingNickname, '/edit'));
        } catch (err) {
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
    profile,
    getValidKey,
    navigate,
  ]);

  const register = async (nickname: string): Promise<void> => {
    if (!nickname) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (!isAuthenticated) {
        setPendingNickname(nickname);
        setAuthAttempted(true);
        clerk.openSignIn({});
      } else if (accountId && profile && profile.onboarding) {
        await registerProfileNickname({
          accountId,
          profile,
          nickname,
          oldNickname: profile.onboarding.nickname,
          getRegistrationKey: getValidKey,
        });
        navigate(createNicknameUrl(nickname, '/edit'));
        setIsProcessing(false);
      } else {
        setError('Account not loaded. Please try refreshing the page.');
        setIsProcessing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setIsProcessing(false);
      setAuthAttempted(false);
      setPendingNickname('');
    }
  };

  const view = (nickname: string): void => {
    if (nickname) {
      window.open(
        `${window.location.origin}${createNicknameUrl(nickname)}`,
        '_blank',
      );
    }
  };

  const clearError = (): void => setError(null);

  return {
    ...validation,
    isProcessing,
    error,
    register,
    view,
    clearError,
  };
}

interface UseNicknameUpdateParams {
  profile: Loaded<typeof OnboardingProfile>;
  accountId: string;
  triggerSyncIndicator: () => void;
}

export function useNicknameUpdate({
  profile,
  accountId,
  triggerSyncIndicator,
}: UseNicknameUpdateParams) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getValidKey } = useRegistrationKey();

  const validation = useNicknameValidation({ profile });

  const update = async (nickname: string): Promise<void> => {
    if (!nickname || nickname === profile.onboarding?.nickname) return;

    setIsProcessing(true);
    setError(null);

    try {
      await registerProfileNickname({
        accountId,
        profile,
        nickname,
        oldNickname: profile.onboarding?.nickname || undefined,
        getRegistrationKey: getValidKey,
      });
      triggerSyncIndicator();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearError = (): void => setError(null);

  return {
    ...validation,
    isProcessing,
    error,
    update,
    clearError,
  };
}
