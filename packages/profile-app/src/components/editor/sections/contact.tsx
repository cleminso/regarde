import { useContact } from '#/lib/hook/useContact';
import React from 'react';

import { OnboardingProfile, SocialLinks } from '../../../lib/schema';
import { Input } from '../../ui';
import { SectionHeader } from '../header';

type ContactEditProps = {
  profile: OnboardingProfile & { socialLinks?: SocialLinks };
  triggerSyncIndicator: () => void;
  onCloseEditor: () => void;
};

export function ContactEdit({
  profile,
  triggerSyncIndicator,
  onCloseEditor,
}: ContactEditProps) {
  const { updateSocialLink } = useContact({ profile, triggerSyncIndicator });

  return (
    <div className="space-y-4 w-full">
      <SectionHeader
        title="Contact Links"
        description="Link accounts where people's can find you."
        onCloseEditor={onCloseEditor}
      />

      <section className="flex flex-col gap-4 mb-6 space-x-2">
        <div className="space-y-1">
          <label
            htmlFor="github"
            className="block text-sm font-medium text-foreground"
          >
            GitHub
          </label>
          <Input
            type="text"
            id="github"
            value={profile.socialLinks?.github || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateSocialLink('github', e.target.value)
            }
            placeholder="your-github-username"
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="twitter"
            className="block text-sm font-medium text-foreground"
          >
            X / Twitter
          </label>
          <Input
            type="text"
            id="twitter"
            value={profile.socialLinks?.twitter || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateSocialLink('twitter', e.target.value)
            }
            placeholder="@yourTwitterHandle"
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="website"
            className="block text-sm font-medium text-foreground"
          >
            Website
          </label>
          <Input
            type="text"
            id="website"
            value={profile.socialLinks?.website || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateSocialLink('website', e.target.value)
            }
            placeholder="https://your-website.com"
            className="w-full"
          />
        </div>
      </section>
    </div>
  );
}
