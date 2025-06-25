import { Loaded } from 'jazz-tools';

import { OnboardingProfile } from '#/lib/schema';

type AboutProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function About({ profile }: AboutProps) {
  if (!profile.bio) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-2 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans text-foreground">About</h3>
      <p className="text-sm text-secondary-foreground whitespace-pre-line">
        {profile.bio}
      </p>
    </section>
  );
}
