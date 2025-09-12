import { Loaded } from 'jazz-tools';

import { logger } from '#/lib/utils/logger';
import { ListOfSideProject, SideProject } from '../schema';
import { BaseHookProps } from './types';

type UseSideProjectProps = BaseHookProps;

export function useSideProject({
  profile,
  triggerSyncIndicator,
}: UseSideProjectProps) {
  const ensureSideProjectList = ():
    | Loaded<typeof ListOfSideProject>
    | undefined => {
    if (!profile.sideProject) {
      const profileOwner = profile.$jazz.owner;
      const newSideProjectList = ListOfSideProject.create([], {
        owner: profileOwner,
      });
      profile.$jazz.set("sideProject", newSideProjectList);
      return newSideProjectList;
    }
    return profile.sideProject;
  };

  const addSideProject = async (sideProjectData: {
    title: string;
    year?: string;
    client?: string;
    url?: string;
    description?: string;
  }): Promise<Loaded<typeof SideProject> | undefined> => {
    const sideProjectList = ensureSideProjectList();
    if (!sideProjectList) return undefined;

    const listOwner = sideProjectList.$jazz.owner;

    const newSideProject = SideProject.create(
      {
        title: sideProjectData.title,
        year: sideProjectData.year,
        client: sideProjectData.client,
        url: sideProjectData.url,
        description: sideProjectData.description,
      },
      { owner: listOwner },
    );
    sideProjectList.$jazz.push(newSideProject);
    await triggerSyncIndicator(profile);
    return newSideProject;
  };

  const updateSideProject = async (
    sideProjectToUpdate: Loaded<typeof SideProject>,
    sideProjectData: {
      title: string;
      year?: string;
      client?: string;
      url?: string;
      description?: string;
    },
  ) => {
    if (!sideProjectToUpdate) {
      logger.error('Side project instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      sideProjectData.title !== undefined &&
      sideProjectToUpdate.title !== sideProjectData.title
    ) {
      sideProjectToUpdate.$jazz.set("title", sideProjectData.title);
      changed = true;
    }

    if (
      sideProjectData.year !== undefined &&
      sideProjectToUpdate.year !== sideProjectData.year
    ) {
      sideProjectToUpdate.$jazz.set("year", sideProjectData.year);
      changed = true;
    }

    if (sideProjectData.hasOwnProperty('client')) {
      if (sideProjectToUpdate.client !== sideProjectData.client) {
        sideProjectToUpdate.$jazz.set("client", sideProjectData.client);
        changed = true;
      }
    }

    if (sideProjectData.hasOwnProperty('url')) {
      if (sideProjectToUpdate.url !== sideProjectData.url) {
        sideProjectToUpdate.$jazz.set("url", sideProjectData.url);
        changed = true;
      }
    }

    if (sideProjectData.hasOwnProperty('description')) {
      if (sideProjectToUpdate.description !== sideProjectData.description) {
        sideProjectToUpdate.$jazz.set("description", sideProjectData.description);
        changed = true;
      }
    }

    if (changed) {
      await triggerSyncIndicator(profile);
    }
  };

  const deleteSideProject = async (sideProjectId: string) => {
    const sideProjectList = profile.sideProject;
    if (!sideProjectList) {
      logger.warn('No side projects list to delete from.');
      return;
    }
    const sideProjectIndex = sideProjectList.findIndex(
      (s: any) => s && s.$jazz.id === sideProjectId,
    );

    if (sideProjectIndex !== -1) {
      sideProjectList.$jazz.splice(sideProjectIndex, 1);
      await triggerSyncIndicator(profile);
    } else {
      logger.error(
        `Side project with id ${sideProjectId} not found for deletion.`,
      );
    }
  };

  return {
    addSideProject,
    updateSideProject,
    deleteSideProject,
  };
}
