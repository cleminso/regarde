import { Loaded } from 'jazz-tools';

import {
  ListOfVolunteering,
  Volunteering,

} from '../schema';

import { BaseHookProps } from './types';

type UseVolunteeringProps = BaseHookProps;

export function useVolunteering({
  profile,
  triggerSyncIndicator,
}: UseVolunteeringProps) {
  const ensureVolunteeringList = ():
    | Loaded<typeof ListOfVolunteering>
    | undefined => {
    if (!profile.volunteering) {
      const profileOwner = profile._owner;
      profile.volunteering = ListOfVolunteering.create([], {
        owner: profileOwner,
      });
    }
    return profile.volunteering;
  };

  const addVolunteering = (
    volunteeringData: {
      title: string;
      organization: string;
      location?: string;
      url?: string;
      description?: string;
      from: string;
      to?: string;
    }
  ): Loaded<typeof Volunteering> | undefined => {
    const volunteeringList = ensureVolunteeringList();
    if (!volunteeringList) return undefined;

    const listOwner = volunteeringList._owner;

    const newVolunteering = Volunteering.create(
      {
        title: volunteeringData.title,
        organization: volunteeringData.organization,
        location: volunteeringData.location,
        url: volunteeringData.url,
        description: volunteeringData.description,
        from: volunteeringData.from,
        to: volunteeringData.to,
      },
      { owner: listOwner },
    );
    volunteeringList.push(newVolunteering);
    triggerSyncIndicator(profile);
    return newVolunteering;
  };

  const updateVolunteering = (
    volunteeringToUpdate: Loaded<typeof Volunteering>,
    volunteeringData: {
      title: string;
      organization: string;
      location?: string;
      url?: string;
      description?: string;
      from: string;
      to?: string;
    }
  ) => {
    if (!volunteeringToUpdate) {
      console.error('Volunteering instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      volunteeringData.from !== undefined &&
      volunteeringToUpdate.from !== volunteeringData.from
    ) {
      volunteeringToUpdate.from = volunteeringData.from;
      changed = true;
    }

    if (
      volunteeringData.title !== undefined &&
      volunteeringToUpdate.title !== volunteeringData.title
    ) {
      volunteeringToUpdate.title = volunteeringData.title;
      changed = true;
    }

    if (
      volunteeringData.organization !== undefined &&
      volunteeringToUpdate.organization !== volunteeringData.organization
    ) {
      volunteeringToUpdate.organization = volunteeringData.organization;
      changed = true;
    }

    if (volunteeringData.hasOwnProperty('to')) {
      if (volunteeringToUpdate.to !== volunteeringData.to) {
        volunteeringToUpdate.to = volunteeringData.to;
        changed = true;
      }
    }

    if (volunteeringData.hasOwnProperty('location')) {
      if (volunteeringToUpdate.location !== volunteeringData.location) {
        volunteeringToUpdate.location = volunteeringData.location;
        changed = true;
      }
    }

    if (volunteeringData.hasOwnProperty('url')) {
      if (volunteeringToUpdate.url !== volunteeringData.url) {
        volunteeringToUpdate.url = volunteeringData.url;
        changed = true;
      }
    }

    if (volunteeringData.hasOwnProperty('description')) {
      if (volunteeringToUpdate.description !== volunteeringData.description) {
        volunteeringToUpdate.description = volunteeringData.description;
        changed = true;
      }
    }

    if (changed) {
      triggerSyncIndicator(profile);
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
      triggerSyncIndicator(profile);
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
