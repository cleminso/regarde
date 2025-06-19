import { Loaded } from 'jazz-tools';

import { useContact } from '#/lib/hook/useContact';
import { OnboardingProfile } from '../../../lib/schema';
import { SectionHeader } from '../header';
import { contactFields } from './config';
import { ContactInput } from './input';

type ContactEditProps = {
  profile: Loaded<typeof OnboardingProfile>;
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
    <div className="space-y-6 w-full">
      <SectionHeader
        title="Contact Links"
        description="Connect your social profiles and website"
        onActionClick={onCloseEditor}
        actionText="Close"
      />

      <div className="space-y-4">
        {contactFields.map((field) => (
          <ContactInput
            key={field.id}
            id={field.id}
            icon={field.icon}
            prefix={field.prefix}
            value={profile.socialLinks?.[field.id] || ''}
            onChange={(value) => updateSocialLink(field.id, value)}
            placeholder={field.placeholder}
          />
        ))}
      </div>
    </div>
  );
}
