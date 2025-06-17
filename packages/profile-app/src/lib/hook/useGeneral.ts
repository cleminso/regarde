import { Loaded } from 'jazz-tools';
import React, { useRef, useState } from 'react'; // Import useState

import { OnboardingProfile } from '../schema';
// Import the new hooks/functions
import { registerProfileNickname, useNicknameValidation } from './useNickname';

// Corrected import path

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

  // Use the new validation hook
  const { validation, checkAvailability } = useNicknameValidation({ profile });

  // Manage nickname input value locally
  const [nicknameValue, setNicknameValue] = useState(profile.nickname || '');
  // Manage registration loading state
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
    // Note: The original class name "" in remove/add below seems incorrect.
    // Assuming it was meant to be a placeholder for a drag-over class.
    // Removing the incorrect class toggling.
    // (e.currentTarget as HTMLDivElement).classList.remove('');
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // (e.currentTarget as HTMLDivElement).classList.add(''); // Removing incorrect class toggling
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // (e.currentTarget as HTMLDivElement).classList.remove(''); // Removing incorrect class toggling
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

  // New functions to handle nickname logic using the new architecture
  const updateNicknameValue = (value: string) => {
    setNicknameValue(value);
  };

  const resetValidation = () => {
    // Resetting validation usually means checking the empty state or the current profile nickname state
    checkAvailability(''); // Check availability of empty string to clear messages
    setNicknameValue(''); // Also clear the input value
  };

  const updateNickname = async () => {
    setIsRegistering(true);
    try {
      // Call the new registration function
      await registerProfileNickname({
        accountId,
        profile,
        nickname: nicknameValue,
        oldNickname: profile.nickname, // Pass current nickname as oldNickname
      });
      // On success, the profile object is updated by registerProfileNickname,
      // which will trigger a re-render and update the UI.
      // The local nicknameValue state should already match the desired new value.
    } catch (error) {
      console.error('Failed to update nickname:', error);
      // The component (form.tsx) will need to handle displaying the error
      // thrown by registerProfileNickname.
      throw error; // Re-throw the error
    } finally {
      setIsRegistering(false);
    }
  };

  const removeNickname = async () => {
    setIsRegistering(true);
    try {
      // Call the new registration function with an empty nickname to remove it
      await registerProfileNickname({
        accountId,
        profile,
        nickname: '', // Empty string indicates removal
        oldNickname: profile.nickname, // Pass current nickname as oldNickname
      });
      // On success, profile.nickname will be undefined. Clear local state.
      setNicknameValue('');
    } catch (error) {
      console.error('Failed to remove nickname:', error);
      // Re-throw the error
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  // Return the necessary state and functions for the component
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
    // Expose the new nickname related state and functions
    nickname: {
      // Match the structure expected by form.tsx
      nicknameValue,
      updateNicknameValue,
      resetValidation,
      checkAvailability,
      updateNickname,
      removeNickname,
      validation, // From useNicknameValidation
      isRegistering, // Local state
    },
  };
}
