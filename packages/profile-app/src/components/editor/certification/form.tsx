import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { useCertification } from '#/lib/hook/useCertification';
import { Certification, type CleanLoadedJazzAppProfile } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils';
import { Input, Label, Textarea } from '../../ui/index';
import { EditorFooter } from '../layout/footer';
import { SectionHeader } from '../layout/header';
import { SelectorDate } from '../selectorDate';

type CertificationEditProps = {
  profile: CleanLoadedJazzAppProfile;
  triggerSyncIndicator: (profileObject?: any) => void;
  onDoneEditing: () => void;
  certificationToEdit?: Loaded<typeof Certification>;
};

export function CertificationEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  certificationToEdit,
}: CertificationEditProps) {
  const { addCertification, updateCertification } = useCertification({
    profile,
    triggerSyncIndicator,
  });

  const currentYear = new Date().getFullYear().toString();

  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [issuedDate, setIssuedDate] = useState(currentYear);
  const [expireDate, setExpireDate] = useState('');

  useEffect(() => {
    if (certificationToEdit) {
      setName(certificationToEdit.name || '');
      setOrganization(certificationToEdit.organization || '');
      setUrl(certificationToEdit.url || '');
      setDescription(certificationToEdit.description || '');
      setIssuedDate(certificationToEdit.issued || currentYear);
      setExpireDate(certificationToEdit.expire || '');
    } else {
      setName('');
      setOrganization('');
      setUrl('');
      setDescription('');
      setIssuedDate(currentYear);
      setExpireDate('');
    }
  }, [certificationToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!name.trim() || !organization.trim() || !issuedDate.trim()) {
      alert('Name, Organization, and Issued Date are required.');
      return;
    }

    const certificationData = {
      name: name.trim(),
      organization: organization.trim(),
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
      issued: issuedDate.trim(),
      expire: expireDate.trim() || undefined,
    };

    if (certificationToEdit) {
      updateCertification(certificationToEdit, certificationData);
    } else {
      addCertification(certificationData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="Certification"
          description="Add professional certifications."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="cert-issued-date">
                  Issued<sup>*</sup>
                </Label>
                <SelectorDate
                  id="cert-issued-date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  placeholderOption={{
                    value: '',
                    label: 'Select Year',
                    disabled: true,
                  }}
                  buttonDisplayValue={issuedDate || 'Select Year'}
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="cert-expire-date">Expires</Label>
                <SelectorDate
                  id="cert-expire-date"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                  placeholderOption={{ value: '', label: 'Never expires' }}
                  buttonDisplayValue={expireDate || 'Never expires'}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="cert-name">
                  Name<sup>*</sup>
                </Label>
                <Input
                  type="text"
                  id="cert-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="AWS Solutions Architect"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="cert-organization">
                  Organization<sup>*</sup>
                </Label>
                <Input
                  type="text"
                  id="cert-organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Amazon Web Services"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="cert-url">URL</Label>
              <Input
                type="text"
                id="cert-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="cert-description">Description</Label>
              <Textarea
                id="cert-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this certification covers"
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
