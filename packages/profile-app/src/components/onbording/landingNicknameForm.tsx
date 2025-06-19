import { useAccount, useIsAuthenticated, usePasskeyAuth } from 'jazz-react';
import { Loaded } from 'jazz-tools';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import {
  registerProfileNickname,
  useNicknameValidation,
} from '../../lib/hook/useNickname';
import { OnboardingAccount, OnboardingProfile } from '../../lib/schema';
import { APPLICATION_NAME } from '../../main';
import { Button, Input } from '../ui';

export function LandingNicknameForm() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { me } = useAccount(OnboardingAccount, {
    resolve: { profile: true, root: true },
  });

  const profile: Loaded<typeof OnboardingProfile> | undefined = me?.profile;
  const auth = usePasskeyAuth({ appName: APPLICATION_NAME });

  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingNickname, setPendingNickname] = useState<string>('');
  const [authAttempted, setAuthAttempted] = useState(false);

  const { status, errorMessage, checkAvailability } = useNicknameValidation({
    profile,
  });

  useEffect(() => {
    if (isAuthenticated && profile?.nickname && !isProcessing) {
      navigate(`/${profile.nickname}/edit`, { replace: true });
    }
  }, [isAuthenticated, profile?.nickname, navigate, isProcessing]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability(nickname);
    }, 500);

    return () => clearTimeout(timer);
  }, [nickname, checkAvailability]);

  useEffect(() => {
    if (
      authAttempted &&
      isAuthenticated &&
      pendingNickname &&
      me?.id &&
      profile
    ) {
      const completeRegistration = async () => {
        try {
          await registerProfileNickname({
            accountId: me.id,
            profile,
            nickname: pendingNickname,
            oldNickname: profile.nickname,
          });
          navigate(`/${pendingNickname}/edit`);
        } catch (error) {
          console.error('Registration failed after auth:', error);
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
    me?.id,
    profile,
    navigate,
  ]);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const handleRegister = async () => {
    const trimmed = nickname.trim();
    setIsProcessing(true);

    if (!isAuthenticated) {
      setPendingNickname(trimmed);
      setAuthAttempted(true);

      try {
        await auth.signUp('');
      } catch (error) {
        console.error('Auth error:', error);
        setIsProcessing(false);
        setAuthAttempted(false);
        setPendingNickname('');
      }
    } else {
      try {
        if (me?.id && profile) {
          await registerProfileNickname({
            accountId: me.id,
            profile,
            nickname: trimmed,
            oldNickname: profile.nickname,
          });
          navigate(`/${trimmed}/edit`);
        }
      } catch (error) {
        console.error('Registration failed:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleView = () => {
    const trimmed = nickname.trim();
    if (trimmed) {
      window.open(`${window.location.origin}/${trimmed}`, '_blank');
    }
  };

  const renderButton = () => {
    if (isProcessing) {
      return (
        <Button
          disabled
          size="sm"
          className="rounded-sm px-4 py-2 transition-all duration-200"
        >
          <Loader2 size={16} className="animate-spin" />
        </Button>
      );
    }

    switch (status) {
      case 'empty':
        return null;

      case 'available':
        return (
          <Button
            onClick={handleRegister}
            size="sm"
            className="rounded-sm px-4 py-2 bg-green-300 hover:bg-green-300/90 text-green-700 transition-all duration-200 cursor-pointer"
          >
            Register
          </Button>
        );

      case 'taken':
        return (
          <Button
            onClick={handleView}
            size="sm"
            className="rounded-sm px-4 py-2 bg-blue-300 hover:bg-blue-300/90 text-blue-700 transition-all duration-200 cursor-pointer"
          >
            View
          </Button>
        );

      case 'invalid':
        return (
          <Button
            variant="default"
            size="sm"
            className="rounded-sm px-4 py-2 bg-red-300 hover:bg-red-300/90 text-red-700 transition-all duration-200"
          >
            Invalid
          </Button>
        );

      default:
        return null;
    }
  };

  if (isAuthenticated && profile?.nickname && !isProcessing) {
    return null;
  }

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    setTimeout(() => {
      input.setSelectionRange(input.value.length, input.value.length);
    }, 0);
  };

  return (
    <div className="flex flex-col items-center text-center gap-6 py-12">
      <h1 className="text-4xl font-sans">profile.jazz.dev</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        The last public profile you will ever need. Build one, share everywhere.
      </p>

      <div className="flex flex-col items-center gap-3 mt-4 w-full max-w-lg">
        <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden w-full">
          <div className="flex items-center px-3 py-2 bg-muted border-r border-border">
            <span className="text-sm text-foreground">profile.jazz.dev/</span>
          </div>
          <Input
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            onFocus={handleInputFocus}
            placeholder="your_name"
            className="border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-1"
            disabled={isProcessing}
          />
          <div className="flex items-center px-2 min-w-[100px] justify-end">
            {renderButton()}
          </div>
        </div>

        <div className="h-6 text-sm">
          {status === 'invalid' && errorMessage && (
            <small className="text-destructive">{errorMessage}</small>
          )}
        </div>
      </div>
    </div>
  );
}
