import { SocialLinks } from "@regarde-dev/jazz-schemas/regarde.bio";

import { logger } from "../utils/logger";

import { BaseHookProps } from "./types";

type UseContactProps = BaseHookProps;

export function useContact({ profile, triggerSyncIndicator }: UseContactProps) {
  const ensureSocialLinks = () => {
    if (!profile.$isLoaded) {
      logger.error("Profile is not loaded");
      return undefined;
    }

    if (profile.socialLinks?.$isLoaded) {
      return profile.socialLinks;
    }

    // Create new SocialLinks if it doesn't exist
    const owner = profile.$jazz.owner;
    if (!owner?.$isLoaded) {
      logger.error("Cannot create SocialLinks: profile owner is not loaded");
      return undefined;
    }

    const newSocialLinks = SocialLinks.create(
      {
        github: undefined,
        twitter: undefined,
        website: undefined,
      },
      { owner },
    );
    profile.$jazz.set("socialLinks", newSocialLinks);
    return newSocialLinks;
  };

  const updateSocialLink = async (field: "github" | "twitter" | "website", value: string) => {
    if (!profile.$isLoaded) return;

    if (value) {
      const socialLinks = ensureSocialLinks();
      if (!socialLinks?.$isLoaded) return;
    }

    if (profile.socialLinks?.$isLoaded) {
      profile.socialLinks.$jazz.set(field, value || undefined);

      if (
        profile.socialLinks.github === null &&
        profile.socialLinks.twitter === null &&
        profile.socialLinks.website === null
      ) {
        profile.$jazz.set("socialLinks", undefined);
      }

      await triggerSyncIndicator(profile);
    }
  };

  return { updateSocialLink };
}
