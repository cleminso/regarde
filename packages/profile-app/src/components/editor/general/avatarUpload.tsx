import React from 'react';

export type AvatarUploadProps = {
  avatar: string | null | undefined;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemoveAvatar: () => void;
};

export function AvatarUpload({
  avatar,
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
          className="w-24 h-24 rounded-full bg-background flex justify-center text-sm text-center text-muted-foreground cursor-pointer transition-colors overflow-hidden hover:bg-accent"
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === 'Enter' || e.key === ' ') && onAvatarClick()
          }
          aria-label="Upload avatar"
        >
          {avatar ? (
            <img
              src={avatar}
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
      {avatar && (
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
