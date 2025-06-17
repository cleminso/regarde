import { Loaded } from 'jazz-tools';
import React from 'react';

import { useGeneral } from '#/lib/hook/useGeneral';
import { OnboardingProfile } from '../../../lib/schema';
import { Button, Input, Textarea } from '../../ui';

type GeneralEditProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  onCloseEditor: () => void;
  accountId: string;
};

export function GeneralEdit({
  profile,
  triggerSyncIndicator,
  onCloseEditor,
  accountId,
}: GeneralEditProps) {
  const {
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
  } = useGeneral({ profile, triggerSyncIndicator, accountId });

  return (
    <>
      <section className="flex items-center mb-6 space-x-2">
        <div>
          <input
            type="file"
            id="avatar-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/gif"
            className="hidden"
          />
          <div
            onClick={handleAvatarClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="w-24 h-24 rounded-full bg-background flex justify-center text-sm text-center text-muted-foreground cursor-pointer transition-colors overflow-hidden"
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === 'Enter' || e.key === ' ') && handleAvatarClick()
            }
            aria-label="Upload avatar"
          >
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-xs">
                <span>Upload</span>
              </div>
            )}
          </div>
        </div>
        {profile.avatar && (
          <div className="h-full flex flex-col justify-end">
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-sm font-sans text-muted-foreground hover:text-destructive cursor-pointer"
              aria-label="Remove current avatar"
            >
              Remove
            </button>
          </div>
        )}
        <div className="flex flex-col w-full h-full">
          <div className="flex items-center justify-end mb-4 space-x-2">
            <Button
              variant="outline"
              onClick={onCloseEditor}
              aria-label="Close editor and go to profile"
              title="Close editor"
              className="text-sm font-sans text-foreground hover:text-foreground rounded-sm hover:bg-accent border-none cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-5 h-1/2">
        <div className="space-y-4 w-full h-full">
          <div className="space-y-1">
            <label
              htmlFor="name"
              className="text-sm font-sans block text-foreground"
            >
              Name
            </label>
            <Input
              type="text"
              id="name"
              value={profile.name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateName(e.target.value)
              }
              placeholder="Your name"
              className="w-full"
            />
            {!profile.name?.trim() && (
              <small className="text-destructive">Name is required.</small>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="nickname"
              className="text-sm font-sans block text-foreground"
            >
              Nickname (optional)
            </label>
            <div className="relative">
              <Input
                type="text"
                id="nickname"
                value={profile.nickname || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  nickname.updateNicknameValue(value);
                  if (value.trim() === '') {
                    nickname.resetValidation();
                  } else {
                    nickname.checkAvailability(value);
                  }
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const value = e.target.value.trim();
                  if (
                    value &&
                    nickname.validation.isValid &&
                    nickname.validation.isAvailable
                  ) {
                    nickname.updateNickname().catch((error: any) => {
                      // Explicitly type error
                      console.error('Failed to update nickname:', error);
                    });
                  }
                }}
                placeholder="your_nickname"
                className="w-full"
                disabled={nickname.isRegistering}
              />
              {nickname.validation.isChecking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            {nickname.validation.error && (
              <small className="text-destructive">
                {nickname.validation.error}
              </small>
            )}
            {nickname.validation.message && !nickname.validation.error && (
              <small
                className={
                  nickname.validation.isAvailable
                    ? 'text-green-600'
                    : 'text-destructive'
                }
              >
                {nickname.validation.message}
              </small>
            )}
            {profile.nickname && (
              <div className="flex items-center space-x-2 mt-1">
                <small className="text-muted-foreground">
                  Current: {profile.nickname}
                </small>
                <button
                  type="button"
                  onClick={() =>
                    nickname.removeNickname().catch((error: any) => {
                      // Explicitly type error
                      console.error('Failed to remove nickname:', error);
                    })
                  }
                  className="text-xs text-destructive hover:underline"
                  disabled={nickname.isRegistering}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1 h-full">
            <label
              htmlFor="bio"
              className="block text-sm font-sans text-foreground"
            >
              Bio
            </label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateBio(e.target.value)
              }
              placeholder="Share what people should know about you"
              className="text-sm font-sans w-full min-h-full h-max resize-none"
            />
          </div>
        </div>
      </section>
    </>
  );
}
