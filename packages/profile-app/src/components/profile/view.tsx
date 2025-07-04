import { Loaded } from 'jazz-tools';
import { useAccount } from 'jazz-tools/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import { fetchUserDetailsByNickname } from '#/lib/api/base';
import { OnboardingAccount, OnboardingProfile } from '#/lib/schema';
import { ProfileHeader } from './header';
import {
  About,
  Awards,
  Certifications,
  Contact,
  Educations,
  Projects,
  SideProjects,
  Speakings,
  Volunteerings,
  WorkExperiences,
  Writings,
} from './index';

export function ProfileView() {
  const { nickname } = useParams();
  const [profile, setProfile] = useState<Loaded<
    typeof OnboardingProfile
  > | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nicknameExists, setNicknameExists] = useState<boolean | null>(false);

  const { me } = useAccount(OnboardingAccount, {
    resolve: {
      profile: {
        socialLinks: true,
        projects: true,
        sideProject: true,
        workExp: true,
        writing: true,
        education: true,
        certification: true,
        speaking: true,
        award: true,
        volunteering: true,
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
            setNicknameExists(true);
            setIsLoading(false);
          }
        } else {
          if (publicData) {
            setProfile(publicData as any);
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
      ) : nicknameExists && profile ? (
        <main className="w-full">
          <ProfileHeader profile={profile} />
          <About profile={profile} />
          <Contact profile={profile} />
          <Projects profile={profile} />
          <WorkExperiences profile={profile} />
          <Writings profile={profile} />
          <Awards profile={profile} />
          <Certifications profile={profile} />
          <Educations profile={profile} />
          <Speakings profile={profile} />
          <Volunteerings profile={profile} />
          <SideProjects profile={profile} />
        </main>
      ) : (
        <div className="flex w-full justify-center items-center min-h-screen">
          <p>This nickname does not seem to exist... :(</p>
        </div>
      )}
    </>
  );
}
