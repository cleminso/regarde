import { Loaded } from 'jazz-tools';

import { RegardeProfile } from '#/lib/schema';
import { Contact } from './contact';

type AboutProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function About({ profile }: AboutProps) {
  const hasContent =
    profile.bio ||
    (profile.socialLinks?.$isLoaded &&
      (profile.socialLinks.github ||
        profile.socialLinks.twitter ||
        profile.socialLinks.website));

  if (!hasContent) {
    return null;
  }

  return (
    <div className="@container">
      <section className="mx-auto mb-6 flex w-full max-w-[580px] flex-col gap-4">
        {profile.bio && (
          <div>
            <p className="text-muted-foreground wrap-break-words text-sm whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}

        <Contact profile={profile} />
      </section>
    </div>
  );
}
