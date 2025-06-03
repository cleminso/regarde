import { Loaded } from 'jazz-tools';
import React, { useRef } from 'react';

import { OnboardingProfile } from '../schema';
import { useNickname } from './useNickname';

type UseGeneralProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  accountId: string;
};

export function useGeneral({ profile, triggerSyncIndicator, accountId }: UseGeneralProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nickname = useNickname({ profile, triggerSyncIndicator, accountId });

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
    (e.currentTarget as HTMLDivElement).classList.remove('');
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).classList.add('');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).classList.remove('');
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
    nickname,
  };
}
