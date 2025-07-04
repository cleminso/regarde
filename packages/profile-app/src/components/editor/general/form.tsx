import { Loaded } from 'jazz-tools';
import { useEffect } from 'react';

import { useGeneral } from '#/lib/hook/useGeneral';
import { useNicknameUpdate } from '../../../lib/hook/useNickname';
import { OnboardingProfile } from '../../../lib/schema';
import { Input, Label, Textarea } from '../../ui';
import { NicknameInput } from '../../ui/nicknameInput';
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

  const { isProcessing, error, update, clearError } = useNicknameUpdate({
    profile,
    accountId,
    triggerSyncIndicator,
  });

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [nickname.nicknameValue, error, clearError]);

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
              avatar={profile.avatar}
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
              profile={profile}
              isProcessing={isProcessing}
              onAction={update}
              actionText="Update"
              label={{
                text: 'Nickname',
                required: true,
              }}
              errorDisplay={{
                position: 'inline',
                showRequiredMessage: true,
                externalError: error,
              }}
            />
          </section>

          <section>
            <Label htmlFor="name">Name</Label>
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
                  (profile.bio || '').length >= 160
                    ? 'text-destructive'
                    : (profile.bio || '').length >= 120
                      ? 'text-yellow-600'
                      : 'text-muted-foreground'
                }`}
              >
                {(profile.bio || '').length}/160 characters
              </span>
            </div>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 160) {
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
