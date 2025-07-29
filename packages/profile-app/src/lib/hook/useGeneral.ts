import { Loaded } from 'jazz-tools';
import React, { useCallback, useRef, useState } from 'react';

import { useNicknameUpdate } from '../nickname/useNicknameUpdate';
import { OnboardingProfile } from '../schema';

type UseGeneralProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  accountId: string;
};

export function useGeneral({
  profile,
  triggerSyncIndicator,
  accountId,
}: UseGeneralProps) {
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const clearError = useCallback(() => setUpdateError(null), []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const processFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setUpdateError('Please select an image file (e.g., PNG, JPG).');
        return;
      }

      if (!profile) {
        setUpdateError('Profile not available. Please refresh and try again.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          profile.avatar = reader.result as string;
          triggerSyncIndicator();
          setUpdateError(null);
        } catch (error) {
          setUpdateError('Failed to update avatar. Please try again.');
        }
      };
      reader.onerror = () => {
        setUpdateError('Failed to read image file. Please try again.');
      };
      reader.readAsDataURL(file);
    },
    [profile, triggerSyncIndicator],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFile(e.target.files?.[0]);
      if (e.target) e.target.value = '';
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      processFile(e.dataTransfer.files?.[0]);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleRemoveAvatar = useCallback(() => {
    if (!profile) {
      setUpdateError('Profile not available. Please refresh and try again.');
      return;
    }

    try {
      profile.avatar = undefined;
      triggerSyncIndicator();
      setUpdateError(null);
    } catch (error) {
      setUpdateError('Failed to remove avatar. Please try again.');
    }
  }, [profile, triggerSyncIndicator]);

  const updateName = useCallback(
    async (name: string) => {
      if (!profile) {
        setUpdateError('Profile not available. Please refresh and try again.');
        return;
      }

      if (!name.trim()) {
        setUpdateError('Name cannot be empty.');
        return;
      }

      setIsUpdating(true);
      setUpdateError(null);

      try {
        profile.name = name.trim();
        triggerSyncIndicator();
      } catch (error) {
        setUpdateError('Failed to update name. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    },
    [profile, triggerSyncIndicator],
  );

  const updateBio = useCallback(
    async (bio: string) => {
      if (!profile) {
        setUpdateError('Profile not available. Please refresh and try again.');
        return;
      }

      setIsUpdating(true);
      setUpdateError(null);

      try {
        profile.bio = bio.trim() || undefined;
        triggerSyncIndicator();
      } catch (error) {
        setUpdateError('Failed to update bio. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    },
    [profile, triggerSyncIndicator],
  );

  const nicknameHook = useNicknameUpdate({
    profile,
    accountId,
    triggerSyncIndicator,
  });

  const currentNickname =
    nicknameHook.onboardingStatus === 'available'
      ? nicknameHook.currentNickname
      : '';

  const [nicknameValue, setNicknameValue] = useState(currentNickname);

  React.useEffect(() => {
    if (nicknameHook.onboardingStatus === 'available') {
      setNicknameValue(nicknameHook.currentNickname);
    }
  }, [nicknameHook.currentNickname, nicknameHook.onboardingStatus]);

  const updateNicknameValue = useCallback((value: string) => {
    setNicknameValue(value);
  }, []);

  const resetNicknameInput = useCallback(() => {
    setNicknameValue(currentNickname);
  }, [currentNickname]);

  const updateNickname = useCallback(async () => {
    await nicknameHook.update(nicknameValue);
  }, [nicknameHook.update, nicknameValue]);

  return {
    isUpdating,
    updateError,
    clearError,

    fileInputRef,
    handleAvatarClick,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleRemoveAvatar,

    updateName,
    updateBio,

    nickname: {
      nicknameValue,
      updateNicknameValue,
      resetNicknameInput,
      updateNickname,

      checkAvailability: nicknameHook.checkAvailability,
      status: nicknameHook.status,
      errorMessage: nicknameHook.errorMessage,
      isProcessing: nicknameHook.isProcessing,
      error: nicknameHook.error,
      clearError: nicknameHook.clearError,

      onboardingStatus: nicknameHook.onboardingStatus,
      isOnboardingAvailable: nicknameHook.isOnboardingAvailable,
      canUpdate: nicknameHook.canUpdate,
    },

    canPerformUpdates: Boolean(profile) && !isUpdating,
  };
}
