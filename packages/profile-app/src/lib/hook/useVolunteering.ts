import { Loaded } from 'jazz-tools';

import { ListOfVolunteering, OnboardingProfile, Volunteering } from '../schema';

type UseVolunteeringProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
};

export function useVolunteering({
  profile,
  triggerSyncIndicator,
}: UseVolunteeringProps) {
  const ensureVolunteeringList = ():
    | Loaded<typeof ListOfVolunteering>
    | undefined => {
    if (!profile.volunteering) {
      const profileOwner = profile._owner;
      if (!profileOwner) {
        console.error(
          'Cannot initialize volunteering list: profile._owner is undefined.',
        );
        return undefined;
      }
      profile.volunteering = ListOfVolunteering.create([], {
        owner: profileOwner,
      });
    }
    return profile.volunteering;
  };

  const addVolunteering = (
    volunteeringData: Volunteering,
  ): Loaded<typeof Volunteering> | undefined => {
    const volunteeringList = ensureVolunteeringList();
    if (!volunteeringList) return undefined;

    const listOwner = volunteeringList._owner;
    if (!listOwner) {
      console.error(
        'Cannot create a new volunteering instance: volunteeringList._owner is undefined.',
      );
      return undefined;
    }

    const fromDate = new Date(volunteeringData.from);
    const toDate = volunteeringData.to;

    const newVolunteering = Volunteering.create(
      {
        title: volunteeringData.title,
        organization: volunteeringData.organization,
        location: volunteeringData.location,
        url: volunteeringData.url,
        description: volunteeringData.description,
        from: fromDate,
        to: toDate,
      },
      { owner: listOwner },
    );
    volunteeringList.push(newVolunteering);
    triggerSyncIndicator();
    return newVolunteering;
  };

  const updateVolunteering = (
    volunteeringToUpdate: Loaded<typeof Volunteering>,
    dataToUpdate: Volunteering,
  ) => {
    if (!volunteeringToUpdate) {
      console.error('Volunteering instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      dataToUpdate.title !== undefined &&
      volunteeringToUpdate.title !== dataToUpdate.title
    ) {
      volunteeringToUpdate.title = dataToUpdate.title;
      changed = true;
    }

    if (
      dataToUpdate.organization !== undefined &&
      volunteeringToUpdate.organization !== dataToUpdate.organization
    ) {
      volunteeringToUpdate.organization = dataToUpdate.organization;
      changed = true;
    }

    if (dataToUpdate.hasOwnProperty('to')) {
      if (volunteeringToUpdate.to !== dataToUpdate.to) {
        volunteeringToUpdate.to = dataToUpdate.to;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('location')) {
      if (volunteeringToUpdate.location !== dataToUpdate.location) {
        volunteeringToUpdate.location = dataToUpdate.location;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('url')) {
      if (volunteeringToUpdate.url !== dataToUpdate.url) {
        volunteeringToUpdate.url = dataToUpdate.url;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('description')) {
      if (volunteeringToUpdate.description !== dataToUpdate.description) {
        volunteeringToUpdate.description = dataToUpdate.description;
        changed = true;
      }
    }

    if (changed) {
      triggerSyncIndicator();
    }
  };

  const deleteVolunteering = (volunteeringId: string) => {
    const volunteeringList = profile.volunteering;
    if (!volunteeringList) {
      console.warn('No volunteering list to delete from.');
      return;
    }
    const volunteeringIndex = volunteeringList.findIndex(
      (v: any) => v && v.id === volunteeringId,
    );

    if (volunteeringIndex !== -1) {
      volunteeringList.splice(volunteeringIndex, 1);
      triggerSyncIndicator();
    } else {
      console.error(
        `Volunteering with id ${volunteeringId} not found for deletion.`,
      );
    }
  };

  return {
    addVolunteering,
    updateVolunteering,
    deleteVolunteering,
  };
}
