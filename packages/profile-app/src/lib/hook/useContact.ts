import { SocialLinks } from '@onboarding.jazz/shared-schemas';
import { logger } from '../utils/logger';
import { BaseHookProps } from './types';

type UseContactProps = BaseHookProps;

export function useContact({ profile, triggerSyncIndicator }: UseContactProps) {
  const ensureSocialLinks = () => {
    if (!profile.socialLinks) {
      const owner = profile._owner;
      if (!owner) {
        logger.error('Cannot create SocialLinks: profile owner is undefined');
        return undefined;
      }
      
      profile.socialLinks = SocialLinks.create({
        github: undefined,
        twitter: undefined,
        website: undefined,
      }, { owner });
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
      profile.socialLinks[field] = value || undefined;

      if (
        !profile.socialLinks.github &&
        !profile.socialLinks.twitter &&
        !profile.socialLinks.website
      ) {
        profile.socialLinks = undefined;
      }
      
      await triggerSyncIndicator(profile); 
    }
  };

  return { updateSocialLink };
}
