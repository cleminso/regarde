import { useState, useEffect } from "react";
import { useAccount } from "jazz-react";
import { OnboardingProfile, SocialLinks } from "@onboarding.jazz/sdk";
import { Button, Input, Textarea } from "@/components/ui";

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

  // Cast to OnboardingProfile after ensuring it and me exist.
  // `resolve` in useAccount should ensure `profile` and `socialLinks` are loaded.
  const profile = me.profile as OnboardingProfile;

  const handleSave = () => {
    // Ensure profile object is available
    if (!profile) return;

    profile.name = name;
    profile.bio = bio || undefined;
    profile.avatar = avatar || undefined;

    const hasSocialLinksInput = github || twitter;

    if (hasSocialLinksInput) {
      if (!profile.socialLinks) {
        // Create SocialLinks if it doesn't exist and there's input.
        // It should be owned by the same group as the profile itself for consistent permissions.
        profile.socialLinks = SocialLinks.create(
          {
            github: github || undefined,
            twitter: twitter || undefined,
            website: website || undefined,
          },
          { owner: profile._owner }, // profile._owner is the CoID of the group owning the profile
        );
      } else {
        // Update existing SocialLinks
        profile.socialLinks.github = github || undefined;
        profile.socialLinks.twitter = twitter || undefined;
        profile.socialLinks.website = website || undefined;
      }
    } else {
      // No social link input, clear existing social links reference
      if (profile.socialLinks) {
        profile.socialLinks = undefined;
      }
    }
    alert("Profile saved!"); // Simple feedback
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-semibold text-center">Edit Profile</h2>
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Name:
        </label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            me.profile.name = e.target.value;
          }}
          placeholder="Your name"
        />
        {!name.trim() && (
          <small className="text-red-600">Name is required.</small>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="bio" className="block text-sm font-medium">
          Bio:
        </label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            me.profile.bio = e.target.value;
          }}
          placeholder="Tell us a bit about yourself"
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
          onChange={(e) => setAvatar(e.target.value)}
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
          onChange={(e) => setGithub(e.target.value)}
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
          onChange={(e) => setTwitter(e.target.value)}
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
          onChange={(e) => setWebsite(e.target.value)}
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
