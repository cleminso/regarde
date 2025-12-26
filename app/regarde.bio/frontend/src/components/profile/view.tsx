import { co } from 'jazz-tools';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { Button } from '#/components/ui/button';
import { useMyRegardeAccount } from '#/lib/account/useMyRegardeAccount';
import { fetchUserDetailsByNickname } from '#/lib/api/base';
import { RegardeProfile } from '#/lib/schema';
import { logger } from '#/lib/utils/logger';
import { ScrollArea } from '../ui/scroll-area';
import { ProfileHeader } from './header';
import { AboutPage } from './paths/about';
import { NowPage } from './paths/now';
import { DEFAULT_TABS, ProfileTabs, TabId } from './tabs';

type LoadedProfile = co.loaded<typeof RegardeProfile>;

export function ProfileView() {
  const { nickname } = useParams();
  const [otherUserProfile, setOtherUserProfile] =
    useState<LoadedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { account, regardeProfile, userNickname } = useMyRegardeAccount();

  useEffect(() => {
    if (!nickname) {
      setError('No nickname provided');
      setIsLoading(false);
      return;
    }

    if (userNickname === nickname) {
      setOtherUserProfile(null);
      setIsLoading(false);
      return;
    }

    const fetchOtherUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const userDetails = await fetchUserDetailsByNickname(nickname);

        if (!userDetails.exists) {
          setError('Profile not found.');
          setOtherUserProfile(null);
        } else if (userDetails.publicData) {
          setOtherUserProfile(userDetails.publicData as LoadedProfile);
        } else {
          setError('Profile data not available');
          setOtherUserProfile(null);
        }
      } catch (err) {
        logger.error('Error fetching other user profile:', err);
        setError('Failed to load profile');
        setOtherUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOtherUserProfile();
  }, [nickname, account]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <title>Loading...</title>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    const isAuthenticated = !!userNickname;
    const showReturnButton = isAuthenticated;

    return (
      <div className="bg-background flex w-full items-center justify-center">
        <title>Profile Not Found</title>
        <div className="mx-auto space-y-6 p-8 text-center">
          <div className="space-y-2">
            <h1 className="text-foreground text-2xl font-semibold">Oops!</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          {showReturnButton && (
            <div className="space-y-2">
              <Button
                onClick={() => navigate(`/${userNickname}`)}
                variant="default"
                className="font-mono"
              >
                Return to my profile
              </Button>
            </div>
          )}
          {!showReturnButton && (
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="font-mono"
            >
              Go to homepage
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (userNickname === nickname) {
    if (account === undefined) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center">
          <p>Loading...</p>
        </div>
      );
    }

    if (account === null || !account.$isLoaded || !regardeProfile?.$isLoaded) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center">
          <p>Profile not accessible</p>
        </div>
      );
    }

    return <ProfileContent profile={regardeProfile} nickname={nickname} />;
  }

  if (otherUserProfile) {
    return <ProfileContent profile={otherUserProfile} nickname={nickname} />;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <p>This nickname does not seem to exist... :(</p>
    </div>
  );
}

function ProfileContent({
  profile,
  nickname,
}: {
  profile: LoadedProfile;
  nickname?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { nickname: urlNickname } = useParams();

  const pathSegments = location.pathname.split('/');
  const currentPath = pathSegments[pathSegments.length - 1];
  const activeTab: TabId = (currentPath === 'now' ? 'now' : 'about') as TabId;

  const availableTabs = DEFAULT_TABS.map((tab) => {
    if (tab.id === 'now') {
      return {
        ...tab,
        enabled: Boolean(
          profile.nowPage?.$isLoaded && profile.nowPage.description,
        ),
      };
    }
    return tab;
  });

  const handleTabChange = (tab: TabId) => {
    if (urlNickname) {
      navigate(`/${urlNickname}/${tab}`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutPage profile={profile} />;
      case 'now':
        return <NowPage profile={profile} />;

      default:
        return <AboutPage profile={profile} />;
    }
  };

  // For public profiles, use the nickname from URL params
  const pageTitle = `${nickname || 'regarde.bio'}`;

  return (
    <main className="w-full">
      <title>{pageTitle}</title>
      <ProfileHeader profile={profile} nickname={urlNickname} />

      <ScrollArea
        className="mx-auto w-full max-w-full sm:max-w-[580px] sm:px-0"
        viewportClassName="overflow-x-hidden"
      >
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          availableTabs={availableTabs}
          className="mb-4 overflow-x-hidden sm:mb-6"
        />
        {renderTabContent()}
      </ScrollArea>
    </main>
  );
}
