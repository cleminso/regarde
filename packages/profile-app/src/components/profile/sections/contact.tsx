import { Button } from '#/components/ui/button';
import { type CleanLoadedJazzAppProfile } from '#/lib/schema';
import { buildSocialLinks } from '#/lib/utils';

type ContactProps = {
  profile: CleanLoadedJazzAppProfile;
};

export function Contact({ profile }: ContactProps) {
  const socialLinks = buildSocialLinks(profile.socialLinks);

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {socialLinks.map((link) => (
        <Button
          key={link.key}
          asChild
          variant="link"
          size="title"
          title={`Visit ${profile.name}'s ${link.label}: ${link.href}`}
        >
          <a href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        </Button>
      ))}
    </div>
  );
}
