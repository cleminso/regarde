import { Loaded } from 'jazz-tools';
import { useCallback, useEffect, useState } from 'react';
import { checkNicknameAvailability, registerNickname } from '../nicknameApi';
import { OnboardingProfile } from '../schema';

type UseNicknameProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  accountId: string;
};

export interface NicknameValidation {
  isValid: boolean;
  isAvailable?: boolean;
  isChecking: boolean;
  error?: string;
  message?: string;
}

export function useNickname({ profile, triggerSyncIndicator, accountId }: UseNicknameProps) {
  const [validation, setValidation] = useState<NicknameValidation>({
    isValid: false,
    isChecking: false,
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const updateNicknameValue = useCallback((nickname: string) => {
    profile.nickname = nickname || undefined;
    triggerSyncIndicator();
  }, [profile, triggerSyncIndicator]);

  const validateNickname = (nickname: string): { isValid: boolean; message?: string } => {
    if (!nickname || nickname.trim() === '') {
      return { isValid: false, message: 'Nickname is required' };
    }
    
    if (nickname.length < 3) {
      return { isValid: false, message: 'Nickname must be at least 3 characters' };
    }
    
    if (nickname.length > 30) {
      return { isValid: false, message: 'Nickname must be less than 30 characters' };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
      return { isValid: false, message: 'Nickname can only contain letters, numbers, and underscores' };
    }
    
    return { isValid: true };
  };

  const checkAvailability = useCallback(async (nickname: string) => {
    const localValidation = validateNickname(nickname);
    
    if (!localValidation.isValid) {
      setValidation({
        isValid: false,
        isChecking: false,
        message: localValidation.message,
      });
      return;
    }

    if (nickname === profile.nickname) {
      setValidation({
        isValid: true,
        isAvailable: true,
        isChecking: false,
        message: 'Current nickname',
      });
      return;
    }

    setValidation(prev => ({ ...prev, isChecking: true, error: undefined }));

    try {
      const result = await checkNicknameAvailability(nickname);
      setValidation({
        isValid: localValidation.isValid && result.available,
        isAvailable: result.available,
        isChecking: false,
        message: result.available ? 'Nickname is available' : `Taken by ${result.takenBy || 'another user'}`,
      });
    } catch (error) {
      setValidation({
        isValid: false,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Failed to check availability',
      });
    }
  }, [profile.nickname]);

  const updateNickname = useCallback(async (nickname: string) => {
    const trimmedNickname = nickname.trim();
    
    if (trimmedNickname === profile.nickname) {
      return;
    }

    if (!validation.isValid || !validation.isAvailable) {
      throw new Error('Cannot register invalid or unavailable nickname');
    }

    setIsRegistering(true);
    try {
      await registerNickname({
        nickname: trimmedNickname,
        jazzAccountID: accountId,
        oldNickname: profile.nickname || undefined,
      });

      profile.nickname = trimmedNickname || undefined;
      triggerSyncIndicator();
    } catch (error) {
      throw error;
    } finally {
      setIsRegistering(false);
    }
  }, [profile, validation, accountId, triggerSyncIndicator]);

  const removeNickname = useCallback(async () => {
    if (!profile.nickname) {
      return;
    }

    setIsRegistering(true);
    try {
      await registerNickname({
        nickname: '',
        jazzAccountID: accountId,
        oldNickname: profile.nickname,
      });

      profile.nickname = undefined;
      triggerSyncIndicator();
      setValidation({
        isValid: false,
        isChecking: false,
      });
    } catch (error) {
      throw error;
    } finally {
      setIsRegistering(false);
    }
  }, [profile, accountId, triggerSyncIndicator]);

  const resetValidation = useCallback(() => {
    setValidation({
      isValid: false,
      isChecking: false,
    });
  }, []);

  useEffect(() => {
    if (profile.nickname) {
      setValidation({
        isValid: true,
        isAvailable: true,
        isChecking: false,
        message: 'Current nickname',
      });
    }
  }, [profile.nickname]);

  return {
    validation,
    checkAvailability,
    updateNickname,
    updateNicknameValue,
    removeNickname,
    resetValidation,
    isRegistering,
  };
}