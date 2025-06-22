import { Loaded } from 'jazz-tools';
import { useEffect } from 'react';

import { useGeneral } from '#/lib/hook/useGeneral';
import { useNicknameUpdate } from '../../../lib/hook/useNickname';
import { OnboardingProfile } from '../../../lib/schema';
import { Input, Textarea } from '../../ui';
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
              onChange={(e) => updateName(e.target.value)}
              placeholder="Your name"
              className="w-full h-11 text-sm border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            />
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
              onChange={(e) => updateBio(e.target.value)}
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
