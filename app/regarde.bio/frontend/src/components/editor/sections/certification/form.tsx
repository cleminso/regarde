import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useCertification } from '#/lib/hook/useCertification';
import { Certification, RegardeProfile } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils/utils';
import { Input, Textarea } from '../../../ui/index';
import { EditorFooter } from '../../layout/footer';
import { SectionHeader } from '../../layout/header';
import { SelectorDate } from '../../shared/selectorDate';

type CertificationEditProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
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
    if (!name.trim()) {
      const shouldContinue = confirm(
        'Adding the certification name helps visitors understand your credentials. Would you like to save anyway?',
      );
      if (!shouldContinue) return;
    }

    const certificationData = {
      name: name.trim(),
      organization: organization.trim() || undefined,
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
      issued: issuedDate.trim() || undefined,
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
    <div className="flex h-full flex-col lg:h-full">
      <div className="mobile-form-bottom flex-1 lg:flex-1 lg:pb-0">
        <SectionHeader
          title="Certification"
          description="Add professional certifications."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  Name<sup>*</sup>
                </label>
                <Input
                  type="text"
                  id="cert-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="AWS Solutions Architect"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  Organization
                </label>
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
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  Issued
                </label>
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

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  Expires
                </label>
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
            <div className="flex w-full flex-col gap-2">
              <label className="text-foreground block font-sans text-sm">
                URL
              </label>
              <Input
                type="text"
                id="cert-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com"
              />
            </div>
          </section>

          <section>
            <div className="flex w-full flex-col gap-2">
              <label className="text-foreground block font-sans text-sm">
                Description
              </label>
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
