import { Loaded } from 'jazz-tools';

import { RegardeProfile } from '#/lib/schema';
import { Contact } from './contact';

type AboutProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function About({ profile }: AboutProps) {
  const hasContent =
    profile.bio ||
    profile.socialLinks?.github ||
    profile.socialLinks?.twitter ||
    profile.socialLinks?.website;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="@container">
      <section className="w-full max-w-[580px] mx-auto flex flex-col gap-4 mb-6">
        {profile.bio && (
          <div>
            <p className="text-sm text-muted-foreground whitespace-pre-line break-words">
              {profile.bio}
            </p>
          </div>
        )}

        <Contact profile={profile} />
      </section>
    </div>
  );
}
