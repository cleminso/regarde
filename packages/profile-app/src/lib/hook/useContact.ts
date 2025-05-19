import { OnboardingProfile, SocialLinks } from '../schema';

type UseContactProps = {
  profile: OnboardingProfile & { socialLinks?: SocialLinks };
  triggerSyncIndicator: () => void;
};

export function useContact({ profile, triggerSyncIndicator }: UseContactProps) {
  const updateSocialLink = (
    field: 'github' | 'twitter' | 'website',
    value: string,
  ) => {
    if (!profile) return;

    const owner = profile._owner;
    if (value && !profile.socialLinks) {
      if (!owner) {
        console.error(
          'Cannot create SocialLinks: profile._owner is undefined.',
        );
        return;
      }
      profile.socialLinks = SocialLinks.create({}, { owner });
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

  return { updateSocialLink };
}
