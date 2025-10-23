import { SocialLinks } from '@regarde-dev/shared-schemas';
import { logger } from '../utils/logger';
import { BaseHookProps } from './types';

type UseContactProps = BaseHookProps;

export function useContact({ profile, triggerSyncIndicator }: UseContactProps) {
  const ensureSocialLinks = () => {
    if (!profile.socialLinks) {
      const owner = profile.$jazz.owner;
      if (!owner) {
        logger.error('Cannot create SocialLinks: profile owner is undefined');
        return undefined;
      }

      const newSocialLinks = SocialLinks.create({
        github: undefined,
        twitter: undefined,
        website: undefined,
      }, { owner });
      profile.$jazz.set("socialLinks", newSocialLinks);
      return newSocialLinks;
    }
    return profile.socialLinks;
  };

  const updateSocialLink = async (
    field: 'github' | 'twitter' | 'website',
    value: string,
  ) => {
    if (!profile) return;

    if (value) {
      const socialLinks = ensureSocialLinks();
      if (!socialLinks) return;
    }

    if (profile.socialLinks) {
      profile.socialLinks.$jazz.set(field, value || undefined);

      if (
        !profile.socialLinks.github &&
        !profile.socialLinks.twitter &&
        !profile.socialLinks.website
      ) {
        profile.$jazz.set("socialLinks", undefined);
      }

      await triggerSyncIndicator(profile);
    }
  };

  return { updateSocialLink };
}
