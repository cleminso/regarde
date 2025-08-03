import { Loaded } from 'jazz-tools';
import React from 'react';

import { ProfileAvatar } from '#/components/ui/avatar';
import { OnboardingProfile } from '#/lib/schema';

export type AvatarUploadProps = {
  profile: Loaded<typeof OnboardingProfile>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemoveAvatar: () => void;
};

export function AvatarUpload({
  profile,
  fileInputRef,
  onAvatarClick,
  onFileChange,
  onDrop,
  onDragOver,
  onDragLeave,
  onRemoveAvatar,
}: AvatarUploadProps) {
  return (
    <>
      <div>
        <input
          type="file"
          id="avatar-upload"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/png, image/jpeg, image/gif"
          className="hidden"
        />
        <div
          onClick={onAvatarClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className="w-[92px] h-[92px] flex justify-center text-sm text-center cursor-pointer transition-colors overflow-hidden"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onAvatarClick();
            }
          }}
          aria-label="Upload avatar"
        >
          <ProfileAvatar
            profile={profile}
            size={92}
            className="w-full h-full"
          />
        </div>
      </div>
      {profile.avatar && (
        <div className="h-full flex flex-col justify-end">
          <button
            type="button"
            onClick={onRemoveAvatar}
            className="text-sm text-muted-foreground hover:text-destructive cursor-pointer"
            aria-label="Remove current avatar"
          >
            Remove
          </button>
        </div>
      )}
    </>
  );
}
