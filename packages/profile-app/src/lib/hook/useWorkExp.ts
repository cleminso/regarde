import { Loaded } from 'jazz-tools';

import { logger } from '#/lib/utils/logger';
import { ListOfWorkExp, WorkExp } from '../schema';
import { BaseHookProps } from './types';

type UseWorkExpProps = BaseHookProps;

export function useWorkExp({ profile, triggerSyncIndicator }: UseWorkExpProps) {
  const ensureWorkExpList = (): Loaded<typeof ListOfWorkExp> | undefined => {
    if (!profile.workExp) {
      const profileOwner = profile.$jazz.owner;
      const newWorkExpList = ListOfWorkExp.create([], {
        owner: profileOwner,
      });
      profile.$jazz.set("workExp", newWorkExpList);
      return newWorkExpList;
    }
    return profile.workExp;
  };

  const addWorkExp = async (workExpData: {
    title?: string;
    company?: string;
    location?: string;
    url?: string;
    description?: string;
    from?: string;
    to?: string;
  }): Promise<Loaded<typeof WorkExp> | undefined> => {
    const workExpList = ensureWorkExpList();
    if (!workExpList) return undefined;

    const listOwner = workExpList.$jazz.owner;

    const newWorkExp = WorkExp.create(
      {
        title: workExpData.title || 'Work Experience',
        company: workExpData.company,
        location: workExpData.location,
        url: workExpData.url,
        description: workExpData.description,
        from: workExpData.from,
        to: workExpData.to,
      },
      { owner: listOwner },
    );
    workExpList.$jazz.push(newWorkExp);
    await triggerSyncIndicator(profile);
    return newWorkExp;
  };

  const updateWorkExp = async (
    workExpToUpdate: Loaded<typeof WorkExp>,
    workExpData: {
      title?: string;
      company?: string;
      location?: string;
      url?: string;
      description?: string;
      from?: string;
      to?: string;
    },
  ) => {
    if (!workExpToUpdate) {
      logger.error('Work experience instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      workExpData.from !== undefined &&
      workExpToUpdate.from !== workExpData.from
    ) {
      workExpToUpdate.$jazz.set("from", workExpData.from);
      changed = true;
    }

    if (
      workExpData.title !== undefined &&
      workExpToUpdate.title !== workExpData.title
    ) {
      workExpToUpdate.$jazz.set("title", workExpData.title || 'Work Experience');
      changed = true;
    }

    if (
      workExpData.company !== undefined &&
      workExpToUpdate.company !== workExpData.company
    ) {
      workExpToUpdate.$jazz.set("company", workExpData.company);
      changed = true;
    }

    if (workExpData.hasOwnProperty('to')) {
      if (workExpToUpdate.to !== workExpData.to) {
        workExpToUpdate.$jazz.set("to", workExpData.to);
        changed = true;
      }
    }

    if (workExpData.hasOwnProperty('location')) {
      if (workExpToUpdate.location !== workExpData.location) {
        workExpToUpdate.$jazz.set("location", workExpData.location);
        changed = true;
      }
    }

    if (workExpData.hasOwnProperty('url')) {
      if (workExpToUpdate.url !== workExpData.url) {
        workExpToUpdate.$jazz.set("url", workExpData.url);
        changed = true;
      }
    }

    if (workExpData.hasOwnProperty('description')) {
      if (workExpToUpdate.description !== workExpData.description) {
        workExpToUpdate.$jazz.set("description", workExpData.description);
        changed = true;
      }
    }

    if (changed) {
      await triggerSyncIndicator(profile);
    }
  };

  const deleteWorkExp = async (workExpId: string) => {
    const workExpList = profile.workExp;
    if (!workExpList) {
      logger.warn('No work experiences list to delete from.');
      return;
    }
    const workExpIndex = workExpList.findIndex(
      (w: any) => w && w.$jazz.id === workExpId,
    );

    if (workExpIndex !== -1) {
      workExpList.$jazz.splice(workExpIndex, 1);
      await triggerSyncIndicator(profile);
    } else {
      logger.error(
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
