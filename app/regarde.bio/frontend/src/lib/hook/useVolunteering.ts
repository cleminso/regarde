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
    if (!profile.$isLoaded) {
      logger.error('Profile is not loaded');
      return undefined;
    }

    if (profile.volunteering?.$isLoaded) {
      return profile.volunteering;
    }

    // Create new list if it doesn't exist
    const profileOwner = profile.$jazz.owner;
    if (!profileOwner?.$isLoaded) {
      logger.error(
        'Cannot create volunteering list: profile owner is not loaded',
      );
      return undefined;
    }

    const newVolunteeringList = ListOfVolunteering.create([], {
      owner: profileOwner,
    });
    profile.$jazz.set('volunteering', newVolunteeringList);
    return newVolunteeringList;
  };

  const addVolunteering = async (volunteeringData: {
    title: string;
    organization?: string;
    location?: string;
    url?: string;
    description?: string;
    from?: string;
    to?: string;
  }): Promise<Loaded<typeof Volunteering> | undefined> => {
    const volunteeringList = ensureVolunteeringList();
    if (!volunteeringList) return undefined;

    const listOwner = volunteeringList.$jazz.owner;
    if (!listOwner?.$isLoaded) {
      logger.error('Cannot create volunteering: list owner is not loaded');
      return undefined;
    }

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
    volunteeringList.$jazz.push(newVolunteering);
    await triggerSyncIndicator(profile);
    return newVolunteering;
  };

  const updateVolunteering = async (
    volunteeringToUpdate: Loaded<typeof Volunteering>,
    volunteeringData: {
      title: string;
      organization?: string;
      location?: string;
      url?: string;
      description?: string;
      from?: string;
      to?: string;
    },
  ) => {
    if (!volunteeringToUpdate.$isLoaded) {
      logger.error('Volunteering instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      volunteeringData.from !== undefined &&
      volunteeringToUpdate.from !== volunteeringData.from
    ) {
      volunteeringToUpdate.$jazz.set('from', volunteeringData.from);
      changed = true;
    }

    if (
      volunteeringData.title !== undefined &&
      volunteeringToUpdate.title !== volunteeringData.title
    ) {
      volunteeringToUpdate.$jazz.set('title', volunteeringData.title);
      changed = true;
    }

    if (
      volunteeringData.organization !== undefined &&
      volunteeringToUpdate.organization !== volunteeringData.organization
    ) {
      volunteeringToUpdate.$jazz.set(
        'organization',
        volunteeringData.organization,
      );
      changed = true;
    }

    if (volunteeringData.hasOwnProperty('to')) {
      if (volunteeringToUpdate.to !== volunteeringData.to) {
        volunteeringToUpdate.$jazz.set('to', volunteeringData.to);
        changed = true;
      }
    }

    if (volunteeringData.hasOwnProperty('location')) {
      if (volunteeringToUpdate.location !== volunteeringData.location) {
        volunteeringToUpdate.$jazz.set('location', volunteeringData.location);
        changed = true;
      }
    }

    if (volunteeringData.hasOwnProperty('url')) {
      if (volunteeringToUpdate.url !== volunteeringData.url) {
        volunteeringToUpdate.$jazz.set('url', volunteeringData.url);
        changed = true;
      }
    }

    if (volunteeringData.hasOwnProperty('description')) {
      if (volunteeringToUpdate.description !== volunteeringData.description) {
        volunteeringToUpdate.$jazz.set(
          'description',
          volunteeringData.description,
        );
        changed = true;
      }
    }

    if (changed) {
      await triggerSyncIndicator(profile);
    }
  };

  const deleteVolunteering = async (volunteeringId: string) => {
    if (!profile.$isLoaded) {
      logger.error('Profile is not loaded');
      return;
    }
    const volunteeringList = profile.volunteering;
    if (!volunteeringList?.$isLoaded) {
      logger.warn('No volunteering list to delete from or not loaded.');
      return;
    }
    const volunteeringIndex = volunteeringList.findIndex(
      (v: any) => v && v.$isLoaded && v.$jazz.id === volunteeringId,
    );

    if (volunteeringIndex !== -1) {
      volunteeringList.$jazz.splice(volunteeringIndex, 1);
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
