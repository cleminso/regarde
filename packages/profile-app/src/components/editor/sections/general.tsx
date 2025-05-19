import React, { useRef } from 'react';

import { OnboardingProfile } from '../../../lib/schema';
import { Button, Input, Textarea } from '../../ui';

type GeneralEditProps = {
  profile: OnboardingProfile;
  triggerSyncIndicator: () => void;
  onCloseEditor: () => void;
};

export function GeneralEdit({
  profile,
  triggerSyncIndicator,
  onCloseEditor,
}: GeneralEditProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = (file: File | null | undefined) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // TODO: Make sure the size is at most 512x512
        if (profile) profile.avatar = reader.result as string;
        triggerSyncIndicator();
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert('Please select an image file (e.g., PNG, JPG).');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).classList.remove('');
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).classList.add('');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).classList.remove('');
  };

  const handleRemoveAvatar = () => {
    if (profile) profile.avatar = undefined;
    triggerSyncIndicator();
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
            className="w-24 h-24 rounded-full bg-background flex justify-center text-center text-muted-foreground cursor-pointer transition-colors overflow-hidden"
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
              className="text-sm text-muted-foreground hover:text-destructive cursor-pointer"
              aria-label="Remove current avatar"
            >
              Remove
            </button>
          </div>
        )}
        <div className="flex flex-col w-full h-full">
          <div className="flex items-center justify-end mb-4 space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseEditor}
              aria-label="Close editor and go to profile"
              title="Close editor"
              className="text-muted-foreground hover:text-foreground text-xl leading-none p-1 w-6 h-6 rounded-sm hover:bg-muted"
            >
              &times;
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-5 h-1/2">
        <div className="space-y-4 w-full h-full">
          <div className="space-y-1">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground"
            >
              Name
            </label>
            <Input
              type="text"
              id="name"
              value={profile.name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (profile) {
                  profile.name = e.target.value;
                  triggerSyncIndicator();
                }
              }}
              placeholder="Your name"
              className="w-full"
            />
            {!profile.name?.trim() && (
              <small className="text-destructive">Name is required.</small>
            )}
          </div>

          <div className="space-y-1 h-full">
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-foreground"
            >
              Bio
            </label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                if (profile) {
                  profile.bio = e.target.value || undefined;
                  triggerSyncIndicator();
                }
              }}
              placeholder="Share what people should know about you"
              className="w-full min-h-full h-max resize-none"
            />
          </div>
        </div>
      </section>
    </>
  );
}
