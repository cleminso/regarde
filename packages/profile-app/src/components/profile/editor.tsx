import React, { useState, useEffect } from "react";
import { useAccount } from "jazz-react";
import { OnboardingProfile, SocialLinks } from "../../lib/schema.ts";
import { Button, Input, Textarea } from "../ui";

export function ProfileEditor() {
  const { me } = useAccount({ resolve: { profile: { socialLinks: true } } });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");

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

  if (!me || !me.profile) {
    return <div>Loading profile...</div>;
  }

  // `resolve` in useAccount should ensure `profile` and `socialLinks` are loaded.
  const profile = me.profile as OnboardingProfile;

  const handleSave = () => {
    if (!profile) return;

    profile.name = name;
    profile.bio = bio || undefined;
    profile.avatar = avatar || undefined;

    const hasSocialLinksInput = github || twitter || website;

    if (hasSocialLinksInput) {
      if (!profile.socialLinks) {
        // It should be owned by the same group as the profile itself for consistent permissions.
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

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Name:
        </label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setName(e.target.value);
            profile.name = e.target.value;
          }}
          placeholder="Your name"
        />
        {!name.trim() && (
          <small className="text-destructive">Name is required.</small>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="bio" className="block text-sm font-medium">
          Bio:
        </label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setBio(e.target.value);
            profile.bio = e.target.value;
          }}
          placeholder="Share what people should know about you"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="avatar" className="block text-sm font-medium">
          Avatar URL:
        </label>
        <Input
          type="text"
          id="avatar"
          value={avatar}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAvatar(e.target.value)
          }
          placeholder="https://example.com/avatar.png"
        />
      </div>

      <h3 className="text-xl font-semibold pt-2">Social Links</h3>
      <div className="space-y-2">
        <label htmlFor="github" className="block text-sm font-medium">
          GitHub Username:
        </label>
        <Input
          type="text"
          id="github"
          value={github}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setGithub(e.target.value)
          }
          placeholder="your-github-username"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="twitter" className="block text-sm font-medium">
          Twitter Handle:
        </label>
        <Input
          type="text"
          id="twitter"
          value={twitter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTwitter(e.target.value)
          }
          placeholder="@yourTwitterHandle"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="website" className="block text-sm font-medium">
          Website
        </label>
        <Input
          type="text"
          id="website"
          value={website}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setWebsite(e.target.value)
          } // Typed 'e'
          placeholder="https://your-website"
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!name.trim()}
        className="w-full mt-4"
      >
        Save Profile
      </Button>
    </div>
  );
}
