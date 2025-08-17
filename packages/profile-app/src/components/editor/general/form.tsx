import { Loaded } from 'jazz-tools';
import { useEffect } from 'react';

import { useGeneral } from '#/lib/hook/useGeneral';
import { JazzAppProfile } from '#/lib/schema';
import { Input, Label, Textarea } from '../../ui';
import { NicknameInput } from '../../ui/nicknameInput';
import { EditorFooter } from '../layout/footer';
import { SectionHeader } from '../layout/header';
import { AvatarUpload } from './avatarUpload';

type GeneralEditProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: (profileObject?: any) => void;
  onCloseEditor: () => void;
  accountId: string;
};

export function GeneralEdit({
  profile,
  triggerSyncIndicator,
  onCloseEditor,
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
  } = useGeneral({ profile, triggerSyncIndicator });

  useEffect(() => {
    const timer = setTimeout(() => {
      nickname.checkAvailability(nickname.nicknameValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname.nicknameValue, nickname.checkAvailability]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="General"
          description="Share some details about yourself."
        />

        <div className="space-y-4">
          <section className="flex items-center gap-3">
            <AvatarUpload
              profile={profile}
              fileInputRef={fileInputRef}
              onAvatarClick={handleAvatarClick}
              onFileChange={handleFileChange}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onRemoveAvatar={handleRemoveAvatar}
            />
          </section>

          <section>
            <NicknameInput
              value={nickname.nicknameValue}
              onChange={nickname.updateNicknameValue}
              onBlurRestore={nickname.resetNicknameInput}
              profile={profile}
              isProcessing={nickname.isProcessing}
              onAction={nickname.updateNickname}
              actionText="Update"
              label={{
                text: 'Nickname',
                required: true,
              }}
              validationStatus={nickname.validationStatus}
              validationError={nickname.validationError}
              currentNickname={nickname.currentNickname}
              errorDisplay={{
                position: 'inline',
                showRequiredMessage: true,
                externalError: nickname.error,
              }}
            />
          </section>

          <section>
            <Label htmlFor="name">Display Name*</Label>
            <Input
              type="text"
              id="name"
              value={profile.name || ''}
              onChange={(e) => updateName(e.target.value)}
              placeholder="Your name"
              className="mt-2"
            />
          </section>

          <section>
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span
                className={`text-sm ${
                  (profile.bio || '').length >= 240
                    ? 'text-destructive'
                    : (profile.bio || '').length >= 200
                      ? 'text-yellow-600'
                      : 'text-muted-foreground'
                }`}
              >
                {(profile.bio || '').length}/240 characters
              </span>
            </div>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 240) {
                  updateBio(value);
                }
              }}
              placeholder="Share what people should know about you"
              className="mt-2 min-h-[150px] resize-none"
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
