import { Loaded } from 'jazz-tools';

import { logger } from '#/lib/utils/logger';
import { Education, ListOfEducation } from '../schema';
import { BaseHookProps } from './types';

type UseEducationProps = BaseHookProps;

export function useEducation({
  profile,
  triggerSyncIndicator,
}: UseEducationProps) {
  const ensureEducationList = ():
    | Loaded<typeof ListOfEducation>
    | undefined => {
    if (!profile.education) {
      const profileOwner = profile._owner;
      profile.education = ListOfEducation.create([], {
        owner: profileOwner,
      });
    }
    return profile.education;
  };

  const addEducation = (educationData: {
    from: string;
    to?: string;
    degree: string;
    institution: string;
    location?: string;
    url?: string;
    description?: string;
  }): Loaded<typeof Education> | undefined => {
    const educationList = ensureEducationList();
    if (!educationList) return undefined;

    const listOwner = educationList._owner;

    const newEducation = Education.create(
      {
        from: educationData.from,
        to: educationData.to,
        degree: educationData.degree,
        institution: educationData.institution,
        location: educationData.location,
        url: educationData.url,
        description: educationData.description,
      },
      { owner: listOwner },
    );
    educationList.push(newEducation);
    triggerSyncIndicator(profile);
    return newEducation;
  };

  const updateEducation = (
    educationToUpdate: Loaded<typeof Education>,
    educationData: {
      from: string;
      to?: string;
      degree: string;
      institution: string;
      location?: string;
      url?: string;
      description?: string;
    },
  ) => {
    if (!educationToUpdate) {
      logger.error('Education instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      educationData.from !== undefined &&
      educationToUpdate.from !== educationData.from
    ) {
      educationToUpdate.from = educationData.from;
      changed = true;
    }

    if (
      educationData.degree !== undefined &&
      educationToUpdate.degree !== educationData.degree
    ) {
      educationToUpdate.degree = educationData.degree;
      changed = true;
    }

    if (
      educationData.institution !== undefined &&
      educationToUpdate.institution !== educationData.institution
    ) {
      educationToUpdate.institution = educationData.institution;
      changed = true;
    }

    if (educationData.hasOwnProperty('to')) {
      if (educationToUpdate.to !== educationData.to) {
        educationToUpdate.to = educationData.to;
        changed = true;
      }
    }

    if (educationData.hasOwnProperty('location')) {
      if (educationToUpdate.location !== educationData.location) {
        educationToUpdate.location = educationData.location;
        changed = true;
      }
    }

    if (educationData.hasOwnProperty('url')) {
      if (educationToUpdate.url !== educationData.url) {
        educationToUpdate.url = educationData.url;
        changed = true;
      }
    }

    if (educationData.hasOwnProperty('description')) {
      if (educationToUpdate.description !== educationData.description) {
        educationToUpdate.description = educationData.description;
        changed = true;
      }
    }

    if (changed) {
      triggerSyncIndicator(profile);
    }
  };

  const deleteEducation = (educationId: string) => {
    const educationList = profile.education;
    if (!educationList) {
      logger.warn('No education list to delete from.');
      return;
    }
    const educationIndex = educationList.findIndex(
      (e: any) => e && e.id === educationId,
    );

    if (educationIndex !== -1) {
      educationList.splice(educationIndex, 1);
      triggerSyncIndicator(profile);
    } else {
      logger.error(`Education with id ${educationId} not found for deletion.`);
    }
  };

  return {
    addEducation,
    updateEducation,
    deleteEducation,
  };
}
