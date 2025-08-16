import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { useVolunteering } from '../../../lib/hook/useVolunteering';
import {
  Volunteering,
  type CleanLoadedJazzAppProfile,
} from '../../../lib/schema';
import { getValidUrl } from '../../../lib/utils';
import { Input, Label, Textarea } from '../../ui/index';
import { EditorFooter } from '../layout/footer';
import { SectionHeader } from '../layout/header';
import { SelectorDate } from '../selectorDate';

type VolunteeringEditProps = {
  profile: CleanLoadedJazzAppProfile;
  triggerSyncIndicator: (profileObject?: any) => void;
  onDoneEditing: () => void;
  volunteeringToEdit?: Loaded<typeof Volunteering>;
};

export function VolunteeringEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  volunteeringToEdit,
}: VolunteeringEditProps) {
  const { addVolunteering, updateVolunteering } = useVolunteering({
    profile,
    triggerSyncIndicator,
  });

  const currentYear = new Date().getFullYear().toString();

  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [fromDate, setFromDate] = useState(currentYear);
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (volunteeringToEdit) {
      setTitle(volunteeringToEdit.title || '');
      setOrganization(volunteeringToEdit.organization || '');
      setLocation(volunteeringToEdit.location || '');
      setUrl(volunteeringToEdit.url || '');
      setDescription(volunteeringToEdit.description || '');
      setFromDate(volunteeringToEdit.from || currentYear);
      setToDate(volunteeringToEdit.to || '');
    } else {
      setTitle('');
      setOrganization('');
      setLocation('');
      setUrl('');
      setDescription('');
      setFromDate(currentYear);
      setToDate('');
    }
  }, [volunteeringToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!title.trim() || !organization.trim() || !fromDate.trim()) {
      alert('Title, Organization, and From Date are required.');
      return;
    }

    const volunteeringData = {
      title: title.trim(),
      organization: organization.trim(),
      location: location.trim() || undefined,
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
      from: fromDate.trim(),
      to: toDate.trim() || undefined,
    };

    if (volunteeringToEdit) {
      updateVolunteering(volunteeringToEdit, volunteeringData);
    } else {
      addVolunteering(volunteeringData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="Volunteering"
          description="Share your volunteer work and community involvement."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="volunteering-from-date">
                  From<sup>*</sup>
                </Label>
                <SelectorDate
                  id="volunteering-from-date"
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
                <Label htmlFor="volunteering-to-date">To</Label>
                <SelectorDate
                  id="volunteering-to-date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholderOption={{ value: '', label: 'Now' }}
                  buttonDisplayValue={toDate || 'Now'}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="volunteering-title">
                  Title<sup>*</sup>
                </Label>
                <Input
                  type="text"
                  id="volunteering-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="I've been..."
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="volunteering-organization">
                  At Organization<sup>*</sup>
                </Label>
                <Input
                  type="text"
                  id="volunteering-organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="At which organization"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="volunteering-location">Location</Label>
                <Input
                  type="text"
                  id="volunteering-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where did you volunteer"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="volunteering-url">URL</Label>
                <Input
                  type="text"
                  id="volunteering-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://organization.org"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="volunteering-description">Description</Label>
              <Textarea
                id="volunteering-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your volunteer work and impact..."
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
