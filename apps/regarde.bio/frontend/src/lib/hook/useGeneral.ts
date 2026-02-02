import { createImage } from "jazz-tools/media";
import React, { useCallback, useRef, useState } from "react";

import { useClerkOnboarding } from "../onboarding/useClerkOnboarding";

import { BaseHookProps } from "./types";

type UseGeneralProps = BaseHookProps;

export function useGeneral({ profile, triggerSyncIndicator }: UseGeneralProps) {
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const clearError = useCallback(() => setUpdateError(null), []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const processFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setUpdateError("Please select an image file (e.g., PNG, JPG).");
        return;
      }

      if (!profile.$isLoaded) {
        setUpdateError("Profile not available. Please refresh and try again.");
        return;
      }

      setIsUpdating(true);
      setUpdateError(null);

      try {
        const owner = profile.$jazz.owner;
        if (!owner || !owner.$isLoaded) {
          setUpdateError("Profile not ready. Please refresh and try again.");
          return;
        }

        const imageDefinition = await createImage(file, {
          owner,
          maxSize: 1024,
          placeholder: "blur",
          progressive: true,
        });

        profile.$jazz.set("avatarImage", imageDefinition);
        await triggerSyncIndicator(profile);
        setUpdateError(null);
      } catch (error) {
        console.error("Error uploading avatar:", error);
        setUpdateError("Failed to update avatar. Please try again.");
      } finally {
        setIsUpdating(false);
      }
    },
    [profile, triggerSyncIndicator],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFile(e.target.files?.[0]);
      if (e.target) e.target.value = "";
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

  const handleRemoveAvatar = useCallback(async () => {
    if (!profile.$isLoaded) {
      setUpdateError("Profile not available. Please refresh and try again.");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      profile.$jazz.set("avatarImage", undefined);
      await triggerSyncIndicator(profile);
      setUpdateError(null);
    } catch (error) {
      setUpdateError("Failed to remove avatar. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }, [profile, triggerSyncIndicator]);

  const updateName = useCallback(
    async (name: string) => {
      if (!profile.$isLoaded) {
        setUpdateError("Profile not available. Please refresh and try again.");
        return;
      }

      // Allow empty values during editing - validation happens at profile level

      setIsUpdating(true);
      setUpdateError(null);

      try {
        profile.$jazz.set("name", name.trim() || "User");
        await triggerSyncIndicator(profile);
      } catch (error) {
        setUpdateError("Failed to update name. Please try again.");
      } finally {
        setIsUpdating(false);
      }
    },
    [profile, triggerSyncIndicator],
  );

  const updateBio = useCallback(
    async (bio: string) => {
      if (!profile.$isLoaded) {
        setUpdateError("Profile not available. Please refresh and try again.");
        return;
      }

      setIsUpdating(true);
      setUpdateError(null);

      try {
        profile.$jazz.set("bio", bio.length === 0 ? undefined : bio);
        await triggerSyncIndicator(profile);
      } catch (error) {
        setUpdateError("Failed to update bio. Please try again.");
      } finally {
        setIsUpdating(false);
      }
    },
    [profile, triggerSyncIndicator],
  );

  const clerkOnboarding = useClerkOnboarding();

  const [nicknameValue, setNicknameValue] = useState(clerkOnboarding.currentNickname);

  React.useEffect(() => {
    setNicknameValue(clerkOnboarding.currentNickname);
  }, [clerkOnboarding.currentNickname]);

  const updateNicknameValue = useCallback((value: string) => {
    setNicknameValue(value);
  }, []);

  const resetNicknameInput = useCallback(() => {
    setNicknameValue(clerkOnboarding.currentNickname);
  }, [clerkOnboarding.currentNickname]);

  const updateNickname = useCallback(async () => {
    await clerkOnboarding.update(nicknameValue);
  }, [clerkOnboarding.update, nicknameValue]);

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

      checkAvailability: clerkOnboarding.checkAvailability,
      validationStatus: clerkOnboarding.validationStatus,
      validationError: clerkOnboarding.validationError,
      isProcessing: clerkOnboarding.isProcessing,
      error: clerkOnboarding.error,
      clearError: clerkOnboarding.clearError,

      currentNickname: clerkOnboarding.currentNickname,
      isNicknameActive: clerkOnboarding.isNicknameActive,
      canUpdate: clerkOnboarding.isAccountReady && !clerkOnboarding.isProcessing,
    },

    canPerformUpdates: Boolean(profile && profile.$isLoaded) && !isUpdating,
  };
}
