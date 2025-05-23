import { Loaded, z } from 'jazz-tools';

import { ListOfWorkExp, OnboardingProfile, WorkExp } from '../schema';

type WorkExpCreationData = z.input<typeof WorkExp>;
type WorkExpUpdateData = Partial<WorkExpCreationData>;

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
    workExpData: WorkExpCreationData,
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
    const toDate = workExpData.to ? new Date(workExpData.to) : undefined;

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
    dataToUpdate: WorkExpUpdateData,
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

    if (dataToUpdate.from !== undefined) {
      const newFromDate = new Date(dataToUpdate.from);
      if (workExpToUpdate.from.getTime() !== newFromDate.getTime()) {
        workExpToUpdate.from = newFromDate;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('to')) {
      const newToDate = dataToUpdate.to ? new Date(dataToUpdate.to) : undefined;
      const currentToDate = workExpToUpdate.to;
      if (newToDate?.getTime() !== currentToDate?.getTime()) {
        workExpToUpdate.to = newToDate;
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
    const workExpIndex = workExpList.findIndex((w) => w && w.id === workExpId);

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
