import { Loaded } from 'jazz-tools';

import {
  Certification,
  ListOfCertification,
  OnboardingProfile,
} from '../schema';

type UseCertificationProps = {
  profile: Loaded<typeof OnboardingProfile>;
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
      const profileOwner = profile._owner;
      if (!profileOwner) {
        console.error(
          'Cannot initialize certification list: profile._owner is undefined.',
        );
        return undefined;
      }
      profile.certification = ListOfCertification.create([], {
        owner: profileOwner,
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

    const issuedDate = new Date(certificationData.issued);
    const expireDate = certificationData.expire;

    const newCertification = Certification.create(
      {
        name: certificationData.name,
        organization: certificationData.organization,
        url: certificationData.url,
        description: certificationData.description,
        issued: issuedDate,
        expire: expireDate,
      },
      { owner: listOwner },
    );
    certificationList.push(newCertification);
    triggerSyncIndicator();
    return newCertification;
  };

  const updateCertification = (
    certificationToUpdate: Loaded<typeof Certification>,
    dataToUpdate: Certification,
  ) => {
    if (!certificationToUpdate) {
      console.error('Certification instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      dataToUpdate.name !== undefined &&
      certificationToUpdate.name !== dataToUpdate.name
    ) {
      certificationToUpdate.name = dataToUpdate.name;
      changed = true;
    }

    if (
      dataToUpdate.organization !== undefined &&
      certificationToUpdate.organization !== dataToUpdate.organization
    ) {
      certificationToUpdate.organization = dataToUpdate.organization;
      changed = true;
    }

    if (dataToUpdate.hasOwnProperty('expire')) {
      if (certificationToUpdate.expire !== dataToUpdate.expire) {
        certificationToUpdate.expire = dataToUpdate.expire;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('url')) {
      if (certificationToUpdate.url !== dataToUpdate.url) {
        certificationToUpdate.url = dataToUpdate.url;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('description')) {
      if (certificationToUpdate.description !== dataToUpdate.description) {
        certificationToUpdate.description = dataToUpdate.description;
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
