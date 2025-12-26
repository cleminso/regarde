import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useWriting } from '#/lib/hook/useWriting';
import type { RegardeProfile, Writing } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils/utils';
import { Input, Textarea } from '../../../ui/index';
import { EditorFooter } from '../../layout/footer';
import { SectionHeader } from '../../layout/header';
import { SelectorDate } from '../../shared/selectorDate';

type WritingEditProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onDoneEditing: () => void;
  writingToEdit?: Loaded<typeof Writing>;
};

export function WritingEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  writingToEdit,
}: WritingEditProps) {
  const { addWriting, updateWriting } = useWriting({
    profile,
    triggerSyncIndicator,
  });

  const currentYear = new Date().getFullYear().toString();

  const [title, setTitle] = useState('');
  const [year, setYear] = useState(currentYear);
  const [publisher, setPublisher] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (writingToEdit) {
      setTitle(writingToEdit.title || '');
      setYear(writingToEdit.year || currentYear);
      setPublisher(writingToEdit.publisher || '');
      setUrl(writingToEdit.url || '');
      setDescription(writingToEdit.description || '');
    } else {
      setTitle('');
      setYear(currentYear);
      setPublisher('');
      setUrl('');
      setDescription('');
    }
  }, [writingToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!title.trim()) {
      const shouldContinue = confirm(
        'Adding the article title helps visitors understand your writing. Would you like to save anyway?',
      );
      if (!shouldContinue) return;
    }

    const writingData = {
      title: title.trim(),
      year: year.trim() || undefined,
      publisher: publisher.trim() || undefined,
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
    };

    if (writingToEdit) {
      updateWriting(writingToEdit, writingData);
    } else {
      addWriting(writingData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex h-full flex-col lg:h-full">
      <div className="mobile-form-bottom flex-1 lg:flex-1 lg:pb-0">
        <SectionHeader
          title="Writing"
          description="Share your published articles, papers, and other writing."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  Title<sup>*</sup>
                </label>
                <Input
                  type="text"
                  id="writing-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My great article"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  Year
                </label>
                <SelectorDate
                  id="writing-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholderOption={{
                    value: '',
                    label: 'Select Year',
                    disabled: true,
                  }}
                  buttonDisplayValue={year || currentYear}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  Publisher
                </label>
                <Input
                  type="text"
                  id="writing-publisher"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="On which platform?"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  URL
                </label>
                <Input
                  type="text"
                  id="writing-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex w-full flex-col gap-2">
              <label className="text-foreground block font-sans text-sm">
                Description
              </label>
              <Textarea
                id="writing-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some details"
                className="min-h-[270px] resize-none"
              />
            </div>
          </section>
        </div>
      </div>

      <EditorFooter
        primaryAction={{
          text: 'Save',
          onClick: handleSaveAndClose,
        }}
        secondaryAction={{
          text: 'Cancel',
          onClick: onDoneEditing,
        }}
      />
    </div>
  );
}
