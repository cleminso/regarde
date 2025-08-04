import { co } from 'jazz-tools';

import { OnboardingProfile } from '#/lib/schema';
import {
  About,
  Awards,
  Certifications,
  Educations,
  Projects,
  SideProjects,
  Speakings,
  Volunteerings,
  WorkExperiences,
  Writings,
} from '../index';

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
  }
>;

type AboutPageProps = {
  profile: LoadedProfile;
};

export function AboutPage({ profile }: AboutPageProps) {
  return (
    <div className="w-full">
      <About profile={profile} />
      <Projects profile={profile} />
      <WorkExperiences profile={profile} />
      <Writings profile={profile} />
      <Awards profile={profile} />
      <Certifications profile={profile} />
      <Educations profile={profile} />
      <Speakings profile={profile} />
      <Volunteerings profile={profile} />
      <SideProjects profile={profile} />
    </div>
  );
}
