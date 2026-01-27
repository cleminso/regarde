import { Loaded } from "jazz-tools";
import { useEffect, useRef, useState } from "react";

import { TriggerSyncIndicator } from "#/lib/hook/types";
import { useGeneral } from "#/lib/hook/useGeneral";
import { RegardeProfile } from "#/lib/schema";

import { NicknameInput } from "../../../onboarding/nicknameInput";
import { Input, Textarea } from "../../../ui";
import { EditorFooter } from "../../layout/footer";
import { SectionHeader } from "../../layout/header";

import { AvatarUpload } from "./avatarUpload";

type GeneralEditProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onCloseEditor: () => void;
  accountId: string;
};

export function GeneralEdit({ profile, triggerSyncIndicator, onCloseEditor }: GeneralEditProps) {
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

  const [localDisplayName, setLocalDisplayName] = useState(profile.name || "");
  const [isFocused, setIsFocused] = useState(false);
  const originalNameRef = useRef(profile.name || "");

  useEffect(() => {
    if (!isFocused) {
      setLocalDisplayName(profile.name || "");
      originalNameRef.current = profile.name || "";
    }
  }, [profile.name, isFocused]);

  useEffect(() => {
    const timer = setTimeout(() => {
      nickname.checkAvailability(nickname.nicknameValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname.nicknameValue, nickname.checkAvailability]);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalDisplayName(e.target.value);
    updateName(e.target.value);
  };

  const handleDisplayNameFocus = () => {
    setIsFocused(true);
  };

  const handleDisplayNameBlur = () => {
    setIsFocused(false);

    if (!localDisplayName.trim() && originalNameRef.current) {
      setLocalDisplayName(originalNameRef.current);
      updateName(originalNameRef.current);
    }
  };

  return (
    <div className="flex h-full flex-col lg:h-full">
      <div className="mobile-form-bottom flex-1 lg:flex-1 lg:pb-0">
        <SectionHeader title="General" description="Share some details about yourself." />

        <div className="space-y-4 lg:space-y-6">
          <section className="flex flex-row items-center gap-4">
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
                text: "Nickname",
                required: true,
              }}
              validationStatus={nickname.validationStatus}
              validationError={nickname.validationError}
              currentNickname={nickname.currentNickname}
              errorDisplay={{
                position: "inline",
                showRequiredMessage: true,
                externalError: nickname.error,
              }}
            />
          </section>
          <section>
            <label className="text-foreground block font-sans text-sm">
              Display Name<sup>*</sup>
            </label>
            <Input
              type="text"
              id="name"
              value={localDisplayName}
              onChange={handleDisplayNameChange}
              onFocus={handleDisplayNameFocus}
              onBlur={handleDisplayNameBlur}
              placeholder="Your name"
              className="mobile-button mt-2"
            />
          </section>

          <section>
            <div className="flex items-center justify-between">
              <label className="text-foreground block font-sans text-sm">Bio</label>
              <span
                className={`text-sm ${(profile.bio || "").length >= 240 ? "text-destructive" : (profile.bio || "").length >= 200 ? "text-yellow-600" : "text-muted-foreground"}`}
              >
                {(profile.bio || "").length}/240 characters
              </span>
            </div>
            <Textarea
              id="bio"
              value={profile.bio || ""}
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
          text: "Done",
          onClick: onCloseEditor,
        }}
      />
    </div>
  );
}
