import { Loaded } from 'jazz-tools';

import { OnboardingProfile } from '#/lib/schema.ts';

type AboutProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function About({ profile }: AboutProps) {
  return (
    <section
      className="mx-auto flex flex-col gap-2 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans">About</h3>{' '}
      {profile.bio ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {profile.bio}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">No bio provided.</p>
      )}
    </section>
  );
}
