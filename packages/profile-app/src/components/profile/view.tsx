import { useAccount } from 'jazz-react';
import { Loaded } from 'jazz-tools';
import { useParams } from 'react-router';

import { OnboardingAccount, OnboardingProfile } from '#/lib/schema.ts';
import { ProfileHeader } from './header.tsx';
import { About, Contact, Projects, WorkExp } from './index.tsx';

export function ProfileView() {
  const { nickname } = useParams();
  console.log('Nickname', nickname);
  const { me } = useAccount(OnboardingAccount, {
    resolve: {
      profile: {
        socialLinks: true,
        projects: true,
        workExp: true,
      },
    },
  });

  if (!me || !me.profile) {
    return (
      <div className="flex w-full justify-center items-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  const profile = me.profile as Loaded<typeof OnboardingProfile>;

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

  const websiteUrl = profile.socialLinks?.website;
  const websiteHref = getHref(websiteUrl);
  const websiteDisplayName = getWebsiteDisplayName(websiteUrl);

  return (
    <main className="w-full py-8">
      <ProfileHeader
        profile={profile}
        websiteHref={websiteHref}
        websiteDisplayName={websiteDisplayName}
      />
      <About profile={profile} />

      <Contact profile={profile} />

      <Projects profile={profile} />

      <WorkExp profile={profile} />
    </main>
  );
}
