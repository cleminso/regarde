// packages/profile-app/src/lib/nickname/useNicknameUpdate.ts
import { Loaded } from 'jazz-tools';
import { useCallback, useState } from 'react';

import { useOnboardingData } from '../account/useOnboardingData';
import { useRegistrationKey } from '../account/useRegistrationKey';
import { OnboardingProfile } from '../schema';
import { registerNicknameWithServer } from './services';
import { useNicknameValidation } from './useNicknameValidation';

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

  const { currentNickname } = useOnboardingData();

  const onboardingData = profile.onboarding;
  const onboardingStatus =
    onboardingData === undefined
      ? 'loading'
      : onboardingData === null
        ? 'inaccessible'
        : 'available';

  const validation = useNicknameValidation(currentNickname);

  const update = useCallback(
    async (nickname: string): Promise<void> => {
      if (!profile.onboarding) {
        setError(
          'Onboarding data not available. Please refresh and try again.',
        );
        return;
      }

      // Skip if nickname unchanged
      if (!nickname || nickname === currentNickname) return;

      setIsProcessing(true);
      setError(null);

      try {
        await registerNicknameWithServer({
          nickname,
          accountId,
          oldNickname: currentNickname,
          getRegistrationKey: getValidKey,
        });

        triggerSyncIndicator();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      accountId,
      currentNickname,
      getValidKey,
      triggerSyncIndicator,
      profile.onboarding,
    ],
  );

  const clearError = useCallback((): void => setError(null), []);

  return {
    ...validation,
    currentNickname,
    isProcessing,
    error,
    update,
    clearError,

    isOnboardingAvailable: onboardingStatus === 'available',
    onboardingStatus,

    canUpdate: onboardingStatus === 'available' && !isProcessing,
  };
}
