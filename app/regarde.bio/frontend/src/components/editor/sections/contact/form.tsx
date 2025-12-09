import { Loaded } from 'jazz-tools';

import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useContact } from '#/lib/hook/useContact';
import { RegardeProfile } from '#/lib/schema';
import { EditorFooter } from '../../layout/footer';
import { SectionHeader } from '../../layout/header';
import { contactFields } from './config';
import { ContactInput } from './input';

type ContactEditProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onCloseEditor: () => void;
};

export function ContactEdit({
  profile,
  triggerSyncIndicator,
  onCloseEditor,
}: ContactEditProps) {
  const { updateSocialLink } = useContact({ profile, triggerSyncIndicator });

  return (
    <div className="flex flex-col h-full lg:h-full">
      <div className="flex-1 lg:flex-1 mobile-form-bottom lg:pb-0">
        <SectionHeader
          title="Contact Links"
          description="Connect your social profiles and website."
        />

        <div className="space-y-4">
          {contactFields.map((field) => (
            <ContactInput
              key={field.id}
              id={field.id}
              icon={field.icon}
              prefix={field.prefix}
              value={profile.socialLinks?.$isLoaded ? profile.socialLinks[field.id] || '' : ''}
              onChange={(value) => updateSocialLink(field.id, value)}
              placeholder={field.placeholder}
            />
          ))}
        </div>
      </div>

      <EditorFooter
        primaryAction={{
          text: 'Done',
          onClick: onCloseEditor,
        }}
      />
    </div>
  );
}
