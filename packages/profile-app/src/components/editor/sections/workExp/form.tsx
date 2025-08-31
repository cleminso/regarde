import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useWorkExp } from '#/lib/hook/useWorkExp';
import type { JazzAppProfile, WorkExp } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils/utils';
import { Input, Textarea } from '../../../ui/index';
import { EditorFooter } from '../../layout/footer';
import { SectionHeader } from '../../layout/header';
import { SelectorDate } from '../../shared/selectorDate';

type WorkExpEditProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onDoneEditing: () => void;
  workExpToEdit?: Loaded<typeof WorkExp>;
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
      setFromDate(workExpToEdit.from || currentYear);
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
      from: fromDate.trim(),
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  From<sup>*</sup>
                </label>
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
                <label className="text-sm font-sans block text-foreground">
                  To
                </label>
                <SelectorDate
                  id="work-to-date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholderOption={{ value: '', label: 'Now' }}
                  buttonDisplayValue={toDate || 'Now'}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  Title<sup>*</sup>
                </label>
                <Input
                  type="text"
                  id="work-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Designer, Engineer, etc"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  Company<sup>*</sup>
                </label>
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  Location
                </label>
                <Input
                  type="text"
                  id="work-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where was it?"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  URL
                </label>
                <Input
                  type="text"
                  id="work-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://company.com"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-sans block text-foreground">
                Description
              </label>
              <Textarea
                id="work-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your role and achievements"
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
