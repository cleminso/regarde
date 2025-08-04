import { co } from 'jazz-tools';
import { useAccount } from 'jazz-tools/react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { fetchUserDetailsByNickname } from '#/lib/api/base';
import { OnboardingAccount, OnboardingProfile } from '#/lib/schema';
import { ProfileHeader } from './header';
import { AboutPage } from './pages/about';
import { NowPage } from './pages/now';
import { DEFAULT_TABS, ProfileTabs, TabId } from './tabs';

type LoadedProfile = co.loaded<
  typeof OnboardingProfile,
  {
    socialLinks: true;
    projects: true;
    workExp: true;
    writing: true;
    education: true;
    certification: true;
    speaking: true;
    award: true;
    volunteering: true;
    sideProject: true;
    nowPage: true;
  }
>;

export function ProfileView() {
  const { nickname } = useParams();
  const [otherUserProfile, setOtherUserProfile] =
    useState<LoadedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { me } = useAccount(OnboardingAccount, {
    resolve: {
      profile: {
        socialLinks: true,
        projects: true,
        workExp: true,
        writing: true,
        education: true,
        certification: true,
        speaking: true,
        award: true,
        volunteering: true,
        sideProject: true,
        nowPage: true,
        onboarding: true,
      },
    },
  });

  useEffect(() => {
    if (!nickname) {
      setError('No nickname provided');
      setIsLoading(false);
      return;
    }

    if (me?.profile.onboarding?.nickname === nickname) {
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
          setError('Profile not found');
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
  }, [nickname, me]);

  if (isLoading) {
    return (
      <div className="flex w-full justify-center items-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full justify-center items-center min-h-screen">
        <p>{error}</p>
      </div>
    );
  }

  if (me?.profile.onboarding?.nickname === nickname) {
    if (me === undefined) {
      return (
        <div className="flex w-full justify-center items-center min-h-screen">
          <p>Loading...</p>
        </div>
      );
    }

    if (me === null || !me.profile) {
      return (
        <div className="flex w-full justify-center items-center min-h-screen">
          <p>Profile not accessible</p>
        </div>
      );
    }

    return <ProfileContent profile={me.profile} />;
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
      </div>

      {renderTabContent()}
    </main>
  );
}
