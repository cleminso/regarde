import { useAccount } from 'jazz-react';
import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import { fetchUserDetailsByNickname } from '#/lib/api.ts';
import { OnboardingAccount, OnboardingProfile } from '#/lib/schema.ts';
import { ProfileHeader } from './header.tsx';
import { About, Contact, Projects, WorkExp } from './index.tsx';

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

export function ProfileView() {
  const { nickname } = useParams();
  const [profile, setProfile] = useState<Loaded<
    typeof OnboardingProfile
  > | null>(null);
  const [websiteHref, setWebsiteHref] = useState<string | null>(null);
  const [websiteDisplayName, setWebsiteDisplayName] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nicknameExists, setNicknameExists] = useState<boolean | null>(false);

  const { me } = useAccount(OnboardingAccount, {
    resolve: {
      profile: {
        socialLinks: true,
        projects: true,
        workExp: true,
      },
    },
  });

  useEffect(() => {
    console.log('Nickname', nickname);

    if (!nickname) {
      setNicknameExists(false);
      setIsLoading(false);
      return;
    }

    if (me?.profile?.nickname === nickname) {
      setProfile(me.profile);
      setWebsiteHref(getHref(me.profile.socialLinks?.website) ?? null);
      setWebsiteDisplayName(
        getWebsiteDisplayName(me.profile.socialLinks?.website) ?? null,
      );
      setNicknameExists(true);
      setIsLoading(false);
      return;
    }

    fetchUserDetailsByNickname(nickname).then(
      ({ exists, jazzAccountId, publicData }) => {
        if (!exists) {
          setNicknameExists(false);
          setIsLoading(false);
          return;
        }

        if (jazzAccountId === me?.id) {
          if (me && me.profile) {
            setProfile(me.profile);
            setWebsiteHref(getHref(me.profile.socialLinks?.website) ?? null);
            setWebsiteDisplayName(
              getWebsiteDisplayName(me.profile.socialLinks?.website) ?? null,
            );
            setNicknameExists(true);
            setIsLoading(false);
          }
        } else {
          if (publicData) {
            setProfile(publicData);
            setWebsiteHref(getHref(publicData.socialLinks?.website) ?? null);
            setWebsiteDisplayName(
              getWebsiteDisplayName(publicData.socialLinks?.website) ?? null,
            );
            setNicknameExists(true);
            setIsLoading(false);
          }
        }
      },
    );
  }, [me, nickname]);

  return (
    <>
      {isLoading ? (
        <div className="flex w-full justify-center items-center min-h-screen">
          <p>Loading profile...</p>
        </div>
      ) : nicknameExists ? (
        <main className="w-full py-8">
          <ProfileHeader
            profile={profile}
            websiteHref={websiteHref ?? ''}
            websiteDisplayName={websiteDisplayName ?? ''}
          />
          <About profile={profile} />
          <Contact profile={profile} />
          <Projects profile={profile} />
          <WorkExp profile={profile} />
        </main>
      ) : (
        <div className="flex w-full justify-center items-center min-h-screen">
          <p>This nickname does not seem to exist... :(</p>
        </div>
      )}
    </>
  );
}
