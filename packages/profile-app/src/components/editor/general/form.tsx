import { Loaded } from 'jazz-tools';
import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';

import { useGeneral } from '#/lib/hook/useGeneral';
import { OnboardingProfile } from '../../../lib/schema';
import { Button, Input, Textarea } from '../../ui';
import { EditorFooter } from '../layout/footer';
import { SectionHeader } from '../layout/header';
import { AvatarUpload } from './avatarUpload';

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
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="General"
          description="Share some details about yourself."
        />

        <div className="space-y-6">
          <section className="flex items-center gap-3">
            <AvatarUpload
              avatar={profile.avatar}
              fileInputRef={fileInputRef}
              onAvatarClick={handleAvatarClick}
              onFileChange={handleFileChange}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onRemoveAvatar={handleRemoveAvatar}
            />
            <div className="flex items-center"></div>
          </section>

          <section className="space-y-3">
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
              <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden w-full">
                <div className="flex items-center px-3 py-3 bg-muted border-r border-border">
                  <span className="text-sm text-foreground">
                    profile.jazz.dev/
                  </span>
                </div>
                <Input
                  type="text"
                  value={nickname.nicknameValue}
                  onChange={handleNicknameChange}
                  onFocus={handleInputFocus}
                  placeholder="your_name"
                  className="border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-1"
                  disabled={nickname.isRegistering}
                />
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
                className="w-full h-11 text-sm border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
              />
            </div>
          </section>

          <section>
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
              className="text-sm font-sans w-full min-h-[150px] resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            />
          </section>
        </div>
      </div>

      <EditorFooter
        primaryAction={{
          text: 'Done',
          onClick: onCloseEditor,
        }}
      />
    </div>
  );
}
