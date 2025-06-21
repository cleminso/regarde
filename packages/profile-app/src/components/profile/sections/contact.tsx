import { Loaded } from 'jazz-tools';

import { Button } from '#/components/ui/button';
import { OnboardingProfile } from '#/lib/schema';
import { getValidUrl, getWebsiteDisplayName } from '#/lib/utils';

const socialLinkConfigs: {
  key: 'github' | 'twitter' | 'website';
  label: string;
}[] = [
  { key: 'github', label: 'GitHub' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'website', label: 'Website' },
];

type ContactProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function Contact({ profile }: ContactProps) {
  const availableSocialLinks = socialLinkConfigs
    .map((config) => {
      const urlValue = profile.socialLinks?.[config.key];
      if (!urlValue) {
        return null;
      }
      const hrefValue = getValidUrl(urlValue);
      const displayNameValue = getWebsiteDisplayName(urlValue);

      if (!hrefValue || !displayNameValue) {
        return null;
      }

      return {
        key: config.key,
        label: config.label,
        url: urlValue,
        href: hrefValue,
        displayName: displayNameValue,
      };
    })
    .filter((link) => link !== null) as {
    key: 'github' | 'twitter' | 'website';
    label: string;
    url: string;
    href: string;
    displayName: string;
  }[];

  if (availableSocialLinks.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-3 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans text-foreground">Contact</h3>
      <div className="flex flex-col gap-2.5">
        {availableSocialLinks.map((link) => (
          <div key={link.key} className="flex w-full items-center">
            <div className="w-1/4 text-sm text-secondary-foreground capitalize">
              {link.label}
            </div>
            <div className="w-3/4">
              <Button
                asChild
                variant="link"
                size="title"
                title={`Visit ${profile.name}'s ${link.label}: ${link.href}`}
              >
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.displayName}
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
