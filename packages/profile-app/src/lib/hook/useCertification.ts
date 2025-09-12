import { Loaded } from 'jazz-tools';

import { logger } from '#/lib/utils/logger';
import { Certification, ListOfCertification } from '../schema';
import { BaseHookProps } from './types';

type UseCertificationProps = BaseHookProps;

export function useCertification({
  profile,
  triggerSyncIndicator,
}: UseCertificationProps) {
  const ensureCertificationList = ():
    | Loaded<typeof ListOfCertification>
    | undefined => {
    if (!profile.certification) {
      const newCertificationList = ListOfCertification.create([], {
        owner: profile.$jazz.owner,
      });
      profile.$jazz.set("certification", newCertificationList);
      return newCertificationList;
    }
    return profile.certification;
  };

  const addCertification = async (certificationData: {
    name: string;
    organization?: string;
    issued?: string;
    expire?: string;
    url?: string;
    description?: string;
  }): Promise<Loaded<typeof Certification> | undefined> => {
    const certificationList = ensureCertificationList();
    if (!certificationList) return undefined;

    const listOwner = certificationList.$jazz.owner;
    if (!listOwner) {
      logger.error(
        'Cannot create a new certification instance: certificationList.$jazz.owner is undefined.',
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
    certificationList.$jazz.push(newCertification);
    await triggerSyncIndicator(profile);
    return newCertification;
  };

  const updateCertification = async (
    certificationToUpdate: Loaded<typeof Certification>,
    certificationData: {
      name: string;
      organization?: string;
      issued?: string;
      expire?: string;
      url?: string;
      description?: string;
    },
  ) => {
    if (!certificationToUpdate) {
      logger.error('Certification instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      certificationData.name !== undefined &&
      certificationToUpdate.name !== certificationData.name
    ) {
      certificationToUpdate.$jazz.set("name",certificationData.name);
      changed = true;
    }

    if (
      certificationData.organization !== undefined &&
      certificationToUpdate.organization !== certificationData.organization
    ) {
      certificationToUpdate.$jazz.set("organization", certificationData.organization);
      changed = true;
    }

    if (
      certificationData.issued !== undefined &&
      certificationToUpdate.issued !== certificationData.issued
    ) {
      certificationToUpdate.$jazz.set("issued", certificationData.issued);
      changed = true;
    }

    if (certificationData.hasOwnProperty('expire')) {
      if (certificationToUpdate.expire !== certificationData.expire) {
        certificationToUpdate.$jazz.set("expire", certificationData.expire);
        changed = true;
      }
    }

    if (certificationData.hasOwnProperty('url')) {
      if (certificationToUpdate.url !== certificationData.url) {
        certificationToUpdate.$jazz.set("url", certificationData.url);
        changed = true;
      }
    }

    if (certificationData.hasOwnProperty('description')) {
      if (certificationToUpdate.description !== certificationData.description) {
        certificationToUpdate.$jazz.set("description", certificationData.description);
        changed = true;
      }
    }

    if (changed) {
      await triggerSyncIndicator(profile);
    }
  };

  const deleteCertification = async (certificationId: string) => {
    const certificationList = profile.certification;
    if (!certificationList) {
      logger.warn('No certification list to delete from.');
      return;
    }
    const certificationIndex = certificationList.findIndex(
      (c: any) => c && c.$jazz.id === certificationId,
    );

    if (certificationIndex !== -1) {
      certificationList.$jazz.splice(certificationIndex, 1);
      await triggerSyncIndicator(profile);
    } else {
      logger.error(
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
