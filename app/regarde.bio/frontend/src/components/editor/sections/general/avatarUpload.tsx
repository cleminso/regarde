import { Loaded } from "jazz-tools";
import React from "react";

import { ProfileAvatar } from "#/components/ui/avatar";
import { RegardeProfile } from "#/lib/schema";

export type AvatarUploadProps = {
  profile: Loaded<typeof RegardeProfile>;
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
          className="flex h-[92px] w-[92px] cursor-pointer justify-center overflow-hidden text-center text-sm transition-colors"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onAvatarClick();
            }
          }}
          aria-label="Upload avatar"
        >
          <ProfileAvatar profile={profile} size={92} className="h-full w-full" />
        </div>
      </div>
      <div className="flex h-full flex-col justify-end gap-1">
        <button
          type="button"
          onClick={onAvatarClick}
          className="text-muted-foreground hover:text-primary cursor-pointer text-sm"
          aria-label="Upload new avatar"
        >
          Upload
        </button>
        {profile.avatarImage && (
          <button
            type="button"
            onClick={onRemoveAvatar}
            className="text-muted-foreground hover:text-destructive cursor-pointer text-sm"
            aria-label="Remove current avatar"
          >
            Remove
          </button>
        )}
      </div>
    </>
  );
}
