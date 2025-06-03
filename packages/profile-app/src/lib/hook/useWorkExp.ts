import { Loaded } from 'jazz-tools';

import { ListOfWorkExp, OnboardingProfile, WorkExp } from '../schema';

type UseWorkExpProps = {
  profile: Loaded<typeof OnboardingProfile>;
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

    const fromDate = new Date(workExpData.from);
    const toDate = workExpData.to;

    const newWorkExp = WorkExp.create(
      {
        title: workExpData.title,
        company: workExpData.company,
        location: workExpData.location,
        url: workExpData.url,
        description: workExpData.description,
        from: fromDate,
        to: toDate,
      },
      { owner: listOwner },
    );
    workExpList.push(newWorkExp);
    triggerSyncIndicator();
    return newWorkExp;
  };

  const updateWorkExp = (
    workExpToUpdate: Loaded<typeof WorkExp>,
    dataToUpdate: WorkExp,
  ) => {
    if (!workExpToUpdate) {
      console.error('Work experience instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      dataToUpdate.title !== undefined &&
      workExpToUpdate.title !== dataToUpdate.title
    ) {
      workExpToUpdate.title = dataToUpdate.title;
      changed = true;
    }

    if (
      dataToUpdate.company !== undefined &&
      workExpToUpdate.company !== dataToUpdate.company
    ) {
      workExpToUpdate.company = dataToUpdate.company;
      changed = true;
    }

    if (dataToUpdate.hasOwnProperty('to')) {
      if (workExpToUpdate.to !== dataToUpdate.to) {
        workExpToUpdate.to = dataToUpdate.to;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('location')) {
      if (workExpToUpdate.location !== dataToUpdate.location) {
        workExpToUpdate.location = dataToUpdate.location;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('url')) {
      if (workExpToUpdate.url !== dataToUpdate.url) {
        workExpToUpdate.url = dataToUpdate.url;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('description')) {
      if (workExpToUpdate.description !== dataToUpdate.description) {
        workExpToUpdate.description = dataToUpdate.description;
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
