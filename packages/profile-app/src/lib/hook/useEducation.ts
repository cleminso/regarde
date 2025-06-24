import { Loaded } from 'jazz-tools';

import { Education, ListOfEducation, OnboardingProfile } from '../schema';

type UseEducationProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
};

export function useEducation({
  profile,
  triggerSyncIndicator,
}: UseEducationProps) {
  const ensureEducationList = ():
    | Loaded<typeof ListOfEducation>
    | undefined => {
    if (!profile.education) {
      const profileOwner = profile._owner;
      if (!profileOwner) {
        console.error(
          'Cannot initialize education list: profile._owner is undefined.',
        );
        return undefined;
      }
      profile.education = ListOfEducation.create([], {
        owner: profileOwner,
      });
    }
    return profile.education;
  };

  const addEducation = (
    educationData: Education,
  ): Loaded<typeof Education> | undefined => {
    const educationList = ensureEducationList();
    if (!educationList) return undefined;

    const listOwner = educationList._owner;
    if (!listOwner) {
      console.error(
        'Cannot create a new education instance: educationList._owner is undefined.',
      );
      return undefined;
    }

    const fromDate = new Date(educationData.from);
    const toDate = educationData.to;

    const newEducation = Education.create(
      {
        from: fromDate,
        to: toDate,
        degree: educationData.degree,
        institution: educationData.institution,
        location: educationData.location,
        url: educationData.url,
        description: educationData.description,
      },
      { owner: listOwner },
    );
    educationList.push(newEducation);
    triggerSyncIndicator();
    return newEducation;
  };

  const updateEducation = (
    educationToUpdate: Loaded<typeof Education>,
    dataToUpdate: Education,
  ) => {
    if (!educationToUpdate) {
      console.error('Education instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      dataToUpdate.degree !== undefined &&
      educationToUpdate.degree !== dataToUpdate.degree
    ) {
      educationToUpdate.degree = dataToUpdate.degree;
      changed = true;
    }

    if (
      dataToUpdate.institution !== undefined &&
      educationToUpdate.institution !== dataToUpdate.institution
    ) {
      educationToUpdate.institution = dataToUpdate.institution;
      changed = true;
    }

    if (dataToUpdate.hasOwnProperty('to')) {
      if (educationToUpdate.to !== dataToUpdate.to) {
        educationToUpdate.to = dataToUpdate.to;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('location')) {
      if (educationToUpdate.location !== dataToUpdate.location) {
        educationToUpdate.location = dataToUpdate.location;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('url')) {
      if (educationToUpdate.url !== dataToUpdate.url) {
        educationToUpdate.url = dataToUpdate.url;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('description')) {
      if (educationToUpdate.description !== dataToUpdate.description) {
        educationToUpdate.description = dataToUpdate.description;
        changed = true;
      }
    }

    if (changed) {
      triggerSyncIndicator();
    }
  };

  const deleteEducation = (educationId: string) => {
    const educationList = profile.education;
    if (!educationList) {
      console.warn('No education list to delete from.');
      return;
    }
    const educationIndex = educationList.findIndex(
      (e: any) => e && e.id === educationId,
    );

    if (educationIndex !== -1) {
      educationList.splice(educationIndex, 1);
      triggerSyncIndicator();
    } else {
      console.error(`Education with id ${educationId} not found for deletion.`);
    }
  };

  return {
    addEducation,
    updateEducation,
    deleteEducation,
  };
}
