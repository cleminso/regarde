import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { useWorkExp } from '../../../lib/hook/useWorkExp';
import { OnboardingProfile, WorkExp } from '../../../lib/schema';
import { Input, Textarea } from '../../ui/index';
import { SectionHeader } from '../header';
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

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (workExpToEdit) {
      setTitle(workExpToEdit.title || '');
      setCompany(workExpToEdit.company || '');
      setLocation(workExpToEdit.location || '');
      setUrl(workExpToEdit.url || '');
      setDescription(workExpToEdit.description || '');
      setFromDate(formatDate(workExpToEdit.from));
      setToDate(workExpToEdit.to || '');
    } else {
      setTitle('');
      setCompany('');
      setLocation('');
      setUrl('');
      setDescription('');
      setFromDate('');
      setToDate('');
    }
  }, [workExpToEdit]);

  const handleSaveAndClose = () => {
    if (!title.trim() || !company.trim() || !fromDate.trim()) {
      alert('Title, Company, and From Date are required.');
      return;
    }

    const workExpData = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim() || undefined,
      url: url.trim() || undefined,
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
    <div className="space-y-4 w-full">
      <SectionHeader
        title={workExpToEdit ? 'Edit Work Experience' : 'Work Experience'}
        description="Add your work experiences and responsibilities."
        onActionClick={handleSaveAndClose}
        actionText={workExpToEdit ? 'Save Changes' : 'Add Work'}
        onCancelClick={onDoneEditing}
        cancelText="Cancel"
      />

      <section>
        <div className="space-y-1 flex flex-row gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="work-from-date"
              className="block text-xs font-sans text-foreground"
            >
              From<sup>*</sup>
            </label>
            <SelectorDate
              id="work-from-date"
              value={fromDate}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setFromDate(e.target.value);
              }}
              placeholderOption={{
                value: '',
                label: 'Select Year',
                disabled: true,
              }}
              buttonDisplayValue={fromDate || 'Select Year'}
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="work-to-date"
              className="block text-xs font-sans  text-foreground"
            >
              To
            </label>
            <SelectorDate
              id="work-to-date"
              value={toDate}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setToDate(e.target.value);
              }}
              placeholderOption={{ value: '', label: 'Present' }}
              buttonDisplayValue={toDate || 'Present'}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="space-y-1 flex flex-row gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="work-title"
              className="block text-xs font-sans  text-foreground"
            >
              Title<sup>*</sup>
            </label>
            <Input
              type="text"
              id="work-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              placeholder="Designer, Engineer, etc"
              className="w-full text-sm font-sans placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="work-company"
              className="block text-xs font-sans text-foreground"
            >
              At Company<sup>*</sup>
            </label>
            <Input
              type="text"
              id="work-company"
              value={company}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCompany(e.target.value)
              }
              placeholder="Acme Inc."
              className="w-full text-sm font-sans placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="space-y-1 flex flex-row gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="work-location"
              className="block text-xs font-sans  text-foreground"
            >
              Location
            </label>
            <Input
              type="text"
              id="work-location"
              value={location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLocation(e.target.value)
              }
              placeholder="Where was it"
              className="w-full text-sm font-sans placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="work-url"
              className="block text-xs font-sans  text-foreground"
            >
              URL
            </label>
            <Input
              type="text"
              id="work-url"
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUrl(e.target.value)
              }
              placeholder="https://company.example.com"
              className="w-full text-sm font-sans placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="space-y-1 flex flex-row gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="Description"
              className="block text-xs font-sans  text-foreground "
            >
              Description
            </label>
            <Textarea
              id="Description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Describe your role and achievements..."
              className="w-full text-sm font-sans placeholder:text-muted-foreground min-h-[200px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
