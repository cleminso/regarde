import { type CleanLoadedJazzAppProfile } from '#/lib/schema';
import { Contact } from './contact';

type AboutProps = {
  profile: CleanLoadedJazzAppProfile;
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
    <section
      className="mx-auto flex flex-col gap-6 mb-10"
      style={{ width: '540px' }}
    >
      {profile.bio && (
        <div>
          <p className="text-sm text-secondary-foreground whitespace-pre-line">
            {profile.bio}
          </p>
        </div>
      )}

      <Contact profile={profile} />
    </section>
  );
}
