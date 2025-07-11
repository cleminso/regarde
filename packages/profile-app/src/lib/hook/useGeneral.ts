import { Loaded } from 'jazz-tools';
import React, { useRef, useState } from 'react';

import { OnboardingProfile } from '../schema';
import { registerProfileNickname, useNicknameValidation } from './useNickname';
import { useRegistrationKey } from './useRegistrationKey';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getValidKey } = useRegistrationKey();

  const { status, errorMessage, checkAvailability } = useNicknameValidation({
    profile,
  });

  const [nicknameValue, setNicknameValue] = useState(
    profile.onboarding?.nickname || '',
  );
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = (file: File | null | undefined) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (profile) profile.avatar = reader.result as string;
        triggerSyncIndicator();
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert('Please select an image file (e.g., PNG, JPG).');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveAvatar = () => {
    if (profile) profile.avatar = undefined;
    triggerSyncIndicator();
  };

  const updateName = (name: string) => {
    if (profile) {
      profile.name = name;
      triggerSyncIndicator();
    }
  };

  const updateBio = (bio: string) => {
    if (profile) {
      profile.bio = bio || undefined;
      triggerSyncIndicator();
    }
  };

  const updateNicknameValue = (value: string) => {
    setNicknameValue(value);
  };

  const resetNicknameInput = () => {
    setNicknameValue(profile.onboarding?.nickname || '');
  };

  const updateNickname = async () => {
    setIsRegistering(true);
    try {
      await registerProfileNickname({
        accountId,
        profile,
        nickname: nicknameValue,
        oldNickname: profile.onboarding?.nickname,
        getRegistrationKey: getValidKey,
      });
      triggerSyncIndicator();
    } catch (error) {
      console.error('Failed to update nickname:', error);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  return {
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
      checkAvailability,
      updateNickname,
      status,
      errorMessage,
      isRegistering,
    },
  };
}
