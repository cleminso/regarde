import { OnboardingProfile } from '#/lib/schema.ts';

import { Button } from '../../ui/button.tsx';

const socialLinkConfigs: {
  key: 'github' | 'twitter' | 'website';
  label: string;
}[] = [
  { key: 'github', label: 'GitHub' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'website', label: 'Website' },
];

const getHref = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

const getWebsiteDisplayName = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    const fullUrl =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;
    const parsedUrl = new URL(fullUrl);
    let hostname = parsedUrl.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    if (parsedUrl.pathname !== '/' && parsedUrl.pathname !== '') {
      const path = parsedUrl.pathname.startsWith('/')
        ? parsedUrl.pathname.substring(1)
        : parsedUrl.pathname;
      const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
      if (cleanPath) {
        hostname = `${hostname}/${cleanPath}`;
      }
    }
    return hostname;
  } catch (e) {
    let displayName = url.replace(/^https?:\/\//, '');
    if (displayName.startsWith('www.')) {
      displayName = displayName.substring(4);
    }
    if (displayName.endsWith('/')) {
      displayName = displayName.slice(0, -1);
    }
    return displayName;
  }
};

type ContactProps = {
  profile: OnboardingProfile;
};

export function Contact({ profile }: ContactProps) {
  const availableSocialLinks = socialLinkConfigs
    .map((config) => {
      const urlValue = profile.socialLinks?.[config.key];
      if (!urlValue) {
        return null;
      }
      const hrefValue = getHref(urlValue);
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

  return (
    <section
      className="mx-auto flex flex-col gap-3 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-lg font-semibold">Contact</h3>
      {availableSocialLinks.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {' '}
          {availableSocialLinks.map((link) => (
            <div key={link.key} className="flex w-full items-center">
              <div className="w-1/4 text-sm text-muted-foreground capitalize">
                {link.label}
              </div>
              <div className="w-3/4">
                <Button
                  asChild
                  variant="link"
                  className="p-0 h-auto justify-start text-sm font-medium text-primary hover:text-primary/90"
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
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No contact links provided.
        </p>
      )}
    </section>
  );
}
