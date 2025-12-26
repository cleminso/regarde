import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { Input, Label, Textarea } from '#/components/ui';
import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useNowPage } from '#/lib/hook/useNowPage';
import { RegardeProfile } from '#/lib/schema';
import { EditorFooter } from '../../layout/footer';
import { SectionHeader } from '../../layout/header';

type NowPageViewProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onClose?: () => void;
};

export function NowPageView({
  profile,
  triggerSyncIndicator,
  onClose,
}: NowPageViewProps) {
  const { nowPage, updateNowPage } = useNowPage({
    profile,
    triggerSyncIndicator,
  });

  const [title, setTitle] = useState(
    nowPage && nowPage.$isLoaded ? nowPage.title || '' : '',
  );
  const [location, setLocation] = useState(
    nowPage && nowPage.$isLoaded ? nowPage.location || '' : '',
  );
  const [description, setDescription] = useState(
    nowPage && nowPage.$isLoaded ? nowPage.description || '' : '',
  );

  const handleSave = () => {
    if (description.trim()) {
      updateNowPage({
        title: title.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim(),
      });
    }
    onClose?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col lg:h-full">
      <div className="mobile-form-bottom flex-1 lg:flex-1 lg:pb-0">
        <SectionHeader
          title="Now"
          description={
            <>
              Share what you are doing now. Reference to{' '}
              <a
                href="https://sive.rs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Derek Sivers
              </a>{' '}
              and his{' '}
              <a
                href="https://sive.rs/now2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                now page.
              </a>
            </>
          }
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor="now-title">Title</Label>
                <Input
                  type="text"
                  id="now-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What I'm doing now."
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <Label htmlFor="now-location">Location</Label>
                <Input
                  type="text"
                  id="now-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="From where are you writing?"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex h-full w-full flex-col gap-2">
              <label className="text-foreground block font-sans text-sm">
                Description<sup>*</sup>
              </label>
              <Textarea
                id="now-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share what you're currently working on, learning, or focusing on in your life right now."
                className="min-h-[340px] resize-none"
              />
            </div>
          </section>
        </div>
      </div>

      <EditorFooter
        primaryAction={{
          text: 'Save',
          onClick: handleSave,
        }}
        secondaryAction={{
          text: 'Cancel',
          onClick: handleClose,
        }}
      />
    </div>
  );
}
