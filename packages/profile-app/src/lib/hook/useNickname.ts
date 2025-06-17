import { Loaded } from 'jazz-tools';
import { useCallback, useState } from 'react';

import { checkNicknameAvailability, registerNickname } from '../nicknameApi';
import { OnboardingProfile } from '../schema';

// Props for the validation hook - only needs profile to check against current nickname
type UseNicknameValidationProps = {
  profile: Loaded<typeof OnboardingProfile> | undefined;
};

export interface NicknameValidation {
  isValid: boolean;
  isAvailable?: boolean; // isAvailable is relevant for valid nicknames
  isChecking: boolean;
  error?: string;
  message?: string;
}

// Renamed hook to focus on validation and availability checking
export function useNicknameValidation({ profile }: UseNicknameValidationProps) {
  const [validation, setValidation] = useState<NicknameValidation>({
    isValid: false,
    isChecking: false,
  });

  const validateNickname = (
    nickname: string,
  ): { isValid: boolean; message?: string } => {
    if (!nickname || nickname.trim() === '') {
      return { isValid: false, message: 'Nickname is required' };
    }

    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length < 3) {
      return {
        isValid: false,
        message: 'Nickname must be at least 3 characters',
      };
    }

    if (trimmedNickname.length > 30) {
      return {
        isValid: false,
        message: 'Nickname must be less than 30 characters',
      };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedNickname)) {
      return {
        isValid: false,
        message: 'Nickname can only contain letters, numbers, and underscores',
      };
    }

    return { isValid: true };
  };

  const checkAvailability = useCallback(
    async (nickname: string) => {
      const localValidation = validateNickname(nickname);

      if (!localValidation.isValid) {
        setValidation({
          isValid: false,
          isChecking: false,
          message: localValidation.message,
          isAvailable: undefined, // Clear availability state if invalid
        });
        return;
      }

      // Check if the nickname is the user's *current* nickname if profile exists
      if (profile && nickname.trim() === profile.nickname) {
        setValidation({
          isValid: true, // It's valid because it's their current one
          isAvailable: true, // It's available to them
          isChecking: false,
          message: 'Current nickname',
          error: undefined, // Clear any previous errors
        });
        return;
      }

      // Only proceed to API check if the nickname is not the current one or if no profile exists
      setValidation((prev) => ({
        ...prev,
        isChecking: true,
        error: undefined,
        isAvailable: undefined,
      })); // Clear availability while checking

      try {
        const result = await checkNicknameAvailability(nickname.trim()); // Check trimmed nickname
        setValidation({
          isValid: localValidation.isValid && result.available, // Overall validity depends on format and availability
          isAvailable: result.available,
          isChecking: false,
          message: result.available
            ? 'Nickname is available'
            : `Taken by ${result.takenBy || 'another user'}`,
          error: undefined, // Clear errors on successful check
        });
      } catch (error) {
        console.error('Error checking nickname availability:', error); // Log the error
        setValidation({
          isValid: false, // Availability check failed, so not valid for registration/update
          isAvailable: false, // Assume not available if check fails
          isChecking: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to check availability',
        });
      }
    },
    [profile],
  ); // Depend only on profile for checking current nickname

  // Removed updateNickname, removeNickname, resetValidation, isRegistering state

  return {
    validation,
    checkAvailability,
    validateNickname, // Also export validateNickname if needed by the component directly
  };
}

// Separate function for the registration/update step that requires authentication context
export async function registerProfileNickname({
  accountId,
  profile,
  nickname,
  oldNickname,
}: {
  accountId: string;
  profile: Loaded<typeof OnboardingProfile>;
  nickname: string;
  oldNickname: string | undefined; // Pass the old nickname if exists
}) {
  const trimmedNickname = nickname.trim();

  if (!accountId || !profile) {
    console.error('Authentication context missing for registration:', {
      accountId,
      profile,
    });
    throw new Error('Authentication context missing for registration');
  }

  // Perform one final validation check before attempting registration
  // Use the same validation logic
  const validation = useNicknameValidation({
    profile: undefined,
  }).validateNickname(trimmedNickname); // Use hook's validation logic
  if (!validation.isValid) {
    console.error(
      'Attempted registration with invalid nickname format:',
      trimmedNickname,
    );
    throw new Error(validation.message || 'Invalid nickname format');
  }

  // Re-check availability just in case something changed since the last check
  // This adds robustness against race conditions if multiple users try to register the same name
  // Skip this check if the nickname is the same as the old one (updating to same or removing)
  if (trimmedNickname !== oldNickname) {
    const availabilityCheck = await checkNicknameAvailability(trimmedNickname);
    if (!availabilityCheck.available) {
      console.warn(
        `Nickname "${trimmedNickname}" is no longer available during registration attempt.`,
      );
      throw new Error(`Nickname "${trimmedNickname}" is no longer available.`);
    }
  }

  try {
    await registerNickname({
      nickname: trimmedNickname,
      jazzAccountID: accountId,
      oldNickname: oldNickname, // Pass the old nickname for the API
    });

    console.log(
      `Nickname "${trimmedNickname}" successfully registered/updated.`,
    );

    // Update the profile object after successful registration
    // This assumes the profile object passed is the live Jazz object
    profile.nickname = trimmedNickname || undefined;
  } catch (error) {
    console.error('Failed to register/update nickname via API:', error);
    throw error; // Re-throw to be caught by the component calling this
  }
}
