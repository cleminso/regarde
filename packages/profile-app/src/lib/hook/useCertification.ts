import { Loaded } from 'jazz-tools';

import {
  Certification,
  ListOfCertification,
  type CleanLoadedJazzAppProfile,
} from '../schema';

type UseCertificationProps = {
  profile: CleanLoadedJazzAppProfile;
  triggerSyncIndicator: () => void;
};

export function useCertification({
  profile,
  triggerSyncIndicator,
}: UseCertificationProps) {
  const ensureCertificationList = ():
    | Loaded<typeof ListOfCertification>
    | undefined => {
    if (!profile.certification) {
      profile.certification = ListOfCertification.create([], {
        owner: profile._owner,
      });
    }
    return profile.certification;
  };

  const addCertification = (
    certificationData: Certification,
  ): Loaded<typeof Certification> | undefined => {
    const certificationList = ensureCertificationList();
    if (!certificationList) return undefined;

    const listOwner = certificationList._owner;
    if (!listOwner) {
      console.error(
        'Cannot create a new certification instance: certificationList._owner is undefined.',
      );
      return undefined;
    }

    const newCertification = Certification.create(
      {
        name: certificationData.name,
        organization: certificationData.organization,
        issued: certificationData.issued,
        expire: certificationData.expire,
        url: certificationData.url,
        description: certificationData.description,
      },
      { owner: listOwner },
    );
    certificationList.push(newCertification);
    triggerSyncIndicator();
    return newCertification;
  };

  const updateCertification = (
    certificationToUpdate: Loaded<typeof Certification>,
    certificationData: Certification,
  ) => {
    if (!certificationToUpdate) {
      console.error('Certification instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      certificationData.name !== undefined &&
      certificationToUpdate.name !== certificationData.name
    ) {
      certificationToUpdate.name = certificationData.name;
      changed = true;
    }

    if (
      certificationData.organization !== undefined &&
      certificationToUpdate.organization !== certificationData.organization
    ) {
      certificationToUpdate.organization = certificationData.organization;
      changed = true;
    }

    if (
      certificationData.issued !== undefined &&
      certificationToUpdate.issued !== certificationData.issued
    ) {
      certificationToUpdate.issued = certificationData.issued;
      changed = true;
    }

    if (certificationData.hasOwnProperty('expire')) {
      if (certificationToUpdate.expire !== certificationData.expire) {
        certificationToUpdate.expire = certificationData.expire;
        changed = true;
      }
    }

    if (certificationData.hasOwnProperty('url')) {
      if (certificationToUpdate.url !== certificationData.url) {
        certificationToUpdate.url = certificationData.url;
        changed = true;
      }
    }

    if (certificationData.hasOwnProperty('description')) {
      if (certificationToUpdate.description !== certificationData.description) {
        certificationToUpdate.description = certificationData.description;
        changed = true;
      }
    }

    if (changed) {
      triggerSyncIndicator();
    }
  };

  const deleteCertification = (certificationId: string) => {
    const certificationList = profile.certification;
    if (!certificationList) {
      console.warn('No certification list to delete from.');
      return;
    }
    const certificationIndex = certificationList.findIndex(
      (c: any) => c && c.id === certificationId,
    );

    if (certificationIndex !== -1) {
      certificationList.splice(certificationIndex, 1);
      triggerSyncIndicator();
    } else {
      console.error(
        `Certification with id ${certificationId} not found for deletion.`,
      );
    }
  };

  return {
    addCertification,
    updateCertification,
    deleteCertification,
  };
}
