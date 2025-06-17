import { useAccount, useIsAuthenticated, usePasskeyAuth } from 'jazz-react';
import { Loaded } from 'jazz-tools';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import {
  registerProfileNickname,
  useNicknameValidation,
} from '../../../lib/hook/useNickname';
import { OnboardingAccount, OnboardingProfile } from '../../../lib/schema';
import { APPLICATION_NAME } from '../../../main';
import { Button, Input } from '../../ui';

export function LandingNicknameForm() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { me } = useAccount(OnboardingAccount, {
    resolve: { profile: true, root: true },
  });
  const accountId = me?.id;
  const profile: Loaded<typeof OnboardingProfile> | undefined = me?.profile;

  const auth = usePasskeyAuth({ appName: APPLICATION_NAME });

  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [authTriggered, setAuthTriggered] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );

  const { validation, checkAvailability, validateNickname } =
    useNicknameValidation({
      profile,
    });

  const debouncedCheckAvailability = useCallback(
    (value: string) => {
      if (value.trim() === '') {
        checkAvailability('');
        return () => {};
      }
      const handler = setTimeout(() => {
        checkAvailability(value.trim());
      }, 300);

      return () => {
        clearTimeout(handler);
      };
    },
    [checkAvailability],
  );

  useEffect(() => {
    const initialNickname = profile?.nickname || '';
    setNickname(initialNickname);
    const handler = setTimeout(() => {
      debouncedCheckAvailability(initialNickname);
    }, 50);

    return () => {
      clearTimeout(handler);
    };
  }, [profile, debouncedCheckAvailability]);

  useEffect(() => {
    const cleanup = debouncedCheckAvailability(nickname);
    return () => cleanup();
  }, [nickname, debouncedCheckAvailability]);

  useEffect(() => {
    if (
      authTriggered &&
      isAuthenticated &&
      accountId &&
      profile &&
      !profile.nickname
    ) {
      console.log(
        'Auth triggered and now authenticated. Attempting to register nickname...',
      );
      const registerNewlyAuthenticatedNickname = async () => {
        setIsProcessing(true);
        setRegistrationError(null);
        try {
          await registerProfileNickname({
            accountId: accountId!,
            profile: profile!,
            nickname: nickname.trim(),
            oldNickname: undefined,
          });
          console.log('Nickname registration successful post-auth.');
        } catch (error) {
          console.error(
            'Failed to register nickname after authentication:',
            error,
          );
          setRegistrationError(
            error instanceof Error
              ? error.message
              : 'An unknown error occurred during registration.',
          );
        } finally {
          setIsProcessing(false);
          setAuthTriggered(false);
        }
      };
      registerNewlyAuthenticatedNickname();
    } else if (
      isAuthenticated &&
      profile?.nickname &&
      !isProcessing &&
      !authTriggered
    ) {
      console.log(
        `Authenticated user "${profile.nickname}" detected in LandingNicknameForm, navigating to edit page.`,
      );
      navigate(`/${profile.nickname}/edit`, { replace: true });
    }
  }, [
    authTriggered,
    isAuthenticated,
    accountId,
    profile,
    nickname,
    navigate,
    isProcessing,
  ]);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
  };

  const handleButtonClick = async () => {
    if (!validation.isValid || validation.isChecking || isProcessing) {
      return;
    }

    const trimmedNickname = nickname.trim();

    if (validation.isAvailable) {
      const finalValidation = validateNickname(trimmedNickname);
      if (!finalValidation.isValid) {
        setRegistrationError(finalValidation.message || 'Invalid nickname.');
        return;
      }
      setRegistrationError(null);

      setIsProcessing(true);
      setAuthTriggered(true);

      if (!isAuthenticated) {
        console.log(
          'Nickname available, user not authenticated. Triggering signup...',
        );
        try {
          await auth.signUp('');
          console.log('auth.signUp completed. Waiting for state update...');
        } catch (error) {
          console.error('Passkey signup failed:', error);
          setIsProcessing(false);
          setAuthTriggered(false);
          setRegistrationError('Authentication failed. Please try again.');
        }
      } else {
        console.log(
          'Nickname available, user already authenticated. Proceeding to register...',
        );

        if (!accountId || !profile) {
          console.error(
            'Missing context for authenticated registration attempt.',
          );
          setRegistrationError(
            'Missing account context. Please try logging in again.',
          );
          setIsProcessing(false);
          setAuthTriggered(false);
          return;
        }
        try {
          await registerProfileNickname({
            accountId: accountId,
            profile: profile,
            nickname: trimmedNickname,
            oldNickname: profile.nickname,
          });
          console.log(
            'Nickname registration successful for existing authenticated user.',
          );
        } catch (error) {
          console.error(
            'Failed to register nickname for authenticated user:',
            error,
          );
          // Display error
          setRegistrationError(
            error instanceof Error
              ? error.message
              : 'An unknown error occurred during registration.',
          );
        } finally {
          setIsProcessing(false);
          setAuthTriggered(false);
        }
      }
    } else {
      if (trimmedNickname) {
        console.log(`Navigating to view profile: /${trimmedNickname}`);
        navigate(`/${trimmedNickname}`);
      }
    }
  };

  if (isAuthenticated && profile?.nickname && !isProcessing && !authTriggered) {
    console.log(
      'Authenticated user with nickname detected in LandingNicknameForm, rendering null - expecting redirect.',
    );
    return null;
  }

  return (
    <div className="flex flex-col items-center text-center gap-6 py-12">
      <h1 className="text-4xl font-sans">profile.jazz.dev</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        The last public profile you will ever need. Build one, share everywhere.
      </p>
      <div className="flex flex-col items-center gap-4 mt-4">
        <div className="relative w-full max-w-md">
          <Input
            type="text"
            id="nickname"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="your_nickname"
            className="w-full"
            disabled={isProcessing || validation.isChecking}
          />
          {validation.isChecking && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        {validation.message && !validation.error && (
          <small
            className={
              validation.isAvailable ? 'text-green-600' : 'text-destructive'
            }
          >
            {validation.message}
          </small>
        )}
        {validation.error && (
          <small className="text-destructive">{validation.error}</small>
        )}
        {registrationError && (
          <small className="text-destructive">{registrationError}</small>
        )}

        <Button
          size="lg"
          variant="default"
          onClick={handleButtonClick}
          disabled={
            validation.isChecking || isProcessing || !validation.isValid
          }
        >
          {isProcessing
            ? 'Processing...'
            : validation.isAvailable
              ? 'Register Handle'
              : 'View Profile'}
        </Button>
      </div>
    </div>
  );
}
