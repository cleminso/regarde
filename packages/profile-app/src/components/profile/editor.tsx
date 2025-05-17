import { useAccount } from 'jazz-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { OnboardingProfile, SocialLinks } from '../../lib/schema.ts';
import { Badge, Button, Card, Input, Textarea } from '../ui';

export function ProfileEditor() {
  const { me } = useAccount({
    resolve: { profile: { socialLinks: true } },
  }) as { me: { profile: OnboardingProfile & { socialLinks?: SocialLinks } } };

  const [activeSection, setActiveSection] = useState<'general' | 'contact'>(
    'general',
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncState, setSyncState] = useState<'saved' | 'syncing'>('saved');
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();

  const triggerSyncIndicator = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    setSyncState('syncing');
    timeoutIdRef.current = setTimeout(() => {
      setSyncState('saved');
      timeoutIdRef.current = null;
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = (file: File | null | undefined) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // TODO: Make sure the size is at most 512x512
        if (me && me.profile) me.profile.avatar = reader.result as string;
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
    if (me && me.profile) me.profile.avatar = undefined;
    triggerSyncIndicator();
  };

  const handleSocialLinkChange = (
    field: 'github' | 'twitter' | 'website',
    value: string,
  ) => {
    if (!me || !me.profile) return;
    const profile = me.profile as OnboardingProfile & {
      socialLinks?: SocialLinks;
    };

    if (value && !profile.socialLinks) {
      profile.socialLinks = SocialLinks.create({}, { owner: profile._owner });
    }

    if (profile.socialLinks) {
      profile.socialLinks[field] = value || undefined;

      if (
        !profile.socialLinks.github &&
        !profile.socialLinks.twitter &&
        !profile.socialLinks.website
      ) {
        profile.socialLinks = undefined;
      }
      triggerSyncIndicator();
    }
  };

  const handleCloseEditor = () => {
    navigate('/profile');
  };

  if (!me || !me.profile) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[600px]">
        <Card className="w-[840px] h-[600px] flex items-center justify-center p-6 border-0 shadow-none">
          <div>Loading profile...</div>
        </Card>
      </div>
    );
  }

  const sidebarButtonBaseClasses = 'w-full justify-start px-6 text-left';
  const activeSidebarButtonClasses =
    'border-l-2 border-border bg-background text-foreground hover:bg-background hover:text-foreground';
  const inactiveSidebarButtonClasses =
    'text-muted-foreground hover:text-foreground hover:bg-background';

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-[840px] h-[600px] flex flex-col overflow-hidden p-0 border-0 shadow-none">
        <div className="flex flex-row h-full">
          <div className="w-[25%] flex flex-col pt-6 border-r border-border space-y-1">
            <h2 className="text-xl font-medium px-6 pb-3">Profile</h2>
            <Button
              variant="ghost"
              onClick={() => setActiveSection('general')}
              className={`${sidebarButtonBaseClasses} ${
                activeSection === 'general'
                  ? activeSidebarButtonClasses
                  : inactiveSidebarButtonClasses
              }`}
            >
              General
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveSection('contact')}
              className={`${sidebarButtonBaseClasses} ${
                activeSection === 'contact'
                  ? activeSidebarButtonClasses
                  : inactiveSidebarButtonClasses
              }`}
            >
              Contact
            </Button>
          </div>

          <div className="w-[75%] flex flex-col p-6 overflow-y-auto">
            {activeSection === 'general' && (
              <>
                {/* === AVATAR UPLOAD SECTION === */}
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
                        (e.key === 'Enter' || e.key === ' ') &&
                        handleAvatarClick()
                      }
                      aria-label="Upload avatar"
                    >
                      {me.profile.avatar ? (
                        <img
                          src={me.profile.avatar}
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
                  {me.profile.avatar && (
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
                    {/* Status Badge and Close Button - pushed to end */}
                    <div className="flex items-center justify-end mb-4 space-x-2">
                      <Badge
                        className={
                          syncState === 'saved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }
                      >
                        {syncState === 'saved' ? 'Saved' : 'Syncing...'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCloseEditor}
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
                        value={me.profile.name || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (me.profile) {
                            me.profile.name = e.target.value;
                            triggerSyncIndicator();
                          }
                        }}
                        placeholder="Your name"
                        className="w-full"
                      />
                      {!me.profile.name?.trim() && (
                        <small className="text-destructive">
                          Name is required.
                        </small>
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
                        value={me.profile.bio || ''}
                        onChange={(
                          e: React.ChangeEvent<HTMLTextAreaElement>,
                        ) => {
                          if (me.profile) {
                            me.profile.bio = e.target.value || undefined;
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
            )}

            {activeSection === 'contact' && (
              <div className="space-y-4 w-full">
                <section className="flex mb-6 space-x-2">
                  <div className="w-full">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Social Links
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Link accounts where people's can find you.
                    </p>
                  </div>
                  <div className="flex flex-col h-full">
                    {/* Status Badge and Close Button - pushed to end */}
                    <div className="flex items-center justify-end mb-4 space-x-2">
                      <Badge
                        className={
                          syncState === 'saved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }
                      >
                        {syncState === 'saved' ? 'Saved' : 'Syncing...'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCloseEditor}
                        aria-label="Close editor and go to profile"
                        title="Close editor"
                        className="text-muted-foreground hover:text-foreground text-xl leading-none p-1 w-6 h-6 rounded-sm hover:bg-muted"
                      >
                        &times;
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-4 mb-6 space-x-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="github"
                      className="block text-sm font-medium text-foreground"
                    >
                      GitHub
                    </label>
                    <Input
                      type="text"
                      id="github"
                      value={me.profile.socialLinks?.github || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleSocialLinkChange('github', e.target.value)
                      }
                      placeholder="your-github-username"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="twitter"
                      className="block text-sm font-medium text-foreground"
                    >
                      Twitter
                    </label>
                    <Input
                      type="text"
                      id="twitter"
                      value={me.profile.socialLinks?.twitter || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleSocialLinkChange('twitter', e.target.value)
                      }
                      placeholder="@yourTwitterHandle"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium text-foreground"
                    >
                      Website
                    </label>
                    <Input
                      type="text"
                      id="website"
                      value={me.profile.socialLinks?.website || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleSocialLinkChange('website', e.target.value)
                      }
                      placeholder="https://your-website.com"
                      className="w-full"
                    />
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
