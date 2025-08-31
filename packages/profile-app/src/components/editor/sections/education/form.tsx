import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useEducation } from '#/lib/hook/useEducation';
import { Education, JazzAppProfile } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils/utils';
import { Input, Textarea } from '../../../ui/index';
import { EditorFooter } from '../../layout/footer';
import { SectionHeader } from '../../layout/header';
import { SelectorDate } from '../../shared/selectorDate';

type EducationEditProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onDoneEditing: () => void;
  educationToEdit?: Loaded<typeof Education>;
};

export function EducationEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  educationToEdit,
}: EducationEditProps) {
  const { addEducation, updateEducation } = useEducation({
    profile,
    triggerSyncIndicator,
  });

  const currentYear = new Date().getFullYear().toString();

  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [fromDate, setFromDate] = useState(currentYear);
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (educationToEdit) {
      setDegree(educationToEdit.degree || '');
      setInstitution(educationToEdit.institution || '');
      setLocation(educationToEdit.location || '');
      setUrl(educationToEdit.url || '');
      setDescription(educationToEdit.description || '');
      setFromDate(educationToEdit.from || currentYear);
      setToDate(educationToEdit.to || '');
    } else {
      setDegree('');
      setInstitution('');
      setLocation('');
      setUrl('');
      setDescription('');
      setFromDate(currentYear);
      setToDate('');
    }
  }, [educationToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!degree.trim() || !institution.trim() || !fromDate.trim()) {
      alert('Degree, Institution, and From Date are required.');
      return;
    }

    const educationData = {
      degree: degree.trim(),
      institution: institution.trim(),
      location: location.trim() || undefined,
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
      from: fromDate.trim(),
      to: toDate.trim() || undefined,
    };

    if (educationToEdit) {
      updateEducation(educationToEdit, educationData);
    } else {
      addEducation(educationData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="Education"
          description="Showcase your academic background and achievements."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  From<sup>*</sup>
                </label>
                <SelectorDate
                  id="education-from-date"
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
                  id="education-to-date"
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
                  Degree<sup>*</sup>
                </label>
                <Input
                  type="text"
                  id="education-degree"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="Bachelor's, Master's, PhD..."
                />
              </div>

              <div className="flex flex-col md:flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  Institution<sup>*</sup>
                </label>
                <Input
                  type="text"
                  id="education-institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="University of Dream"
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
                  id="education-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State/Province, Country"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  URL
                </label>
                <Input
                  type="text"
                  id="education-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://university.edu"
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
                id="education-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notable achievements, something that makes your degree memorable..."
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
