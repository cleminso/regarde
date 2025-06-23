import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { useWorkExp } from '../../../lib/hook/useWorkExp';
import { OnboardingProfile, WorkExp } from '../../../lib/schema';
import { getValidUrl } from '../../../lib/utils';
import { Input, Label, Textarea } from '../../ui/index';
import { EditorFooter } from '../layout/footer';
import { SectionHeader } from '../layout/header';
import { SelectorDate } from '../selectorDate';

type WorkExpEditProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  onDoneEditing: () => void;
  workExpToEdit?: Loaded<typeof WorkExp>;
};

const formatDate = (date?: Date): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear().toString();
};

export function WorkExpEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  workExpToEdit,
}: WorkExpEditProps) {
  const { addWorkExp, updateWorkExp } = useWorkExp({
    profile,
    triggerSyncIndicator,
  });

  const currentYear = new Date().getFullYear().toString();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [fromDate, setFromDate] = useState(currentYear);
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (workExpToEdit) {
      setTitle(workExpToEdit.title || '');
      setCompany(workExpToEdit.company || '');
      setLocation(workExpToEdit.location || '');
      setUrl(workExpToEdit.url || '');
      setDescription(workExpToEdit.description || '');
      setFromDate(formatDate(workExpToEdit.from) || currentYear);
      setToDate(workExpToEdit.to || '');
    } else {
      setTitle('');
      setCompany('');
      setLocation('');
      setUrl('');
      setDescription('');
      setFromDate(currentYear);
      setToDate('');
    }
  }, [workExpToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!title.trim() || !company.trim() || !fromDate.trim()) {
      alert('Title, Company, and From Date are required.');
      return;
    }

    const workExpData = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim() || undefined,
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
      from: new Date(parseInt(fromDate, 10), 0, 1),
      to: toDate.trim() || undefined,
    };

    if (workExpToEdit) {
      updateWorkExp(workExpToEdit, workExpData);
    } else {
      addWorkExp(workExpData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="Work Experience"
          description="Detail your professional roles and responsibilities."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="work-from-date">
                  From<sup>*</sup>
                </Label>
                <SelectorDate
                  id="work-from-date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholderOption={{
                    value: '',
                    label: 'Select Year',
                    disabled: true,
                  }}
                  buttonDisplayValue={fromDate || 'Select Year'}
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="work-to-date">To</Label>
                <SelectorDate
                  id="work-to-date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholderOption={{ value: '', label: 'Present' }}
                  buttonDisplayValue={toDate || 'Present'}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="work-title">
                  Title<sup>*</sup>
                </Label>
                <Input
                  type="text"
                  id="work-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Designer, Engineer, etc"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="work-company">
                  At Company<sup>*</sup>
                </Label>
                <Input
                  type="text"
                  id="work-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="work-location">Location</Label>
                <Input
                  type="text"
                  id="work-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where was it"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="work-url">URL</Label>
                <Input
                  type="text"
                  id="work-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="company.com or https://company.com"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="work-description">Description</Label>
              <Textarea
                id="work-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your role and achievements..."
                className="min-h-[180px] resize-none"
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
