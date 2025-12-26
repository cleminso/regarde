import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useAward } from '#/lib/hook/useAward';
import { Award, RegardeProfile } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils/utils';
import { Input, Textarea } from '../../../ui/index';
import { EditorFooter } from '../../layout/footer';
import { SectionHeader } from '../../layout/header';
import { SelectorDate } from '../../shared/selectorDate';

type AwardEditProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onDoneEditing: () => void;
  awardToEdit?: Loaded<typeof Award>;
};

export function AwardEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  awardToEdit,
}: AwardEditProps) {
  const { addAward, updateAward } = useAward({
    profile,
    triggerSyncIndicator,
  });

  const currentYear = new Date().getFullYear().toString();

  const [title, setTitle] = useState('');
  const [year, setYear] = useState(currentYear);
  const [presenter, setPresenter] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (awardToEdit) {
      setTitle(awardToEdit.title || '');
      setYear(awardToEdit.year || currentYear);
      setPresenter(awardToEdit.presenter || '');
      setUrl(awardToEdit.url || '');
      setDescription(awardToEdit.description || '');
    } else {
      setTitle('');
      setYear(currentYear);
      setPresenter('');
      setUrl('');
      setDescription('');
    }
  }, [awardToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!title.trim()) {
      const shouldContinue = confirm(
        'Adding the award title helps visitors understand your achievement. Would you like to save anyway?',
      );
      if (!shouldContinue) return;
    }

    const awardData = {
      title: title.trim(),
      year: year.trim() || undefined,
      presenter: presenter.trim() || undefined,
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
    };

    if (awardToEdit) {
      updateAward(awardToEdit, awardData);
    } else {
      addAward(awardData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex h-full flex-col lg:h-full">
      <div className="mobile-form-bottom flex-1 lg:flex-1 lg:pb-0">
        <SectionHeader
          title="Awards"
          description="Highlight your achievements and recognitions."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  Award Title<sup>*</sup>
                </label>
                <Input
                  type="text"
                  id="award-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My proud award"
                />
              </div>

              <div className="flex w-full flex-col gap-2 md:flex-col">
                <label className="text-foreground block font-sans text-sm">
                  Year <span className="text-muted-foreground text-xs"></span>
                </label>
                <SelectorDate
                  id="award-year"
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
                  Presenter{' '}
                  <span className="text-muted-foreground text-xs"></span>
                </label>
                <Input
                  type="text"
                  id="award-presenter"
                  value={presenter}
                  onChange={(e) => setPresenter(e.target.value)}
                  placeholder="Where did it happen?"
                />
              </div>

              <div className="flex w-full flex-col gap-2 md:flex-col">
                <label className="text-foreground block font-sans text-sm">
                  Link to award
                </label>
                <Input
                  type="text"
                  id="award-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/award"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex w-full flex-col gap-2 md:flex-col">
              <label className="text-foreground block font-sans text-sm">
                Description
              </label>
              <Textarea
                id="award-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about the award and your achievement"
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
