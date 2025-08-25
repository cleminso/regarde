import { Loaded } from 'jazz-tools';

import { logger } from '#/lib/utils/logger';
import { ListOfVolunteering, Volunteering } from '../schema';
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

  const addVolunteering = async (volunteeringData: {
    title: string;
    organization: string;
    location?: string;
    url?: string;
    description?: string;
    from: string;
    to?: string;
  }): Promise<Loaded<typeof Volunteering> | undefined> => {
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
    await triggerSyncIndicator(profile);
    return newVolunteering;
  };

  const updateVolunteering = async (
    volunteeringToUpdate: Loaded<typeof Volunteering>,
    volunteeringData: {
      title: string;
      organization: string;
      location?: string;
      url?: string;
      description?: string;
      from: string;
      to?: string;
    },
  ) => {
    if (!volunteeringToUpdate) {
      logger.error('Volunteering instance not provided for update.');
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
      await triggerSyncIndicator(profile);
    }
  };

  const deleteVolunteering = async (volunteeringId: string) => {
    const volunteeringList = profile.volunteering;
    if (!volunteeringList) {
      logger.warn('No volunteering list to delete from.');
      return;
    }
    const volunteeringIndex = volunteeringList.findIndex(
      (v: any) => v && v.id === volunteeringId,
    );

    if (volunteeringIndex !== -1) {
      volunteeringList.splice(volunteeringIndex, 1);
      await triggerSyncIndicator(profile);
    } else {
      logger.error(
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
