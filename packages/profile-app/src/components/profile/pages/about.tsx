import { Loaded } from 'jazz-tools';

import { JazzAppProfile } from '#/lib/schema';
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

type AboutPageProps = {
  profile: Loaded<typeof JazzAppProfile>;
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
