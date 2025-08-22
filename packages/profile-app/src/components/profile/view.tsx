import { co } from 'jazz-tools';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { Button } from '#/components/ui/button';
import { useMyJazz } from '#/lib/account/useMyJazz';
import { fetchUserDetailsByNickname } from '#/lib/api/base';
import { JazzAppProfile } from '#/lib/schema';
import { ProfileHeader } from './header';
import { AboutPage } from './pages/about';
import { NowPage } from './pages/now';
import { DEFAULT_TABS, ProfileTabs, TabId } from './tabs';

type LoadedProfile = Omit<co.loaded<typeof JazzAppProfile>, 'registrationKey'>;

export function ProfileView() {
  const { nickname } = useParams();
  const [otherUserProfile, setOtherUserProfile] =
    useState<LoadedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { account, jazzAppProfile } = useMyJazz();

  useEffect(() => {
    if (!nickname) {
      setError('No nickname provided');
      setIsLoading(false);
      return;
    }

    if (jazzAppProfile?.userHandle?.nickname === nickname) {
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
        console.error('Error fetching other user profile:', err);
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
      <div className="flex w-full justify-center items-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    const isAuthenticated = !!jazzAppProfile?.userHandle?.nickname;
    const showReturnButton = isAuthenticated;

    return (
      <div className="flex w-full justify-center items-center bg-background">
        <div className="text-center space-y-6 mx-auto p-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Oops!</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          {showReturnButton && (
            <div className="space-y-2">
              <Button
                onClick={() =>
                  navigate(`/${jazzAppProfile.userHandle!.nickname}`)
                }
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

  if (jazzAppProfile?.userHandle?.nickname === nickname) {
    if (account === undefined) {
      return (
        <div className="flex w-full justify-center items-center min-h-screen">
          <p>Loading...</p>
        </div>
      );
    }

    if (account === null || !jazzAppProfile) {
      return (
        <div className="flex w-full justify-center items-center min-h-screen">
          <p>Profile not accessible</p>
        </div>
      );
    }

    return <ProfileContent profile={jazzAppProfile} />;
  }

  if (otherUserProfile) {
    return <ProfileContent profile={otherUserProfile} />;
  }

  return (
    <div className="flex w-full justify-center items-center min-h-screen">
      <p>This nickname does not seem to exist... :(</p>
    </div>
  );
}

function ProfileContent({ profile }: { profile: LoadedProfile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { nickname } = useParams();

  const pathSegments = location.pathname.split('/');
  const currentPath = pathSegments[pathSegments.length - 1];
  const activeTab: TabId = (currentPath === 'now' ? 'now' : 'about') as TabId;

  const availableTabs = DEFAULT_TABS.map((tab) => {
    if (tab.id === 'now') {
      return {
        ...tab,
        enabled: Boolean(profile.nowPage?.description),
      };
    }
    return tab;
  });

  const handleTabChange = (tab: TabId) => {
    if (nickname) {
      navigate(`/${nickname}/${tab}`);
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

  return (
    <main className="w-full">
      <ProfileHeader profile={profile} />

      <div className="w-full" style={{ maxWidth: '540px', margin: '0 auto' }}>
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          availableTabs={availableTabs}
          className="mb-6"
        />
        {renderTabContent()}
      </div>
    </main>
  );
}
