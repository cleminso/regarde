import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "jazz-react";
import { OnboardingProfile, SocialLinks } from "../../lib/schema.ts";
import { Button, Input, Textarea, Card } from "../ui";

export function ProfileEditor() {
  const { me } = useAccount({ resolve: { profile: { socialLinks: true } } });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (me?.profile) {
      const currentProfile = me.profile as OnboardingProfile;
      setName(currentProfile.name || "");
      setBio(currentProfile.bio || "");
      setAvatar(currentProfile.avatar || "");
      if (currentProfile.socialLinks) {
        setGithub(currentProfile.socialLinks.github || "");
        setTwitter(currentProfile.socialLinks.twitter || "");
        setWebsite(currentProfile.socialLinks.website || "");
      } else {
        setGithub("");
        setTwitter("");
        setWebsite("");
      }
    }
  }, [me]);

  const handleSave = () => {
    if (!me || !me.profile) return;
    const profile = me.profile as OnboardingProfile;

    profile.name = name;
    profile.bio = bio || undefined;
    profile.avatar = avatar || undefined;

    const hasSocialLinksInput = github || twitter || website;

    if (hasSocialLinksInput) {
      if (!profile.socialLinks) {
        profile.socialLinks = SocialLinks.create(
          {
            github: github || undefined,
            twitter: twitter || undefined,
            website: website || undefined,
          },
          { owner: profile._owner },
        );
      } else {
        profile.socialLinks.github = github || undefined;
        profile.socialLinks.twitter = twitter || undefined;
        profile.socialLinks.website = website || undefined;
      }
    } else {
      if (profile.socialLinks) {
        profile.socialLinks = undefined;
      }
    }
    alert("Profile saved!");
  };

  // --- Avatar Specific Handlers ---
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = (file: File | null | undefined) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string); // Set avatar to data URL for preview & save
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert("Please select an image file (e.g., PNG, JPG).");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
    if (e.target) e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).classList.remove("");
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).classList.add("");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).classList.remove("");
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
  };

  if (!me || !me.profile) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[600px]">
        {" "}
        {/* Adjusted for page flow */}
        <Card className="w-[840px] h-[600px] flex items-center justify-center p-6 border-0 shadow-none">
          <div>Loading profile...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-[840px] h-[600px] flex flex-col overflow-hidden p-0 border-0 shadow-none">
        <div className="flex flex-row h-full">
          <div className="w-[25%] flex flex-col pt-6 border-r border-border space-y-4">
            <h2 className="text-xl font-medium px-6">Profile</h2>
            <Button
              variant="ghost"
              className="w-full justify-start px-6 text-left border-l-2 border-border  bg-background hover:bg-background hover:text-foreground"
            >
              General
            </Button>
          </div>

          <div className="w-[75%] flex flex-col p-6 overflow-y-auto">
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
                    (e.key === "Enter" || e.key === " ") && handleAvatarClick()
                  }
                  aria-label="Upload avatar"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover" // Ensure image covers the circle
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
                    onClick={handleRemoveAvatar}
                    className="text-sm text-muted-foreground hover:text-destructive cursor-pointer"
                    aria-label="Remove current avatar"
                  >
                    Remove
                  </button>
                </div>
              )}
            </section>
            {/* === END AVATAR UPLOADER SECTION === */}

            <div className="space-y-4 w-full">
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
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setName(e.target.value);
                  }}
                  placeholder="Your name"
                  className="w-full"
                />
                {!name.trim() && (
                  <small className="text-destructive">Name is required.</small>
                )}
              </div>

              {/* Bio Input Group */}
              <div className="space-y-1">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-foreground"
                >
                  Bio
                </label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setBio(e.target.value);
                  }}
                  placeholder="Share what people should know about you"
                  className="w-full min-h-[100px]"
                />
              </div>

              <h3 className="text-lg font-semibold pt-4 mt-4 border-t border-border text-foreground">
                Social Links
              </h3>

              {/* GitHub Input Group */}
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
                  value={github}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setGithub(e.target.value)
                  }
                  placeholder="your-github-username"
                  className="w-full"
                />
              </div>

              {/* Twitter Input Group */}
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
                  value={twitter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTwitter(e.target.value)
                  }
                  placeholder="@yourTwitterHandle"
                  className="w-full"
                />
              </div>

              {/* Website Input Group */}
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
                  value={website}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWebsite(e.target.value)
                  }
                  placeholder="https://your-website.com"
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!name.trim()}
                className="w-full mt-6"
              >
                Save Profile
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
