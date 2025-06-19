import { Loaded } from 'jazz-tools';
import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';

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

  useEffect(() => {
    const timer = setTimeout(() => {
      nickname.checkAvailability(nickname.nicknameValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [nickname.nicknameValue, nickname.checkAvailability]);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    nickname.updateNicknameValue(e.target.value);
  };

  const handleUpdate = async () => {
    try {
      await nickname.updateNickname();
    } catch (error) {
      console.error('Failed to update nickname:', error);
    }
  };

  const renderNicknameButton = () => {
    if (nickname.isRegistering) {
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

    const trimmed = nickname.nicknameValue.trim();
    const isChanged = trimmed !== (profile.nickname || '');

    if (!trimmed) {
      return (
        <Button
          variant="default"
          size="sm"
          className="rounded-sm px-4 py-2 bg-red-300 text-red-700 transition-all duration-200"
          disabled
        >
          Invalid
        </Button>
      );
    }

    switch (nickname.status) {
      case 'available':
        if (isChanged) {
          return (
            <Button
              onClick={handleUpdate}
              size="sm"
              className="rounded-sm px-4 py-2 bg-green-300 hover:bg-green-300/90 text-green-700 transition-all duration-200 cursor-pointer"
            >
              Update
            </Button>
          );
        } else {
          return (
            <Button
              variant="default"
              size="sm"
              className="rounded-sm px-4 py-2 bg-gray-300 text-gray-700 transition-all duration-200"
              disabled
            >
              Current
            </Button>
          );
        }

      case 'taken':
        return (
          <Button
            variant="default"
            size="sm"
            className="rounded-sm px-4 py-2 bg-red-300 text-red-700 transition-all duration-200"
            disabled
          >
            Taken
          </Button>
        );

      case 'invalid':
        return (
          <Button
            variant="default"
            size="sm"
            className="rounded-sm px-4 py-2 bg-red-300 text-red-700  transition-all duration-200"
            disabled
          >
            Invalid
          </Button>
        );

      default:
        return null;
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    setTimeout(() => {
      input.setSelectionRange(input.value.length, input.value.length);
    }, 0);
  };

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
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="nickname"
                className="text-sm font-sans block text-foreground"
              >
                Nickname<sup>*</sup>
              </label>
              {!nickname.nicknameValue.trim() && (
                <small className="text-destructive">
                  Nickname is required.
                </small>
              )}
              {nickname.nicknameValue.trim() &&
                nickname.status === 'invalid' &&
                nickname.errorMessage && (
                  <small className="text-destructive">
                    {nickname.errorMessage}
                  </small>
                )}
            </div>
            <div className="flex items-stretch w-full bg-muted rounded-sm overflow-hidden">
              <div className="flex items-center pl-3 pr-1 py-3 text-sm text-foreground whitespace-nowrap">
                profile.jazz.dev/
              </div>
              <div className="relative flex-grow">
                <Input
                  type="text"
                  value={nickname.nicknameValue}
                  onChange={handleNicknameChange}
                  onFocus={handleInputFocus}
                  placeholder="your_name"
                  className="h-full text-base border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none bg-transparent  px-0 py-3 shadow-none rounded-none"
                  disabled={nickname.isRegistering}
                />
              </div>
              <div className="flex items-center px-2 min-w-[100px] justify-end">
                {renderNicknameButton()}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="name"
              className="text-sm font-sans block text-foreground mb-2"
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
              className="w-full text-sm border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            />
          </div>

          <div className="h-full">
            <label
              htmlFor="bio"
              className="block text-sm font-sans text-foreground mb-2"
            >
              Bio
            </label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateBio(e.target.value)
              }
              placeholder="Share what people should know about you."
              className="text-sm font-sans w-full min-h-full h-max resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            />
          </div>
        </div>
      </section>
    </>
  );
}
