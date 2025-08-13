import { Loaded } from 'jazz-tools';

import {
  ListOfWorkExp,
  WorkExp,
  type CleanLoadedJazzAppProfile,
} from '../schema';

type UseWorkExpProps = {
  profile: CleanLoadedJazzAppProfile;
  triggerSyncIndicator: () => void;
};

export function useWorkExp({ profile, triggerSyncIndicator }: UseWorkExpProps) {
  const ensureWorkExpList = (): Loaded<typeof ListOfWorkExp> | undefined => {
    if (!profile.workExp) {
      const profileOwner = profile._owner;
      if (!profileOwner) {
        console.error(
          'Cannot initialize work experiences list: profile._owner is undefined.',
        );
        return undefined;
      }
      profile.workExp = ListOfWorkExp.create([], {
        owner: profileOwner,
      });
    }
    return profile.workExp;
  };

  const addWorkExp = (
    workExpData: WorkExp,
  ): Loaded<typeof WorkExp> | undefined => {
    const workExpList = ensureWorkExpList();
    if (!workExpList) return undefined;

    const listOwner = workExpList._owner;
    if (!listOwner) {
      console.error(
        'Cannot create a new work experience instance: workExpList._owner is undefined.',
      );
      return undefined;
    }

    const newWorkExp = WorkExp.create(
      {
        title: workExpData.title,
        company: workExpData.company,
        location: workExpData.location,
        url: workExpData.url,
        description: workExpData.description,
        from: workExpData.from,
        to: workExpData.to,
      },
      { owner: listOwner },
    );
    workExpList.push(newWorkExp);
    triggerSyncIndicator();
    return newWorkExp;
  };

  const updateWorkExp = (
    workExpToUpdate: Loaded<typeof WorkExp>,
    workExpData: WorkExp,
  ) => {
    if (!workExpToUpdate) {
      console.error('Work experience instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      workExpData.from !== undefined &&
      workExpToUpdate.from !== workExpData.from
    ) {
      workExpToUpdate.from = workExpData.from;
      changed = true;
    }

    if (
      workExpData.title !== undefined &&
      workExpToUpdate.title !== workExpData.title
    ) {
      workExpToUpdate.title = workExpData.title;
      changed = true;
    }

    if (
      workExpData.company !== undefined &&
      workExpToUpdate.company !== workExpData.company
    ) {
      workExpToUpdate.company = workExpData.company;
      changed = true;
    }

    if (workExpData.hasOwnProperty('to')) {
      if (workExpToUpdate.to !== workExpData.to) {
        workExpToUpdate.to = workExpData.to;
        changed = true;
      }
    }

    if (workExpData.hasOwnProperty('location')) {
      if (workExpToUpdate.location !== workExpData.location) {
        workExpToUpdate.location = workExpData.location;
        changed = true;
      }
    }

    if (workExpData.hasOwnProperty('url')) {
      if (workExpToUpdate.url !== workExpData.url) {
        workExpToUpdate.url = workExpData.url;
        changed = true;
      }
    }

    if (workExpData.hasOwnProperty('description')) {
      if (workExpToUpdate.description !== workExpData.description) {
        workExpToUpdate.description = workExpData.description;
        changed = true;
      }
    }

    if (changed) {
      triggerSyncIndicator();
    }
  };

  const deleteWorkExp = (workExpId: string) => {
    const workExpList = profile.workExp;
    if (!workExpList) {
      console.warn('No work experiences list to delete from.');
      return;
    }
    const workExpIndex = workExpList.findIndex(
      (w: any) => w && w.id === workExpId,
    );

    if (workExpIndex !== -1) {
      workExpList.splice(workExpIndex, 1);
      triggerSyncIndicator();
    } else {
      console.error(
        `Work experience with id ${workExpId} not found for deletion.`,
      );
    }
  };

  return {
    addWorkExp,
    updateWorkExp,
    deleteWorkExp,
  };
}
