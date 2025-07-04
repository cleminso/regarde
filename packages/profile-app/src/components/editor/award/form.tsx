import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { useAward } from '../../../lib/hook/useAward';
import { Award, OnboardingProfile } from '../../../lib/schema';
import { getValidUrl } from '../../../lib/utils';
import { Input, Label, Textarea } from '../../ui/index';
import { EditorFooter } from '../layout/footer';
import { SectionHeader } from '../layout/header';
import { SelectorDate } from '../selectorDate';

type AwardEditProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
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
    if (!title.trim() || !year.trim() || !presenter.trim()) {
      alert('Award Title, Year, and Presenter are required.');
      return;
    }

    const awardData = {
      title: title.trim(),
      year: year.trim(),
      presenter: presenter.trim(),
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
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="Awards"
          description="Highlight your achievements and recognitions."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="award-title">
                  Award Title<sup>*</sup>
                </Label>
                <Input
                  type="text"
                  id="award-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My proud award"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="award-year">
                  Year<sup>*</sup>
                </Label>
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
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="award-presenter">
                  Presenter<sup>*</sup>
                </Label>
                <Input
                  type="text"
                  id="award-presenter"
                  value={presenter}
                  onChange={(e) => setPresenter(e.target.value)}
                  placeholder="Where did it happen?"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="award-url">Link to award</Label>
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
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="award-description">Description</Label>
              <Textarea
                id="award-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about the award and your achievement"
                className="min-h-[200px] resize-none"
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
